// Matches the existing public recipes / recipe_ingredients / recipe_steps schema.
const unitLabels = { ea: '개', pack: '팩', bundle: '묶음', tbsp: '큰술', tsp: '작은술' }
const stockKey = (foodId, unit) => `food:${foodId}:${unit}`
const normalize = (name) => name.trim().replace(/\s+/g, '').toLowerCase()
const round = (n) => Number(n.toFixed(4))

export async function loadRecipeCatalog(client) {
  const results = await Promise.all([
    client.from('recipes').select('*, recipe_ingredients(*), recipe_steps(*)').order('created_at', { ascending: false }),
    client.from('food_items').select('id,name,is_active'),
    client.from('food_aliases').select('food_id,alias'),
  ])
  for (const result of results) if (result.error) throw result.error
  const [rows, foods, aliases] = results.map(result => result.data ?? [])
  const recipes = rows.map(row => {
    const ingredients = (row.recipe_ingredients ?? []).map(item => {
      const food = foods.find(f => f.id === item.food_id)
      if (!food) throw new Error('레시피 재료 정보를 확인할 수 없습니다.')
      return { id: stockKey(food.id, item.unit), foodId: food.id, name: food.name,
        quantity: Number(item.quantity), dbUnit: item.unit, unit: unitLabels[item.unit] ?? item.unit,
        optional: item.is_optional, note: item.note, step: ['g', 'ml'].includes(item.unit) ? 1 : 0.25,
        storageType: '보유 재고 기준', storageLabel: '냉장고 보관중' }
    })
    // Multiple entries for one food/unit must share one stock budget.
    const grouped = [...ingredients.reduce((map, item) => {
      const previous = map.get(item.id)
      map.set(item.id, previous ? { ...previous, quantity: round(previous.quantity + item.quantity), optional: previous.optional && item.optional } : item)
      return map
    }, new Map()).values()]
    return { id: row.id, title: row.title, description: row.description ?? '', createdAt: row.created_at,
      servings: Number(row.base_servings), minutes: row.cooking_minutes ?? '—',
      difficulty: { easy: '초급', normal: '보통', hard: '어려움' }[row.difficulty] ?? '미등록',
      source: row.source_name ?? '출처 미등록', sourceType: row.source_type ?? 'other', sourceUrl: row.source_url,
      image: row.image_path, tag: (row.tags ?? []).join(' · '), benefit: '필요량과 냉장고 재고 비교',
      ingredients: grouped, ingredientSummary: grouped.map(i => i.name).join(', '), tools: [],
      steps: [...(row.recipe_steps ?? [])].sort((a,b) => a.step_no - b.step_no).map(s => ({ step: s.step_no, description: s.instruction })) }
  })
  return { recipes, foods, aliases }
}

export function recipeStock(registrations, foods, aliases) {
  const names = new Map()
  for (const { id, name } of foods) names.set(normalize(name), new Set([...(names.get(normalize(name)) ?? []), id]))
  for (const { food_id, alias } of aliases) names.set(normalize(alias), new Set([...(names.get(normalize(alias)) ?? []), food_id]))
  const inventory = {}
  const lots = registrations.map(lot => {
    const row = lot.dbRow
    if (!row) return lot
    const candidates = names.get(normalize(row.display_name))
    const foodId = row.food_id ?? (candidates?.size === 1 ? [...candidates][0] : null)
    const id = foodId ? stockKey(foodId, row.unit) : lot.ingredientId
    inventory[id] = round((inventory[id] ?? 0) + Number(row.quantity))
    return { ...lot, ingredientId: id, unit: unitLabels[row.unit] ?? row.unit }
  })
  lots.database = true
  return { inventory, registrations: lots }
}

export function compareIngredient(ingredient, servings, baseServings, inventory) {
  const required = round(ingredient.quantity * servings / baseServings)
  const available = inventory[ingredient.id] ?? 0
  const differentUnit = Object.keys(inventory).some(key => key.startsWith(`food:${ingredient.foodId}:`) && key !== ingredient.id && inventory[key] > 0)
  return { required, available, shortage: round(Math.max(0, required - available)), differentUnit }
}
