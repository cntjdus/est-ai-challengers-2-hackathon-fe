import { buildFridgeItems, inventoryIngredients, storageLabels } from './inventory'

export const customIngredientUnits = ['g', 'ml', '개', '스푼', '인분', '대', '모', '팩']
const normalizeName = (name) => name.trim().replace(/\s+/g, '').toLocaleLowerCase()
export const roundAmount = (value) => Number(value.toFixed(3))

// Exact name + a known unit conversion only; never guess a stock match.
export function createCustomDeduction({ name, amount, unit }, rows, inventory, registeredMaterials = []) {
  const cleanName = name.trim()
  const quantity = Number(amount)
  if (!cleanName) throw new Error('재료명을 입력해주세요.')
  if (!amount || !Number.isFinite(quantity) || quantity <= 0 || roundAmount(quantity) <= 0) throw new Error('수량은 0보다 큰 숫자로 입력해주세요. (최소 0.001)')
  if (!customIngredientUnits.includes(unit)) throw new Error('단위를 선택해주세요.')
  if (rows.some((row) => normalizeName(row.name) === normalizeName(cleanName))) throw new Error('이미 목록에 있는 재료예요. 기존 재료의 수량과 선택 상태를 확인해주세요.')

  const candidates = buildFridgeItems(inventory, registeredMaterials).filter((item) => normalizeName(item.name) === normalizeName(cleanName))
  const ids = [...new Set(candidates.map((item) => item.ingredientId))]
  const ingredientId = ids.length === 1 ? ids[0] : null
  const source = inventoryIngredients.find((item) => item.id === ingredientId)
  const units = candidates.filter((item) => item.unit === unit)
  const conversions = [...new Set(units.map((item) => 1 / item.displayPerUnit))]
  const inventoryPerUnit = source?.unit === unit ? 1 : conversions.length === 1 ? conversions[0] : null
  const matched = ingredientId && inventoryPerUnit && Number.isFinite(inventoryPerUnit)
  if (matched && rows.some((row) => (row.inventoryId ?? row.id) === ingredientId)) throw new Error('같은 냉장고 재료가 이미 목록에 있어요.')
  const stock = matched ? roundAmount((inventory[ingredientId] ?? 0) / inventoryPerUnit) : null
  if (stock !== null && quantity > stock) throw new Error('보관 재고 ' + stock + unit + '보다 많이 차감할 수 없어요.')
  return {
    id: 'custom-' + crypto.randomUUID(), inventoryId: matched ? ingredientId : null,
    name: cleanName, deduct: roundAmount(quantity), unit, stock, inventoryPerUnit: matched ? inventoryPerUnit : null,
    selected: true, isCustom: true, isSubstitute: true, step: source?.unit === unit ? source.step : ['g', 'ml'].includes(unit) ? 10 : 0.5,
    storageType: matched ? [...new Set(candidates.map((item) => storageLabels[item.storageType]))].join('·') + ' 보관' : '재고 미확인',
    unmatchedReason: !candidates.length ? '재고 정보 없음 · 실제 차감 제외' : '재고·단위 확인 필요 · 실제 차감 제외',
  }
}

export function toInventoryDeductions(rows) {
  return rows.filter((item) => item.selected && item.deduct > 0 && item.stock !== null).map((item) => ({
    id: item.inventoryId ?? item.id,
    deduct: roundAmount(item.deduct * (item.inventoryPerUnit ?? 1)),
  }))
}
