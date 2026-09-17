import assert from 'node:assert/strict'
import { normalizeTags, appendTag, collectPreferenceDraft, blankPreferences } from '../src/utils/preferenceDraft.js'
import { isValidNickname } from '../src/utils/profileValidation.js'
import { frequencyFromCount, preferencePayload, mapAccount, loadAccount, saveAccount } from '../src/auth/profile.js'
import { authErrorMessage, readCallbackError } from '../src/auth/errors.js'
import { signOutAccount } from '../src/auth/signOut.js'

let passed = 0
let failed = 0
async function check(name, run) {
  try { await run(); passed++; console.log('PASS ' + name) }
  catch (error) { failed++; console.error('FAIL ' + name + ': ' + error.message) }
}
const prefs = { ...blankPreferences, cookingFrequency: '5+', dietStyles: ['한식'], excludedIngredients: [] }
const alerts = { expirationAlert: true, recipeSuggestionAlert: false }
const user = { id: 'user-a', email: 'test@example.com', user_metadata: { full_name: 'Google Name' } }
const savedData = { profile: { id: user.id, display_name: '성한', onboarding_completed_at: '2026-09-17T00:00:00Z' }, preferences: { user_id: user.id, cooking_frequency: '5+', preferred_tastes: ['한식'], excluded_ingredients: ['오이'], allergies: ['우유'], expiry_alert_enabled: true, recipe_suggestion_enabled: false } }
function chain(result) {
  const query = { select: () => query, eq: () => query, maybeSingle: () => query, single: () => query, upsert: () => query, then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) }
  return query
}
await check('tags: whitespace and duplicate normalization', () => assert.deepEqual(normalizeTags([' 한식 ', '한식', '', '양식']), ['한식', '양식']))
await check('tags: reject non-array', () => assert.throws(() => normalizeTags('한식')))
await check('tags: reject non-string items', () => assert.throws(() => normalizeTags([42])))
await check('tags: reject more than 50 entries', () => assert.throws(() => normalizeTags(Array(51).fill('a'))))
await check('tags: reject overlong entry', () => assert.throws(() => normalizeTags(['a'.repeat(51)])))
await check('tags: accept 50 Korean characters', () => assert.equal(normalizeTags(['가'.repeat(50)])[0].length, 50))
await check('draft: includes unsubmitted diet, avoid and allergy inputs', () => {
  const result = collectPreferenceDraft(prefs, { dietKeyword: '# 양식 ', ingredientInput: ' 오이 ', allergyInput: ' 우유 ' })
  assert.deepEqual(result.dietStyles, ['한식', '양식']); assert.deepEqual(result.excludedIngredients, ['오이']); assert.deepEqual(result.allergies, ['우유'])
})
await check('draft: duplicate pending input is deduplicated', () => assert.deepEqual(collectPreferenceDraft(prefs, { dietKeyword: '#한식' }).dietStyles, ['한식']))
await check('draft: collecting does not mutate source', () => { const before = JSON.stringify(prefs); collectPreferenceDraft(prefs, { ingredientInput: '오이' }); assert.equal(JSON.stringify(prefs), before) })
await check('draft: invalid pending entry is rejected', () => assert.throws(() => collectPreferenceDraft(prefs, { allergyInput: 'a'.repeat(51) })))
await check('draft: hash-only input does not become a tag', () => assert.deepEqual(appendTag([], '### ', true), []))
await check('defaults: no sample exclusions or dietary tags', () => { assert.deepEqual(blankPreferences.excludedIngredients, []); assert.deepEqual(blankPreferences.dietStyles, []) })
await check('nickname: valid Korean/English/digits', () => { for (const name of ['성한', 'user09', ' 성한 ']) assert.equal(isValidNickname(name), true) })
await check('nickname: invalid types, punctuation and lengths', () => { for (const name of [null, undefined, 42, 'a', 'ab!', 'a'.repeat(13)]) assert.equal(isValidNickname(name), false) })
await check('legacy: cooking count buckets are preserved', () => assert.deepEqual([0, 1, 2, 3, 4, 5, 10].map(frequencyFromCount), ['0', '1-2', '1-2', '3-4', '3-4', '5+', '5+']))
await check('payload: omitted allergies and exact counts remain omitted', () => { const { allergies: _omitted, ...legacy } = prefs; const result = preferencePayload(user.id, legacy, alerts); assert.equal('allergies' in result, false); assert.equal('weekly_cooking_count' in result, false); assert.equal('expiry_alert_days' in result, false) })
await check('payload: explicit empty allergies can clear existing tags', () => assert.deepEqual(preferencePayload(user.id, prefs, alerts).allergies, []))
await check('payload: false alerts are not coerced to true', () => assert.equal(preferencePayload(user.id, prefs, { ...alerts, expirationAlert: false }).expiry_alert_enabled, false))
await check('payload: reject invalid alert values', () => assert.throws(() => preferencePayload(user.id, prefs, { expirationAlert: 'false', recipeSuggestionAlert: false })))
await check('payload: reject invalid cooking bucket', () => assert.throws(() => preferencePayload(user.id, { ...prefs, cookingFrequency: '999' }, alerts)))
await check('mapping: stored values and identity are returned', () => { const result = mapAccount(user, savedData.profile, savedData.preferences); assert.equal(result.account.id, user.id); assert.equal(result.nickname, '성한'); assert.deepEqual(result.preferences.allergies, ['우유']); assert.deepEqual(result.alerts, alerts) })
await check('mapping: legacy zero cooks remains zero', () => assert.equal(mapAccount(user, savedData.profile, { weekly_cooking_count: 0 }).preferences.cookingFrequency, '0'))
await check('mapping: reject non-HTTPS profile images', () => assert.equal(mapAccount(user, { ...savedData.profile, avatar_url: 'javascript:alert(1)' }, null).account.avatarUrl, ''))
await check('load: existing profile is never overwritten', async () => { let reads = 0; const result = await loadAccount({ from: table => { reads++; return chain({ data: table === 'profiles' ? savedData.profile : savedData.preferences, error: null }) } }, user); assert.equal(reads, 2); assert.equal(result.nickname, '성한') })
await check('save: one RPC with authenticated user, no extra table writes/reads', async () => {
  let calls = 0
  const client = { rpc: async (name, args) => { calls++; assert.equal(name, 'hk_save_my_profile'); assert.equal(args.p_draft.user_id, user.id); assert.equal(args.p_complete_onboarding, false); assert.equal(args.p_draft.display_name, '성한'); assert.equal('user_id' in args.p_draft.preferences, false); return { data: savedData, error: null } }, from: () => { throw new Error('unexpected table request') } }
  const result = await saveAccount(client, user, { nickname: ' 성한 ', preferences: prefs, alerts, account: { id: 'other-user' } })
  assert.equal(calls, 1); assert.deepEqual(result.preferences.allergies, ['우유'])
})
await check('save: onboarding flag forwarded', async () => { await saveAccount({ rpc: async (_name, args) => { assert.equal(args.p_complete_onboarding, true); return { data: savedData, error: null } } }, user, { nickname: '성한', preferences: prefs, alerts }, true) })
await check('save: RPC failure propagates without sequential fallback', async () => { const failure = { code: '42501' }; await assert.rejects(saveAccount({ rpc: async () => ({ data: null, error: failure }) }, user, { nickname: '성한', preferences: prefs, alerts }), error => error === failure) })
await check('save: returned cross-account identity is rejected', async () => { await assert.rejects(saveAccount({ rpc: async () => ({ data: { ...savedData, profile: { ...savedData.profile, id: 'other-user' } }, error: null }) }, user, { nickname: '성한', preferences: prefs, alerts }), /Session changed/) })
await check('save: validation happens before any request', async () => { let called = false; await assert.rejects(saveAccount({ rpc: () => { called = true } }, user, { nickname: '!', preferences: prefs, alerts })); assert.equal(called, false) })
await check('save: missing session is rejected before request', async () => { await assert.rejects(saveAccount({}, null, {}), /Session changed/) })
await check('logout: cleanup happens before local sign-out', async () => { const order = []; await signOutAccount({ auth: { signOut: async opts => { assert.equal(opts.scope, 'local'); order.push('auth'); return { error: null } } } }, user.id, async () => { order.push('cleanup') }); assert.deepEqual(order, ['cleanup', 'auth']) })
await check('logout: permits only best-effort remote subscription cleanup', async () => { let signedOut = false; await signOutAccount({ auth: { signOut: async () => { signedOut = true; return { error: null } } } }, user.id, async (_client, id, options) => { assert.equal(id, user.id); assert.deepEqual(options, { allowRemoteFailure: true }) }); assert.equal(signedOut, true) })
await check('logout: local push cleanup failure prevents unsafe sign-out', async () => { let signedOut = false; await assert.rejects(signOutAccount({ auth: { signOut: async () => { signedOut = true; return { error: null } } } }, user.id, async () => { throw new Error('local cleanup failed') }), /local cleanup failed/); assert.equal(signedOut, false) })
await check('logout: auth failure is not reported as success', async () => { const failure = new Error('auth failed'); await assert.rejects(signOutAccount({ auth: { signOut: async () => ({ error: failure }) } }, user.id, async () => {}), error => error === failure) })
await check('errors: missing RPC explains setup requirement', () => assert.match(authErrorMessage({ code: 'PGRST202' }), /MYPAGE_SETUP.sql/))
await check('errors: callback does not echo attacker-controlled description', () => assert.equal(readCallbackError('https://app.example/auth/callback?error=unknown&error_description=SECRET').includes('SECRET'), false))
console.log(`\n${passed} passed; ${failed} failed`)
if (failed) process.exitCode = 1
