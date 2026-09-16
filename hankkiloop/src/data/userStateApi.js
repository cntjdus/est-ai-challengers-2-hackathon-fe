async function allRows(query) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 500) return rows
  }
}
export async function loadSavedRecipes(client, userId) {
  return (await allRows(() => client.from('hk_recipe_saves').select('recipe_id').eq('user_id', userId).order('recipe_id'))).map(r => r.recipe_id)
}
export async function setRecipeSaved(client, userId, recipeId, saved) {
  const result = saved
    ? await client.from('hk_recipe_saves').upsert({ user_id: userId, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id', ignoreDuplicates: true })
    : await client.from('hk_recipe_saves').delete().eq('user_id', userId).eq('recipe_id', recipeId)
  if (result.error) throw result.error
}
export async function loadNotificationReads(client, userId) {
  return (await allRows(() => client.from('hk_notification_reads').select('notification_id').eq('user_id', userId).order('notification_id'))).map(r => r.notification_id)
}
export async function saveNotificationReads(client, userId, ids) {
  const unique = [...new Set(ids)]
  for (let i = 0; i < unique.length; i += 200) {
    const { error } = await client.from('hk_notification_reads').upsert(unique.slice(i, i + 200).map(id => ({ user_id: userId, notification_id: id })), { onConflict: 'user_id,notification_id', ignoreDuplicates: true })
    if (error) throw error
  }
}
