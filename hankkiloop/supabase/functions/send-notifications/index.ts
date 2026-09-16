import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import webpush from 'npm:web-push@3.6.7'
import { dispatchPush } from '../_shared/pushJobs.js'

// Scheduled server call only. Never callable with a browser's publishable key.
Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const secret = Deno.env.get('PUSH_CRON_SECRET')
  if (!secret || secret.length < 32 || request.headers.get('x-cron-secret') !== secret) return new Response('Unauthorized', { status: 401 })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')!
    const privateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')!
    const subject = Deno.env.get('WEB_PUSH_SUBJECT')!
    if (!url || !serviceKey || !publicKey || !privateKey || !subject) throw new Error('Missing server configuration')
    const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const stats = await dispatchPush(client, async (subscription: object, payload: object) => {
      const details = webpush.generateRequestDetails(subscription, JSON.stringify(payload), {
        TTL: 3600, urgency: 'normal', vapidDetails: { subject, publicKey, privateKey },
      })
      // No redirects to arbitrary endpoints; endpoint is allowlisted by dispatchPush.
      const response = await fetch(details.endpoint, { method: 'POST', headers: details.headers, body: details.body, redirect: 'error', signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw Object.assign(new Error('Push provider rejected request'), { statusCode: response.status })
    })
    return Response.json(stats)
  } catch {
    // Logs deliberately exclude subscription keys, endpoints and credentials.
    return Response.json({ error: 'Notification job failed; inspect database and function configuration.' }, { status: 500 })
  }
})
