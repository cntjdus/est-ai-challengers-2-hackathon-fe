import { expect, it, vi } from 'vitest'
import { shoppingPayload, mapShoppingRows, saveShoppingChanges, loadShopping, checkoutShopping, addRecipeShopping } from '../src/data/shoppingApi'
import { createRegistrationDraft } from '../src/data/materialRegistration'
import { toRegistrationPayload } from '../src/data/fridgeApi'
import { personalizeRecipes, recipeExclusions } from '../src/data/personalization'
const egg = { id: 'food:egg:ea', foodId: 'egg', dbUnit: 'ea', name: '달걀', quantity: 2 }
const recipe = { id: 'r', title: '달걀 요리', servings: 1, minutes: 10, ingredients: [egg] }
it('uses the ingredient endpoint and reports missing migrations instead of a false duplicate', async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ error: null }) }
  await addRecipeShopping(client, recipe, 1, {}, 'request', egg.id)
  expect(client.rpc).toHaveBeenCalledWith('hk_add_recipe_ingredient_shopping', expect.objectContaining({ p_id: 'request', p_items: [expect.objectContaining({ food_id: 'egg', purchase_quantity: 2 })] }))
  client.rpc.mockResolvedValue({ error: { code: 'PGRST202' } })
  await expect(addRecipeShopping(client, recipe, 1, {}, 'request', egg.id)).rejects.toThrow('DB 업데이트가 필요')
})
it('adds only the chosen ingredient including optional and sufficiently stocked ingredients', () => {
  const selectedRecipe = { ...recipe, ingredients: [egg, { ...egg, id: 'optional', foodId: 'salt', optional: true }] }
  expect(shoppingPayload(selectedRecipe, 2, { optional: 10 }, 'optional')).toEqual([
    { food_id: 'salt', unit: 'ea', required_quantity: 4, available_quantity: 10, purchase_quantity: 4 },
  ])
  expect(shoppingPayload(recipe, 2, { [egg.id]: 1 }, egg.id)[0].purchase_quantity).toBe(3)
})
it('scales required amounts and keeps shared stock allocation available for the server', () => {
  expect(shoppingPayload(recipe, 2, { [egg.id]: 1 })).toEqual([{ food_id: 'egg', unit: 'ea', required_quantity: 4, available_quantity: 1 }])
  expect(shoppingPayload({ ...recipe, ingredients: [{ ...egg, optional: true }] }, 1, {})).toEqual([])
})
it('maps actual database cart rows without demo names and ignores zero-shortage reservation rows', () => {
  const row = { id: 's', food_id: 'egg', unit: 'ea', package_count: 2, package_quantity_snapshot: '3', planned_purchase_quantity: '6', needed_quantity: '3', is_selected: false, food_items: { name: '달걀' }, shopping_plans: { title: '달걀 요리' } }
  const mapped = mapShoppingRows([row, { ...row, planned_purchase_quantity: 0 }])
  expect(mapped).toHaveLength(1)
  expect(mapped[0]).toMatchObject({ name: '달걀', quantity: 2, packageAmount: 3, selected: false })
  const draft = createRegistrationDraft(mapped)
  expect(draft[0]).toMatchObject({ shoppingItemId: 's', expectedCount: 2, ingredientName: '달걀', purchaseAmount: '6', expiryDate: '', storageType: 'fridge' })
  expect(toRegistrationPayload(draft, ['inventory-id'])[0]).toMatchObject({ shopping_item_id: 's', expected_count: 2, unit: 'ea' })
})
it('persists only changed rows with optimistic concurrency count', async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ error: null }) }
  await saveShoppingChanges(client, [{ id: 'a', quantity: 1, selected: true }], [{ id: 'a', quantity: 2, selected: false }])
  expect(client.rpc).toHaveBeenCalledWith('hk_update_shopping', { p_changes: [{ id: 'a', remove: false, expected_count: 1, count: 2, selected: false }] })
  await saveShoppingChanges(client, [{ id: 'a', quantity: 1, selected: true }], [])
  expect(client.rpc.mock.calls[1][1].p_changes[0].remove).toBe(true)
})
it('queries only the requested user and does not silently replace errors with demo rows', async () => {
  const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), is: vi.fn(() => chain), order: vi.fn().mockResolvedValue({ data: [], error: null }) }
  expect(await loadShopping({ from: () => chain }, 'user-b')).toEqual([])
  expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-b')
  chain.order.mockResolvedValue({ error: new Error('network') })
  await expect(loadShopping({ from: () => chain }, 'user-b')).rejects.toThrow('network')
})
it('uses an atomic checkout RPC and exposes failures to the form', async () => {
  await expect(checkoutShopping({ rpc: vi.fn().mockResolvedValue({ error: new Error('conflict') }) }, [])).rejects.toThrow('conflict')
})
it('screens egg aliases, optional ingredients, sauces, and excluded ingredient names', () => {
  expect(recipeExclusions(recipe, { allergies: ['계란'] })).toEqual(['계란'])
  expect(recipeExclusions({ ...recipe, ingredients: [{ name: '간장', optional: true }] }, { allergies: ['대두', '밀'] })).toEqual(['대두', '밀'])
  expect(recipeExclusions(recipe, { excludedIngredients: [' 달 걀 '] })).toEqual([' 달 걀 '])
})
it('filters allergies before ranking by real stock and preferences', () => {
  const vegetable = { ...recipe, id: 'veg', ingredients: [{ id: 'potato', name: '감자', quantity: 100 }] }
  expect(personalizeRecipes([recipe, vegetable], { allergies: ['달걀'] }, {})[0].id).toBe('veg')
  expect(personalizeRecipes([vegetable, recipe], {}, { [egg.id]: 2 })[0].id).toBe('r')
  expect(personalizeRecipes([], {}, {})).toEqual([])
})
