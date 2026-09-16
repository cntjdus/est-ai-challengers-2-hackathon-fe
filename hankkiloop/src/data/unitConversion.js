export const unitLabels = { g: 'g', ml: 'ml', ea: '개·모·대', pack: '팩', bundle: '묶음', tbsp: '큰술', tsp: '작은술' }
export const roundQuantity = value => Number(value.toFixed(4))

// Factors always point to food_items.base_unit. No assumed grams per piece/pack.
export function unitFactor(food, unit, conversions = []) {
  if (!food?.base_unit) return null
  if (unit === food.base_unit) return 1
  const custom = conversions.find(c => c.food_id === food.id && c.unit === unit)
  if (custom) {
    const factor = Number(custom.base_quantity)
    return Number.isFinite(factor) && factor > 0 ? factor : null
  }
  // These are explicitly labelled measuring spoons, never an unspecified spoon.
  if (food.base_unit === 'ml' && unit === 'tbsp') return 15
  if (food.base_unit === 'ml' && unit === 'tsp') return 5
  return null
}

export function canonicalQuantity(food, quantity, unit, conversions = []) {
  const factor = unitFactor(food, unit, conversions)
  if (factor === null) return { quantity: Number(quantity), unit, factor: 1 }
  const converted = roundQuantity(Number(quantity) * factor)
  if (!Number.isFinite(converted) || converted <= 0 || converted >= 1e9) throw new Error('환산 결과가 저장 가능한 수량 범위를 벗어났어요. 환산 기준을 확인해주세요.')
  return { quantity: converted, unit: food.base_unit, factor }
}

export async function saveUnitConversion(client, userId, food, unit, amount) {
  const quantity = Number(amount)
  if (!food || !Object.hasOwn(unitLabels, unit) || unit === food.base_unit || !Number.isFinite(quantity) || quantity <= 0 || quantity >= 1e9 || roundQuantity(quantity) !== quantity) {
    throw new Error('환산량은 0보다 크고 10억 미만, 소수점 네 자리 이내로 입력해주세요.')
  }
  const { error } = await client.from('hk_food_unit_conversions').upsert({ user_id: userId, food_id: food.id, unit, base_quantity: quantity }, { onConflict: 'user_id,food_id,unit' })
  if (error) throw error
}

export async function removeUnitConversion(client, userId, foodId, unit) {
  const { error } = await client.from('hk_food_unit_conversions').delete().eq('user_id', userId).eq('food_id', foodId).eq('unit', unit)
  if (error) throw error
}
