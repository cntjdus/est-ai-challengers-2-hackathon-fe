-- First enable Cron (pg_cron) and pg_net in Supabase Dashboard.
-- In Vault create/update these two secrets before running this file:
-- hk_project_url = https://YOUR_PROJECT_REF.supabase.co
-- hk_push_cron_secret = same 32+ character PUSH_CRON_SECRET as the Edge Function
-- Run only after deploying send-notifications. This starts real scheduled delivery.
do $$ begin
  if not exists(select 1 from vault.decrypted_secrets where name='hk_project_url')
    or not exists(select 1 from vault.decrypted_secrets where name='hk_push_cron_secret' and length(decrypted_secret)>=32) then
    raise exception 'Vault에 hk_project_url과 hk_push_cron_secret을 먼저 등록해주세요.';
  end if;
end $$;
-- UTC 00:00..11:00 = Korea 09:00..20:00; one run each hour.
-- A named cron job is updated on repeated execution.
select cron.schedule('hk-push-hourly','0 0-11 * * *',$job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='hk_project_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name='hk_push_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$job$);
-- Stop later with: select cron.unschedule('hk-push-hourly');
