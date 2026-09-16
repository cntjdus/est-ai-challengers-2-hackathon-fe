import { loadRecipeCatalog, recipeStock } from '../../../src/data/recipeApi.js'
import { personalizeRecipes } from '../../../src/data/personalization.js'
import { koreaDate } from '../../../src/data/notificationDate.js'

export function allowedPushEndpoint(endpoint) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash &&
      (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' || url.hostname === 'web.push.apple.com' || url.hostname.endsWith('.push.apple.com'))
  } catch { return false }
}

export function expiryJobs(rows, now = new Date()) {
  const today = Date.parse(koreaDate(now) + 'T00:00:00Z')
  return rows.flatMap(row => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.tracking_date ?? '')) return []
    const days = Math.round((Date.parse(row.tracking_date + 'T00:00:00Z') - today) / 86400000)
    if (!Number.isFinite(days) || days > 10) return []
    const category = days <= 5 ? 'expiry' : 'coach'
    return [{ id: `inventory:${row.id}:${row.tracking_date}:${category}`, title: '한끼루프 · ' + row.display_name,
      body: days < 0 ? '소비기한이 지났어요. 제품 표시와 보관 상태를 확인해주세요.' : `소비기한 ${days === 0 ? '오늘까지' : days + '일 전'} · 냉장고를 확인해주세요.`, path: '/fridge/' + row.id }]
  })
}

async function checked(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}
async function pages(query) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const data = await checked(query().range(offset, offset + 499))
    rows.push(...data)
    if (data.length < 500) return rows
  }
}

export async function dispatchPush(client, send, now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', hourCycle: 'h23' }).format(now))
  const stats = { sent: 0, failed: 0, skipped: 0, expired: 0 }
  if (hour < 9 || hour >= 21) return stats
  const subscriptions = await pages(() => client.from('hk_push_subscriptions').select('*').order('id'))
  const users = [...new Set(subscriptions.map(s => s.user_id))]
  for (const userId of users) {
    const prefs = await checked(client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle())
    if (!prefs || (!prefs.expiry_alert_enabled && !prefs.recipe_suggestion_enabled)) continue
    const rows = await pages(() => client.from('inventory_overview').select('*').eq('user_id', userId).eq('status', 'active').order('id'))
    let jobs = prefs.expiry_alert_enabled ? expiryJobs(rows, now) : []
    if (prefs.recipe_suggestion_enabled && hour >= 11) {
      const catalog = await loadRecipeCatalog(client, userId)
      const stock = recipeStock(rows.map(r => ({ id: r.id, dbRow: r })), catalog.foods, catalog.aliases, catalog.conversions)
      const ranked = personalizeRecipes(catalog.recipes, { allergies: prefs.allergies, excludedIngredients: prefs.excluded_ingredients, dietStyles: prefs.preferred_tastes }, stock.inventory)
      const recipe = ranked[hour >= 17 ? 1 : 0]
      if (recipe) jobs.push({ id: `menu:${recipe.id}:${koreaDate(now)}`, deliveryId: `menu:${hour >= 17 ? 'dinner' : 'lunch'}:${koreaDate(now)}`, title: '한끼루프 · 오늘의 메뉴', body: recipe.title, path: '/recipe/' + recipe.id })
    }
    const reads = new Set((await pages(() => client.from('hk_notification_reads').select('notification_id').eq('user_id', userId).order('notification_id'))).map(r => r.notification_id))
    jobs = jobs.filter(j => !reads.has(j.id))
    for (const subscription of subscriptions.filter(s => s.user_id === userId)) {
      if (!allowedPushEndpoint(subscription.endpoint)) { stats.skipped++; continue }
      for (const job of jobs) {
        // Prevent a second worker from concurrently sending the same event/device.
        const deliveryId = job.deliveryId ?? job.id
        const claimed = await checked(client.rpc('hk_claim_push', { p_subscription: subscription.id, p_notification: deliveryId }))
        if (!claimed) { stats.skipped++; continue }
        try {
          await send({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, { ...job, userId })
          await checked(client.from('hk_push_deliveries').update({ sent_at: now.toISOString() }).eq('subscription_id', subscription.id).eq('notification_id', deliveryId))
          stats.sent++
        } catch (error) {
          stats.failed++
          if ([404, 410].includes(error.statusCode)) {
            await checked(client.from('hk_push_subscriptions').delete().eq('id', subscription.id))
            stats.expired++; break
          }
          // Retain the lease. The next scheduled invocation retries after 10 min.
        }
      }
    }
  }
  return stats
}
