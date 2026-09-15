import { recipes } from './recipes'
export const dbUnits = { g: 'g', ml: 'ml', '개': 'ea', '모': 'ea', '대': 'ea', '팩': 'pack', '묶음': 'bundle', '큰술': 'tbsp', '작은술': 'tsp' }
const uiUnits = { ea: '개', pack: '팩', bundle: '묶음', tbsp: '큰술', tsp: '작은술' }
const ingredients = [...new Map(recipes.flatMap(r => r.ingredients).map(i => [i.id, i])).values()]
export function toRegistrationPayload(materials, ids) {
  return materials.map((m, index) => {
    const quantity = Number(m.purchaseAmount)
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity >= 1e9 || Math.abs(quantity * 10000 - Math.round(quantity * 10000)) > 0.0001) throw new Error('수량은 0보다 크고 10억 미만, 소수점 네 자리 이내로 입력해주세요.')
    if (!dbUnits[m.unit]) throw new Error('지원하지 않는 단위입니다: ' + m.unit)
    return { id: ids[index], display_name: m.ingredientName.trim(), quantity, unit: dbUnits[m.unit], storage_type: m.storageType, purchased_on: m.purchaseDate, expiry_date: m.expiryDate }
  })
}
export function mapInventoryRows(rows) {
  // Recipe quantities are only matched when their units agree. Never guess grams per piece.
  const inventory = {}, registrations = []
  for (const row of rows) {
    const match = ingredients.find(i => (i.name === row.display_name || (i.name === '계란' && row.display_name === '달걀')) && dbUnits[i.unit] === row.unit)
    const id = match?.id ?? `db:${row.display_name}:${row.unit}`
    inventory[id] = (inventory[id] ?? 0) + Number(row.quantity)
    registrations.push({ id: row.id, dbRow: row, ingredientId: id, ingredientName: row.display_name, purchaseAmount: Number(row.quantity), inventoryPerUnit: 1, unit: match?.unit ?? uiUnits[row.unit] ?? row.unit, purchaseDate: row.purchased_on ?? '', expiryDate: row.tracking_date ?? '', storageType: row.storage_type })
  }
  registrations.database = true
  return { inventory, registrations }
}
export async function loadInventory(client, userId) {
  const { data, error } = await client.from('inventory_overview').select('*').eq('user_id', userId).eq('status', 'active').order('created_at')
  if (error) throw error
  return mapInventoryRows(data)
}
export async function registerInventory(client, payload) {
  const { error } = await client.rpc('hk_register_inventory_batch', { p_items: payload })
  if (error) throw error
}
export async function saveInventoryItem(client, row, draft) {
  const quantity = Number(draft.quantity)
  if (!draft.name.trim() || !Number.isFinite(quantity) || quantity <= 0 || quantity >= 1e9) throw new Error('이름과 0보다 큰 수량을 입력해주세요.')
  const { error } = await client.rpc('hk_edit_inventory_item', { p_id: row.id, p_expected_updated_at: row.updated_at, p_name: draft.name.trim(), p_quantity: quantity, p_storage: draft.storage, p_date: draft.date || null })
  if (error) throw error
}
export function planDeductions(registrations, selected) {
  const available = registrations.map(m => ({ ...m, left: Number(m.purchaseAmount) })).sort((a,b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999'))
  const changes = []
  for (const item of selected) {
    let remaining = Number(item.deduct)
    if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('차감량을 확인해주세요.')
    for (const lot of available.filter(m => m.ingredientId === item.id)) {
      const take = Math.min(lot.left, remaining)
      if (take <= 0) continue
      lot.left = Number((lot.left - take).toFixed(4)); remaining = Number((remaining - take).toFixed(4))
      changes.push({ id: lot.id, delta: -take, status: lot.left > 0 ? 'active' : 'consumed', request_id: crypto.randomUUID() })
    }
    if (remaining > 0) throw new Error('현재 재고가 부족합니다. 냉장고를 새로고침해주세요.')
  }
  return changes
}
export async function changeInventoryBatch(client, changes) {
  const { error } = await client.rpc('hk_change_inventory_batch', { p_changes: changes })
  if (error) throw error
}
