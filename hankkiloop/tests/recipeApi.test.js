import { describe, it, expect } from 'vitest'
import { loadRecipeCatalog, recipeStock, compareIngredient } from '../src/data/recipeApi'
import { planDeductions } from '../src/data/fridgeApi'

const foods = [{ id: 'egg', name: '계란' }, { id: 'onion', name: '대파' }]
const aliases = [{ food_id: 'egg', alias: '달걀' }]
const row = { id: 'recipe-uuid', title: '계란 요리', base_servings: '2', cooking_minutes: null,
  recipe_ingredients: [{ food_id: 'egg', quantity: '2', unit: 'ea', is_optional: false }],
  recipe_steps: [{ step_no: 2, instruction: '익히기' }, { step_no: 1, instruction: '준비' }] }
function client(data, failure) {
  return { from: table => {
    const chain = { select: () => chain, order: () => chain, then: resolve => resolve({ data: data[table], error: failure }) }
    return chain
  } }
}
const lot = (id, name, quantity, unit, food_id = null) => ({ id, ingredientId: 'legacy-'+id, purchaseAmount: quantity, expiryDate: id === 'a' ? '2026-09-20' : '2026-09-22', dbRow: { display_name: name, quantity, unit, food_id } })
describe('database recipe catalog', () => {
  it('maps the existing schema, orders steps, and keeps an empty DB empty', async () => {
    const result = await loadRecipeCatalog(client({ recipes: [row], food_items: foods, food_aliases: aliases }))
    expect(result.recipes[0].steps.map(s => s.description)).toEqual(['준비', '익히기'])
    expect(result.recipes[0].ingredients[0].quantity).toBe(2)
    expect(result.recipes[0].minutes).toBe('—')
    expect((await loadRecipeCatalog(client({}))).recipes).toEqual([])
  })
  it('surfaces failures instead of returning sample recipes', async () => {
    await expect(loadRecipeCatalog(client({}, new Error('network')))).rejects.toThrow('network')
  })
  it('matches aliases and IDs, keeps different units separate, then deducts earliest lots', () => {
    const stock = recipeStock([lot('a', '달걀', 1, 'ea'), lot('b', '계란', 3, 'ea'), lot('c', '계란', 200, 'g'), lot('d', '별도표시', 2, 'ea', 'egg')], foods, aliases)
    const comparison = compareIngredient({id:'food:egg:ea',foodId:'egg',quantity:4}, 2, 1, stock.inventory)
    expect(comparison).toEqual({required:8,available:6,shortage:2,differentUnit:true})
    const changes = planDeductions(stock.registrations,[{id:'food:egg:ea',deduct:2}])
    expect(changes.map(c => [c.id,c.delta])).toEqual([['a',-1],['b',-1]])
    expect(changes.some(c => c.id === 'c')).toBe(false)
  })
  it('does not guess ambiguous aliases or grams per piece', () => {
    const stock = recipeStock([lot('a','대파',100,'g'),lot('b','달걀',3,'ea')], foods,[...aliases,{food_id:'onion',alias:'달걀'}])
    expect(stock.inventory['food:egg:ea']).toBeUndefined()
    expect(compareIngredient({id:'food:onion:ea',foodId:'onion',quantity:1},1,1,stock.inventory)).toEqual({required:1,available:0,shortage:1,differentUnit:true})
  })
  it('groups repeated ingredients to prevent double counting stock', async () => {
    const result = await loadRecipeCatalog(client({recipes:[{...row,recipe_ingredients:[...row.recipe_ingredients,...row.recipe_ingredients]}],food_items:foods}))
    expect(result.recipes[0].ingredients).toHaveLength(1)
    expect(result.recipes[0].ingredients[0].quantity).toBe(4)
  })
})
