import { recipes } from './recipes'
export const createMockInventory = () => Object.fromEntries(recipes.flatMap((recipe) => recipe.ingredients.filter((item) => item.inFridge).map((item) => [item.id, item.stock])))
export const inventoryIngredients = [...new Map(recipes.flatMap((recipe) => recipe.ingredients.filter((item) => item.inFridge).map((item) => [item.id, item]))).values()]
export function deductInventory(inventory, selected) {
  const next = { ...inventory }
  for (const item of selected) {
    if (!Number.isFinite(item.deduct) || item.deduct <= 0 || item.deduct > (next[item.id] ?? 0)) throw new Error('차감할 수량을 다시 확인해주세요.')
    next[item.id] = Number((next[item.id] - item.deduct).toFixed(3))
  }
  return next
}


// Presentation metadata extends the same quantities consumed by RecipeDetail.
// Demo dates are relative to today; replace these lots with inventory API records.
const seedMetadata = {
  'green-onion': { storageType: 'fridge', purchasedAgo: 4, expiresIn: 2, displayPerUnit: 100, unit: 'g' },
  tofu: { storageType: 'fridge', purchasedAgo: 2, expiresIn: 1, displayPerUnit: 300, unit: 'g' },
  egg: { storageType: 'fridge', purchasedAgo: 5, expiresIn: 14 },
  onion: { storageType: 'room', purchasedAgo: 6, expiresIn: 19 },
  'oyster-sauce': { storageType: 'fridge', purchasedAgo: 3, expiresIn: 25 },
}
export const storageLabels = { fridge: '냉장', freezer: '냉동', room: '실온' }
export const statusVariants = {
  expired: { label: '소비기한 지남', className: 'bg-[#ffe3e4] text-[#ed3343]', barClassName: 'bg-[#ed3343]' },
  urgent: { label: '소비 임박', className: 'bg-[#fff3c4] text-[#b5611d]', barClassName: 'bg-[#f59e0b]' },
  warning: { label: '주의', className: 'bg-[#ffe8dc] text-[#bd601f]', barClassName: 'bg-[#f97316]' },
  fresh: { label: '신선도 양호', className: 'bg-[#e5f1ed] text-[#008768]', barClassName: 'bg-[#10b981]' },
  relaxed: { label: '여유', className: 'bg-[#e5f2f5] text-[#087f98]', barClassName: 'bg-[#06b6d4]' },
  frozen: { label: '냉동보관', className: 'bg-[#eff6fa] text-[#087f98]', barClassName: 'bg-[#06b6d4]' },
}
function dateNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const [year, month, day] = value.split('-').map(Number)
  const result = Date.UTC(year, month - 1, day)
  return new Date(result).toISOString().slice(0, 10) === value ? result : NaN
}
function todayString(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}
export function getDaysUntilExpiry(expiryDate, now = new Date()) {
  const difference = dateNumber(expiryDate) - dateNumber(todayString(now))
  return Number.isFinite(difference) ? Math.round(difference / 86400000) : null
}
export const expiryLabel = (days) => days === null ? '날짜 확인 필요' : days < 0 ? '소비기한 지남' : days === 0 ? 'D-DAY' : 'D-' + days
export function buildFridgeItems(inventory, registrations = [], now = new Date()) {
  const shifted = (offset) => new Date(dateNumber(todayString(now)) + offset * 86400000).toISOString().slice(0, 10)
  const lots = inventoryIngredients.map((ingredient) => {
    const meta = seedMetadata[ingredient.id] ?? { storageType: 'fridge', purchasedAgo: 0, expiresIn: 7 }
    return { id: 'seed-' + ingredient.id, ingredientId: ingredient.id, name: ingredient.name,
      baseAmount: ingredient.stock, displayPerUnit: meta.displayPerUnit ?? 1, unit: meta.unit ?? ingredient.unit,
      storageType: meta.storageType, purchaseDate: shifted(-meta.purchasedAgo), expiryDate: shifted(meta.expiresIn) }
  }).concat(registrations.map((item, index) => ({
    id: 'registered-' + item.id + '-' + index, ingredientId: item.ingredientId, name: item.ingredientName,
    baseAmount: Number(item.purchaseAmount) * item.inventoryPerUnit, displayPerUnit: 1 / item.inventoryPerUnit,
    unit: item.unit, storageType: item.storageType, purchaseDate: item.purchaseDate, expiryDate: item.expiryDate, image: item.image, consumedBeforeRegistration: item.consumedBeforeRegistration ?? 0,
  })))
  // Allocate deductions to the earliest-expiring lot. New registrations retain their own dates and storage.
  const totals = {}
  for (const lot of lots) totals[lot.ingredientId] = (totals[lot.ingredientId] ?? 0) + lot.baseAmount
  const consumed = Object.fromEntries(Object.entries(totals).map(([id, amount]) => [id, Math.max(0, amount - (inventory[id] ?? 0))]))
  const totalConsumed = { ...consumed }
  return lots.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).flatMap((lot) => {
    const deduction = Math.min(lot.baseAmount, consumed[lot.ingredientId] ?? 0, Math.max(0, totalConsumed[lot.ingredientId] - (lot.consumedBeforeRegistration ?? 0)))
    consumed[lot.ingredientId] -= deduction
    const remaining = Number((lot.baseAmount - deduction).toFixed(3))
    if (remaining <= 0) return []
    const daysLeft = getDaysUntilExpiry(lot.expiryDate, now)
    const storedDays = Math.max(0, -getDaysUntilExpiry(lot.purchaseDate, now))
    const duration = Math.max(1, (dateNumber(lot.expiryDate) - dateNumber(lot.purchaseDate)) / 86400000)
    const status = daysLeft === null || daysLeft < 0 ? 'expired' : daysLeft <= 2 ? 'urgent' : daysLeft <= 5 ? 'warning' : lot.storageType === 'freezer' ? 'frozen' : daysLeft > 14 ? 'relaxed' : 'fresh'
    return [{ ...lot, ...ingredientDetailFields({ ...lot, amount: Number((remaining * lot.displayPerUnit).toFixed(3)) }, daysLeft, storedDays, duration), amount: Number((remaining * lot.displayPerUnit).toFixed(3)), daysLeft, storedDays, status,
      freshnessPercent: Math.max(0, Math.min(100, Math.round(daysLeft / duration * 100))),
      recommendedRecipes: recipes.filter((recipe) => recipe.ingredients.some((item) => item.id === lot.ingredientId)).map((recipe) => recipe.title) }]
  })
}


// Detail presentation only. Replace these demo scores/tips with backend analysis.
const detailMetadata = {
  'green-onion': { englishName: 'Green Onion', category: '채소류', packageState: '손질 전', portion: 50, freshnessNote: '물기 관리 필요 시점', storageTip: '대파는 물기를 닦고 필요한 만큼 나누어 보관해주세요. 손질한 대파는 밀폐용기에 담고, 오래 보관할 분량은 잘라 냉동 소분할 수 있어요.' },
  tofu: { englishName: 'Tofu', category: '두부류', packageState: '부침용', portion: 150, freshnessNote: '개봉 상태 확인', storageTip: '두부는 제품에 표시된 보관 방법과 개봉 후 안내를 확인해주세요. 사용할 만큼 덜어내고 남은 두부는 깨끗한 밀폐용기에 보관해주세요.' },
  egg: { englishName: 'Egg', category: '알류', portion: 2, freshnessNote: '껍데기 상태 확인', storageTip: '계란은 깨지지 않도록 용기에 담아 보관해주세요. 포장에 표시된 보관 방법과 소비기한을 확인하고, 조리할 때 필요한 만큼 꺼내주세요.' },
  onion: { englishName: 'Onion', category: '채소류', portion: 0.5, freshnessNote: '습기 상태 확인', storageTip: '양파는 습기가 차지 않게 보관해주세요. 자르거나 껍질을 벗긴 양파는 별도 용기에 담고 보관 상태를 다시 확인해주세요.' },
  'oyster-sauce': { englishName: 'Oyster Sauce', category: '조미료', portion: 0.5, freshnessNote: '개봉 후 표시 확인', storageTip: '굴소스는 사용 후 뚜껑을 잘 닫아주세요. 개봉 후 보관 방법과 사용 기한은 제품에 표시된 안내를 따라주세요.' },
}
const storageDetails = {
  fridge: { storageName: '냉장 보관', storageDetail: '냉장고에 보관 중인 식재료', optimalTemperature: '제품 보관 표시 확인' },
  freezer: { storageName: '냉동실', storageDetail: '냉동실에 보관 중인 식재료', optimalTemperature: '냉동 상태 유지' },
  room: { storageName: '실온 보관', storageDetail: '실온에 보관 중인 식재료', optimalTemperature: '직사광선·습기 주의' },
}
export function getFreshnessStatus(score) {
  if (score >= 80) return { label: '신선', textClassName: 'text-[#10b981]', barClassName: 'bg-[#10b981]' }
  if (score >= 50) return { label: '주의', textClassName: 'text-[#f59e0b]', barClassName: 'bg-gradient-to-r from-[#10b981] via-[#facc15] to-[#f59e0b]' }
  return { label: '소비 권장', textClassName: 'text-[#ef4444]', barClassName: 'bg-[#ef4444]' }
}
function ingredientDetailFields(lot, daysLeft, storedDays, duration) {
  const meta = detailMetadata[lot.ingredientId] ?? {}
  return {
    englishName: meta.englishName ?? '', category: meta.category ?? '식재료', packageState: meta.packageState ?? '',
    ...(storageDetails[lot.storageType] ?? storageDetails.fridge),
    freshnessScore: daysLeft === null || daysLeft < 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - storedDays / duration * 48))),
    freshnessNote: meta.freshnessNote ?? '보관 상태 확인',
    servingEstimate: meta.portion ? '약 ' + Number((lot.amount / meta.portion).toFixed(1)) + '회분' : '등록한 수량 기준',
    storageTip: lot.storageTip || meta.storageTip || '제품에 표시된 보관 방법과 소비기한을 확인해주세요. 보관 장소에 맞게 밀폐하여 보관하고, 개봉한 날짜를 함께 기록하면 관리하기 편해요.',
    recommendedRecipeIds: recipes.filter((recipe) => recipe.ingredients.some((item) => item.id === lot.ingredientId)).map((recipe) => recipe.id),
  }
}
