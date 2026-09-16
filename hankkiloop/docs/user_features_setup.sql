-- Run after docs/shopping_setup.sql. Re-runnable; does not reset existing data.
begin;
create table if not exists public.hk_recipe_saves (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,recipe_id)
);
create index if not exists hk_recipe_saves_recipe_idx on public.hk_recipe_saves(recipe_id);
create table if not exists public.hk_notification_reads (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  notification_id text not null check(length(notification_id) between 1 and 250),
  read_at timestamptz not null default now(),
  primary key(user_id,notification_id)
);
create table if not exists public.hk_food_unit_conversions (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  food_id uuid not null references public.food_items(id) on delete cascade,
  unit text not null check(unit in ('g','ml','ea','pack','bundle','tbsp','tsp')),
  base_quantity numeric(14,4) not null check(base_quantity>0 and base_quantity<1000000000),
  primary key(user_id,food_id,unit)
);
create index if not exists hk_food_units_food_idx on public.hk_food_unit_conversions(food_id);
create table if not exists public.hk_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint text not null unique check(length(endpoint) between 1 and 2048),
  p256dh text not null check(length(p256dh) between 80 and 100),
  auth text not null check(length(auth) between 20 and 30),
  created_at timestamptz not null default now()
);
create index if not exists hk_push_subscriptions_user_idx on public.hk_push_subscriptions(user_id);
create table if not exists public.hk_push_deliveries (
  subscription_id uuid not null references public.hk_push_subscriptions(id) on delete cascade,
  notification_id text not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key(subscription_id,notification_id)
);
-- Explicit table grants AND row policies are both required by the Data API.
do $$ declare t text; begin
  foreach t in array array['hk_recipe_saves','hk_notification_reads','hk_food_unit_conversions','hk_push_subscriptions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('drop policy if exists hk_owner on public.%I',t);
    execute format('create policy hk_owner on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
  end loop;
end $$;
alter table public.hk_push_deliveries enable row level security;
revoke all on public.hk_push_deliveries from anon,authenticated;
grant all on public.hk_push_deliveries,public.hk_push_subscriptions to service_role;
grant select on public.hk_recipe_saves,public.hk_notification_reads,public.hk_food_unit_conversions to service_role;

create or replace function public.hk_unit_factor(p_food uuid,p_unit text)
returns numeric language sql stable security invoker set search_path='' as $$
  select case when f.base_unit=p_unit then 1
    else coalesce((select c.base_quantity from public.hk_food_unit_conversions c
      where c.user_id=auth.uid() and c.food_id=f.id and c.unit=p_unit),
      case when f.base_unit='ml' and p_unit='tbsp' then 15 when f.base_unit='ml' and p_unit='tsp' then 5 end) end
  from public.food_items f where f.id=p_food
$$;
revoke all on function public.hk_unit_factor(uuid,text) from public,anon;
grant execute on function public.hk_unit_factor(uuid,text) to authenticated;

-- Claim atomically; a failed worker's lease can be retried after 10 minutes.
create or replace function public.hk_claim_push(p_subscription uuid,p_notification text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  insert into public.hk_push_deliveries(subscription_id,notification_id) values(p_subscription,p_notification)
  on conflict(subscription_id,notification_id) do update set claimed_at=now()
    where hk_push_deliveries.sent_at is null and hk_push_deliveries.claimed_at<now()-interval '10 minutes';
  get diagnostics n = row_count;
  return n=1;
end $$;
revoke all on function public.hk_claim_push(uuid,text) from public,anon,authenticated;
grant execute on function public.hk_claim_push(uuid,text) to service_role;
create or replace function public.hk_add_recipe_shopping(p_id uuid, p_recipe uuid, p_servings numeric, p_items jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare x jsonb; v_required numeric; v_available numeric; v_allocated numeric; v_reserved numeric; v_title text;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':shopping',0));
  if p_id is null or p_recipe is null or p_servings is null or p_servings <= 0 or p_servings > 1000
    or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception '레시피와 인분을 확인해주세요.';
  end if;
  if exists(select 1 from public.shopping_plans where id=p_id and user_id=auth.uid()) then
    if not exists(select 1 from public.shopping_plan_recipes where plan_id=p_id and user_id=auth.uid() and recipe_id=p_recipe and servings=p_servings) then
      raise exception '다른 요청에 사용된 장보기 ID입니다.';
    end if;
    return;
  end if;
  if exists(select 1 from public.shopping_plan_recipes r join public.shopping_plans p on p.id=r.plan_id
    where r.user_id=auth.uid() and r.recipe_id=p_recipe and p.status in ('draft','ready')) then
    raise exception '이미 장바구니에 담긴 레시피입니다. 장바구니에서 구매량을 수정해주세요.';
  end if;
  select title into strict v_title from public.recipes where id=p_recipe;
  insert into public.shopping_plans(id,user_id,title,status,calculated_at) values(p_id,auth.uid(),v_title,'ready',now());
  insert into public.shopping_plan_recipes(plan_id,user_id,recipe_id,servings) values(p_id,auth.uid(),p_recipe,p_servings);
  for x in select value from jsonb_array_elements(p_items) loop
    v_required := (x->>'required_quantity')::numeric;
    v_available := (x->>'available_quantity')::numeric;
    if v_required is null or v_available is null or v_required <= 0 or v_required >= 1000000000
      or v_available < 0 or v_available >= 1000000000 or x->>'unit' is null or x->>'unit' not in ('g','ml','ea') then
      raise exception '지원하지 않는 수량 또는 단위입니다. 단위를 먼저 확인해주세요.';
    end if;
    if exists(select 1 from public.shopping_items s where s.user_id=auth.uid()
      and s.food_id=(x->>'food_id')::uuid and s.purchased_at is null and s.allocated_inventory_quantity>0
      and s.unit<>x->>'unit' and (public.hk_unit_factor(s.food_id,s.unit) is null
        or public.hk_unit_factor(s.food_id,x->>'unit') is null)) then
      raise exception '기존 장바구니의 재고 배정 단위를 환산할 수 없어요. 환산 기준을 복구하거나 해당 장바구니를 먼저 완료·삭제해주세요.';
    end if;
    select coalesce(sum(s.allocated_inventory_quantity * case when s.unit=x->>'unit' then 1
      else public.hk_unit_factor(s.food_id,s.unit)/public.hk_unit_factor(s.food_id,x->>'unit') end),0)
      into v_reserved from public.shopping_items s
      where s.user_id=auth.uid() and s.food_id=(x->>'food_id')::uuid and s.purchased_at is null;
    v_allocated := least(v_required,greatest(0,v_available-v_reserved));
    insert into public.shopping_items(plan_id,user_id,food_id,unit,required_quantity,allocated_inventory_quantity,
      planned_purchase_quantity,package_count,package_quantity_snapshot)
    values(p_id,auth.uid(),(x->>'food_id')::uuid,x->>'unit',v_required,v_allocated,
      v_required-v_allocated,case when v_required>v_allocated then 1 else null end,
      case when v_required>v_allocated then v_required-v_allocated else null end);
  end loop;
  if not exists(select 1 from public.shopping_items where plan_id=p_id and planned_purchase_quantity>0) then
    raise exception '현재 부족한 재료가 없습니다.';
  end if;
end $$;
notify pgrst,'reload schema';
commit;
