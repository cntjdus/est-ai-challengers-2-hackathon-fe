import { describe, expect, it, vi } from 'vitest'
import { allowedPushEndpoint, dispatchPush, expiryJobs } from '../supabase/functions/_shared/pushJobs'
import { createExpiryNotifications } from '../src/data/notifications'

const now = new Date('2026-09-16T01:00:00Z') // 10:00 KST
const inventory = [{ id: 'lot', user_id: 'u', status: 'active', display_name: '두부', tracking_date: '2026-09-18' }]
function fixture({ read = false, enabled = true } = {}) {
  const state = { hk_push_subscriptions: [{ id: 's', user_id: 'u', endpoint: 'https://fcm.googleapis.com/send/abc', p256dh: 'a', auth: 'b' }], user_preferences: [{ user_id: 'u', expiry_alert_enabled: enabled, recipe_suggestion_enabled: false }], inventory_overview: inventory, hk_notification_reads: read ? [{user_id:'u',notification_id:'inventory:lot:2026-09-18:expiry'}] : [], hk_push_deliveries: [] }
  const claims = new Set()
  return { state, client: {
    from(table) {
      let filters = [], mode = 'select', patch, first = false, range
      const q = {
        select: () => q, order: () => q, eq: (k,v) => { filters.push([k,v]); return q },
        range: (a,b) => { range = [a,b]; return q }, maybeSingle: () => { first = true; return q },
        update: data => { mode='update'; patch=data; return q }, delete: () => { mode='delete'; return q },
        then(resolve) {
          let rows = state[table].filter(r => filters.every(([k,v]) => r[k] === v))
          if (mode==='delete') state[table] = state[table].filter(r => !rows.includes(r))
          if (mode==='update') rows.forEach(r => Object.assign(r,patch))
          if (range) rows = rows.slice(range[0],range[1]+1)
          return Promise.resolve(resolve({data: first ? rows[0] : rows,error:null}))
        },
      }; return q
    },
    rpc: vi.fn(async (_name, params) => {
      const key = params.p_subscription + params.p_notification
      if (claims.has(key)) return {data:false}
      claims.add(key); state.hk_push_deliveries.push({subscription_id:params.p_subscription,notification_id:params.p_notification})
      return {data:true}
    }),
  } }
}
describe('server push delivery', () => {
  it('rejects arbitrary URLs, credentials and redirects as destinations', () => {
    for (const url of ['http://fcm.googleapis.com/x','https://localhost/x','https://fcm.googleapis.com.evil.test/x','https://u:p@fcm.googleapis.com/x','https://127.0.0.1/x','https://fcm.googleapis.com:444/x']) expect(allowedPushEndpoint(url)).toBe(false)
    for (const url of ['https://fcm.googleapis.com/x','https://updates.push.services.mozilla.com/wpush/v2/a','https://web.push.apple.com/a']) expect(allowedPushEndpoint(url)).toBe(true)
  })
  it('uses the same expiry notification identity as the app across the KST date boundary', () => {
    const date = new Date('2026-09-15T15:01:00Z')
    const server = expiryJobs(inventory, date)
    const browser = createExpiryNotifications([{id:'lot',name:'두부',expiryDate:'2026-09-18',amount:1,unit:'개'}], date)
    expect(browser[0].id).toBe(server[0].id)
    expect(browser[0].daysLeft).toBe(2)
  })
  it('sends once per event/device and suppresses read or disabled notifications', async () => {
    const {client,state} = fixture(); const send = vi.fn().mockResolvedValue()
    expect((await dispatchPush(client, send, now)).sent).toBe(1)
    expect((await dispatchPush(client, send, now)).sent).toBe(0)
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0][1]).toMatchObject({userId:'u',path:'/fridge/lot'})
    expect(state.hk_push_deliveries[0].sent_at).toBe(now.toISOString())
    expect((await dispatchPush(fixture({read:true}).client, send, now)).sent).toBe(0)
    expect((await dispatchPush(fixture({enabled:false}).client, send, now)).sent).toBe(0)
    expect((await dispatchPush(fixture().client, send, new Date('2026-09-16T14:00:00Z'))).sent).toBe(0)
  })
  it('removes expired subscriptions and keeps transient failures unsent for retry', async () => {
    const expired = fixture()
    const stats = await dispatchPush(expired.client, vi.fn().mockRejectedValue({statusCode:410}), now)
    expect(stats.expired).toBe(1)
    expect(expired.state.hk_push_subscriptions).toEqual([])
    const retry = fixture()
    expect((await dispatchPush(retry.client, vi.fn().mockRejectedValue({statusCode:503}), now)).failed).toBe(1)
    expect(retry.state.hk_push_deliveries[0].sent_at).toBeUndefined()
  })
})
