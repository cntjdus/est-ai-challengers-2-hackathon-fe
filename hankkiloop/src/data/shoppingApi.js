import { compareIngredient } from './recipeApi'
const labels = { ea: '개', g: 'g', ml: 'ml' }
export function shoppingPayload(recipe, servings, inventory) {
  return recipe.ingredients.filter(i => !i.optional).map(i => {
    const c = compareIngredient(i, servings, recipe.servings, inventory)
    return { food_id: i.foodId, unit: i.dbUnit, required_quantity: c.required, available_quantity: c.available }
  })
}
export function mapShoppingRows(rows) {
  return rows.filter(r => Number(r.planned_purchase_quantity) > 0).map(r => ({
    id: r.id, foodId: r.food_id, ingredientId: `food:${r.food_id}:${r.unit}`,
    name: r.food_items.name, shortName: r.food_items.name, image: r.food_items.image_path,
    quantity: Number(r.package_count ?? 1), packageAmount: Number(r.package_quantity_snapshot ?? r.planned_purchase_quantity),
    amountUnit: labels[r.unit] ?? r.unit, dbUnit: r.unit, selected: r.is_selected,
    plannedUsage: Number(r.needed_quantity), inventoryQuantity: Number(r.planned_purchase_quantity),
    storageLabel: '필요량 기반 장보기', riskLevel: 'normal', stockRisk: '추가 구매분',
    recipeTitles: [r.shopping_plans.title], dbRow: r,
  }))
}
export async function loadShopping(client, userId) {
  const { data, error } = await client.from('shopping_items')
    .select('*, food_items!shopping_items_food_id_fkey(name,image_path), shopping_plans!shopping_items_plan_id_user_id_fkey(title)')
    .eq('user_id', userId).is('purchased_at', null).order('created_at')
  if (error) throw error
  return mapShoppingRows(data ?? [])
}
export async function addRecipeShopping(client, recipe, servings, inventory, requestId) {
  const { error } = await client.rpc('hk_add_recipe_shopping', {
    p_id: requestId, p_recipe: recipe.id, p_servings: servings,
    p_items: shoppingPayload(recipe, servings, inventory),
  })
  if (error) throw error
}
export async function saveShoppingChanges(client, previous, next) {
  const changes = previous.flatMap(item => {
    const updated = next.find(i => i.id === item.id)
    if (updated && updated.quantity === item.quantity && updated.selected === item.selected) return []
    return [{ id: item.id, remove: !updated, expected_count: item.quantity,
      count: updated?.quantity ?? item.quantity, selected: updated?.selected ?? item.selected }]
  })
  if (!changes.length) return
  const { error } = await client.rpc('hk_update_shopping', { p_changes: changes })
  if (error) throw error
}
export async function checkoutShopping(client, items) {
  const { error } = await client.rpc('hk_checkout_shopping', { p_items: items })
  if (error) throw error
}
