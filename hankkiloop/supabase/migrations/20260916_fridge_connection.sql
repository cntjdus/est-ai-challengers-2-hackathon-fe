-- 기존 hankkiloop_supabase_full.sql이 적용된 프로젝트에서 실행.
-- 테이블 삭제/초기화 없이 원래 RLS 및 수량 변경 RPC를 사용합니다.
begin;

create or replace function public.hk_register_inventory_batch(p_items jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare x jsonb; v_id uuid; existing public.inventory_items%rowtype;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception '등록할 재료를 확인해주세요.';
  end if;
  for x in select value from jsonb_array_elements(p_items) loop
    v_id := (x->>'id')::uuid;
    if x->>'expiry_date' is null or x->>'purchased_on' is null or (x->>'expiry_date')::date < (x->>'purchased_on')::date then
      raise exception '구매일과 소비기한을 확인해주세요.';
    end if;
    -- Same UUID retries are serialized, including retries before the first response arrives.
    perform pg_advisory_xact_lock(hashtextextended(v_id::text, 0));
    select * into existing from public.inventory_items where id = v_id and user_id = auth.uid();
    if found then
      if existing.display_name is distinct from x->>'display_name'
        or existing.quantity is distinct from (x->>'quantity')::numeric
        or existing.unit is distinct from x->>'unit'
        or existing.storage_type is distinct from x->>'storage_type'
        or existing.purchased_on is distinct from (x->>'purchased_on')::date
        or not exists (select 1 from public.inventory_dates where inventory_id = v_id and user_id = auth.uid() and date_value = (x->>'expiry_date')::date and is_tracking) then
        raise exception '이미 처리된 등록입니다. 냉장고를 새로고침해주세요.';
      end if;
      continue;
    end if;
    insert into public.inventory_items(id,user_id,display_name,quantity,unit,storage_type,purchased_on)
      values(v_id,auth.uid(),x->>'display_name',(x->>'quantity')::numeric,x->>'unit',x->>'storage_type',(x->>'purchased_on')::date);
    insert into public.inventory_dates(inventory_id,user_id,date_type,date_value,source,is_tracking)
      values(v_id,auth.uid(),'use_by',(x->>'expiry_date')::date,'manual',true);
  end loop;
end $$;

create or replace function public.hk_edit_inventory_item(
  p_id uuid, p_expected_updated_at timestamptz, p_name text,
  p_quantity numeric, p_storage text, p_date date
) returns void language plpgsql security invoker set search_path = '' as $$
declare v_item public.inventory_items%rowtype; v_date uuid;
begin
  select * into v_item from public.inventory_items where id=p_id and user_id=auth.uid() for update;
  if not found then raise exception '재료를 찾을 수 없습니다.'; end if;
  if v_item.updated_at is distinct from p_expected_updated_at then
    raise exception '다른 화면에서 재고가 변경됐습니다. 새로고침 후 다시 수정해주세요.';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity >= 1000000000 or p_quantity::text in ('NaN','Infinity','-Infinity') or p_quantity <> round(p_quantity,4) then raise exception '수량은 소수점 네 자리 이내의 양수로 입력해주세요.'; end if;
  if p_date < v_item.purchased_on then raise exception '소비기한은 구매일보다 빠를 수 없습니다.'; end if;
  perform public.change_inventory_quantity(p_id,p_quantity-v_item.quantity,'active',gen_random_uuid());
  update public.inventory_items set display_name=trim(p_name), storage_type=p_storage where id=p_id and user_id=auth.uid();
  if p_date is null then
    perform public.select_inventory_tracking_date(p_id,null);
  elsif not exists(select 1 from public.inventory_dates where inventory_id=p_id and is_tracking and date_value=p_date) then
    insert into public.inventory_dates(inventory_id,user_id,date_type,date_value,source)
      values(p_id,auth.uid(),'use_by',p_date,'manual') returning id into v_date;
    perform public.select_inventory_tracking_date(p_id,v_date);
  end if;
end $$;

create or replace function public.hk_change_inventory_batch(p_changes jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare x jsonb;
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) > 100 then raise exception '차감 요청을 확인해주세요.'; end if;
  -- All lots succeed or roll back together. Stable lock order avoids deadlocks.
  for x in select value from jsonb_array_elements(p_changes) order by value->>'id' loop
    perform public.change_inventory_quantity((x->>'id')::uuid,(x->>'delta')::numeric,x->>'status',(x->>'request_id')::uuid);
  end loop;
end $$;

revoke all on function public.hk_register_inventory_batch(jsonb) from public, anon;
revoke all on function public.hk_edit_inventory_item(uuid,timestamptz,text,numeric,text,date) from public, anon;
revoke all on function public.hk_change_inventory_batch(jsonb) from public, anon;
grant execute on function public.hk_register_inventory_batch(jsonb) to authenticated;
grant execute on function public.hk_edit_inventory_item(uuid,timestamptz,text,numeric,text,date) to authenticated;
grant execute on function public.hk_change_inventory_batch(jsonb) to authenticated;
-- 기존 프로필 저장 코드는 updated_at을 직접 전송하지 않도록 수정됩니다.
-- 선호 upsert에 필요한 권한. 소유자 RLS는 그대로 유지됩니다.
grant insert, update on public.user_preferences to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
notify pgrst, 'reload schema';
commit;
