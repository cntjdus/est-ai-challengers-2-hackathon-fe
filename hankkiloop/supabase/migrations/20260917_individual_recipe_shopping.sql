-- Existing 한끼루프 schema and inventory audit triggers are required.
-- Run in Supabase SQL Editor before installing the frontend. Re-runnable.
begin;
alter table public.shopping_items add column if not exists purchased_at timestamptz;
alter table public.shopping_items add column if not exists is_selected boolean not null default true;
create unique index if not exists hk_inventory_shopping_source_unique
  on public.inventory_items(source_shopping_item_id) where source_shopping_item_id is not null;

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
  if exists(select 1 from jsonb_array_elements(p_items) item where not (item ? 'purchase_quantity'))
    and exists(select 1 from public.shopping_plan_recipes r join public.shopping_plans p on p.id=r.plan_id
    where r.user_id=auth.uid() and r.recipe_id=p_recipe and p.status in ('draft','ready')) then
    raise exception '이미 장바구니에 담긴 레시피입니다. 장바구니에서 구매량을 수정해주세요.';
  end if;
  select title into strict v_title from public.recipes where id=p_recipe;
  insert into public.shopping_plans(id,user_id,title,status,calculated_at) values(p_id,auth.uid(),v_title,'ready',now());
  insert into public.shopping_plan_recipes(plan_id,user_id,recipe_id,servings) values(p_id,auth.uid(),p_recipe,p_servings);
  for x in select value from jsonb_array_elements(p_items) loop
    v_required := (x->>'required_quantity')::numeric;
    v_available := (x->>'available_quantity')::numeric;
    -- Explicit ingredient selection purchases the chosen amount, even with enough stock.
    if x ? 'purchase_quantity' then
      v_required := (x->>'purchase_quantity')::numeric;
      v_available := 0;
    end if;
    if v_required is null or v_available is null or v_required <= 0 or v_required >= 1000000000
      or v_available < 0 or v_available >= 1000000000 or x->>'unit' is null or x->>'unit' not in ('g','ml','ea') then
      raise exception '지원하지 않는 수량 또는 단위입니다. 단위를 먼저 확인해주세요.';
    end if;
    select coalesce(sum(allocated_inventory_quantity),0) into v_reserved from public.shopping_items
      where user_id=auth.uid() and food_id=(x->>'food_id')::uuid and unit=x->>'unit' and purchased_at is null;
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

-- Dedicated endpoint prevents older whole-recipe RPCs from silently handling individual adds.
create or replace function public.hk_add_recipe_ingredient_shopping(p_id uuid, p_recipe uuid, p_servings numeric, p_items jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception '재료 한 개를 선택해주세요.';
  end if;
  if jsonb_array_length(p_items) <> 1 or not ((p_items->0) ? 'purchase_quantity') then
    raise exception '재료 한 개와 구매량을 확인해주세요.';
  end if;
  perform public.hk_add_recipe_shopping(p_id, p_recipe, p_servings, p_items);
end $$;
revoke all on function public.hk_add_recipe_ingredient_shopping(uuid,uuid,numeric,jsonb) from public,anon;
grant execute on function public.hk_add_recipe_ingredient_shopping(uuid,uuid,numeric,jsonb) to authenticated;

create or replace function public.hk_update_shopping(p_changes jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare x jsonb; v_item public.shopping_items%rowtype; v_count integer;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':shopping',0));
  if p_changes is null or jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 100 then raise exception '변경할 품목을 확인해주세요.'; end if;
  for x in select value from jsonb_array_elements(p_changes) loop
    select * into v_item from public.shopping_items where id=(x->>'id')::uuid and user_id=auth.uid() and purchased_at is null for update;
    if not found or v_item.package_count is distinct from (x->>'expected_count')::integer then raise exception '장바구니가 변경되었습니다. 다시 불러와 주세요.'; end if;
    if (x->>'remove')::boolean then
      delete from public.shopping_items where id=v_item.id and user_id=auth.uid();
    else
      v_count := (x->>'count')::integer;
      if v_count is null or v_count not between 1 and 1000000 or x->>'selected' is null then raise exception '구매 수량을 확인해주세요.'; end if;
      update public.shopping_items set package_count=v_count, planned_purchase_quantity=package_quantity_snapshot*v_count,
        is_selected=(x->>'selected')::boolean where id=v_item.id and user_id=auth.uid();
    end if;
  end loop;
  delete from public.shopping_items i where i.user_id=auth.uid() and i.purchased_at is null and i.planned_purchase_quantity=0
    and not exists(select 1 from public.shopping_items s where s.plan_id=i.plan_id and s.planned_purchase_quantity>0 and s.purchased_at is null);
  update public.shopping_plans p set status=case when exists(select 1 from public.shopping_items s where s.plan_id=p.id and s.purchased_at is not null) then 'completed' else 'cancelled' end
    where p.user_id=auth.uid() and p.status in ('ready','draft')
    and not exists(select 1 from public.shopping_items s where s.plan_id=p.id and s.purchased_at is null);
end $$;

create or replace function public.hk_checkout_shopping(p_items jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare x jsonb; v_item public.shopping_items%rowtype; v_food_name text;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':shopping',0));
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception '구매할 품목을 확인해주세요.'; end if;
  for x in select value from jsonb_array_elements(p_items) order by value->>'shopping_item_id' loop
    select * into v_item from public.shopping_items where id=(x->>'shopping_item_id')::uuid and user_id=auth.uid() for update;
    if not found then raise exception '장바구니 품목을 찾을 수 없습니다.'; end if;
    if v_item.purchased_at is not null then continue; end if;
    if v_item.unit is distinct from x->>'unit' then raise exception '구매 단위를 확인해주세요.'; end if;
    if v_item.package_count is distinct from (x->>'expected_count')::integer then raise exception '구매량이 다른 화면에서 변경됐습니다. 장바구니를 다시 불러와 주세요.'; end if;
    if x->>'expiry_date' is null or x->>'purchased_on' is null or (x->>'expiry_date')::date < (x->>'purchased_on')::date
      or x->>'quantity' is null or (x->>'quantity')::numeric <= 0 or (x->>'quantity')::numeric >= 1000000000
      or (x->>'quantity')::numeric <> round((x->>'quantity')::numeric,4) then
      raise exception '구매량, 구매일과 소비기한을 확인해주세요.';
    end if;
    select name into strict v_food_name from public.food_items where id=v_item.food_id;
    insert into public.inventory_items(id,user_id,display_name,quantity,unit,storage_type,purchased_on,source_shopping_item_id,food_id)
      values((x->>'id')::uuid,auth.uid(),trim(x->>'display_name'),(x->>'quantity')::numeric,x->>'unit',
        x->>'storage_type',(x->>'purchased_on')::date,v_item.id,
        case when trim(x->>'display_name')=v_food_name then v_item.food_id else null end);
    insert into public.inventory_dates(inventory_id,user_id,date_type,date_value,source,is_tracking)
      values((x->>'id')::uuid,auth.uid(),'use_by',(x->>'expiry_date')::date,'manual',true);
    update public.shopping_items set purchased_at=now() where id=v_item.id and user_id=auth.uid();
  end loop;
  update public.shopping_plans p set status='completed' where p.user_id=auth.uid() and p.status in ('ready','draft')
    and not exists(select 1 from public.shopping_items s where s.plan_id=p.id and s.purchased_at is null and s.planned_purchase_quantity>0);
  update public.shopping_items i set purchased_at=now() from public.shopping_plans p
    where i.plan_id=p.id and i.user_id=auth.uid() and p.status='completed' and i.purchased_at is null;
end $$;

revoke all on function public.hk_add_recipe_shopping(uuid,uuid,numeric,jsonb) from public,anon;
revoke all on function public.hk_update_shopping(jsonb) from public,anon;
revoke all on function public.hk_checkout_shopping(jsonb) from public,anon;
grant execute on function public.hk_add_recipe_shopping(uuid,uuid,numeric,jsonb) to authenticated;
grant execute on function public.hk_update_shopping(jsonb) to authenticated;
grant execute on function public.hk_checkout_shopping(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
