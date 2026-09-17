// Conservative ingredient-name screening, NOT a certified allergen database.
const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/g, '')
const allergens = {
  달걀: ['달걀', '계란', '난류', '마요네즈'], 계란: ['달걀', '계란', '난류', '마요네즈'], 난류: ['달걀', '계란', '마요네즈'],
  우유: ['우유', '치즈', '버터', '크림', '요거트'], 유제품: ['우유', '치즈', '버터', '크림', '요거트'],
  대두: ['콩', '두부', '간장', '된장', '고추장', '쌈장'], 콩: ['콩', '두부', '간장', '된장', '고추장', '쌈장'],
  밀: ['밀', '면', '빵', '간장', '된장', '고추장', '굴소스', '튀김'],
  땅콩: ['땅콩'], 호두: ['호두'], 잣: ['잣'], 견과류: ['견과', '땅콩', '호두', '잣', '아몬드', '캐슈'],
  새우: ['새우', '젓갈', '액젓', '김치'], 게: ['게', '맛살', '액젓'],
  조개류: ['조개', '굴', '홍합', '전복', '바지락', '굴소스', '액젓'],
  생선: ['생선', '참치', '고등어', '멸치', '액젓', '김치', '어묵'], 고등어: ['고등어'],
  돼지고기: ['돼지', '햄', '베이컨', '소시지'], 닭고기: ['닭', '치킨'], 쇠고기: ['소고기', '쇠고기'], 소고기: ['소고기', '쇠고기'],
  복숭아: ['복숭아'], 토마토: ['토마토', '케첩'], 오징어: ['오징어'], 메밀: ['메밀'],
  아황산류: ['와인', '건과일', '식초'], 참깨: ['참깨', '참기름', '깨'],
}
export function recipeExclusions(recipe, preferences = {}) {
  const names = recipe.ingredients.map(i => normalize(i.name))
  const allergies = (preferences.allergies ?? []).filter(a =>
    (allergens[normalize(a)] ?? [a]).some(term => names.some(name => name.includes(normalize(term)))))
  const excluded = (preferences.excludedIngredients ?? []).filter(a => names.some(name => name.includes(normalize(a))))
  return [...allergies, ...excluded]
}
// Calendar-day arithmetic avoids time-of-day and daylight-saving offsets.
function dateDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null
  const time = Date.parse(value + 'T00:00:00Z')
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time / 86400000 : null
}
export function personalizeRecipes(recipes, preferences = {}, inventory = {}, registrations = [], now = new Date()) {
  const tastes = [...new Set((preferences.dietStyles ?? []).map(normalize).filter(Boolean))]
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000
  const usableInventory = { ...inventory }
  const lots = registrations.map(lot => {
    const day = dateDay(lot.expiryDate)
    const days = day === null ? null : day - today
    const quantity = Math.max(0, Number(lot.purchaseAmount) || 0)
    if (days !== null && days < 0)
      usableInventory[lot.ingredientId] = Math.max(0, (usableInventory[lot.ingredientId] ?? 0) - quantity)
    return { ...lot, quantity, day, days, urgency: days === null || days < 0 || days > 7 ? 0 : days <= 1 ? 1 : days <= 3 ? 0.7 : 0.3 }
  }).filter(lot => lot.quantity > 0 && (lot.days === null || lot.days >= 0))
    .sort((a, b) => (a.day ?? Infinity) - (b.day ?? Infinity))
  const totalUrgency = lots.reduce((sum, lot) => sum + lot.urgency, 0)
  return recipes.filter(r => !recipeExclusions(r, preferences).length).map(recipe => {
    const needed = recipe.ingredients.filter(i => !i.optional)
    const available = needed.filter(i => (usableInventory[i.id] ?? 0) >= i.quantity).length
    const stockRatio = needed.reduce((sum, i) => sum + (i.quantity > 0 ? Math.min(1, Math.max(0, usableInventory[i.id] ?? 0) / i.quantity) : 0), 0) / Math.max(needed.length, 1)
    const remaining = new Map()
    for (const i of recipe.ingredients) remaining.set(i.id, (remaining.get(i.id) ?? 0) + Math.max(0, Number(i.quantity) || 0))
    let usedUrgency = 0
    for (const lot of lots) {
      const used = Math.min(lot.quantity, remaining.get(lot.ingredientId) ?? 0)
      remaining.set(lot.ingredientId, (remaining.get(lot.ingredientId) ?? 0) - used)
      usedUrgency += lot.urgency * used / lot.quantity
    }
    const urgencyRatio = totalUrgency ? usedUrgency / totalUrgency : 0
    const text = normalize([recipe.title, recipe.tag, recipe.description].filter(Boolean).join(' '))
    const tasteRatio = tastes.filter(t => text.includes(t) || (t.includes('초간단') && Number(recipe.minutes) > 0 && Number(recipe.minutes) <= 20)).length / Math.max(tastes.length, 1)
    // Missing criteria are omitted and the remaining weights are normalized.
    const weight = (totalUrgency > 0 ? 0.5 : 0) + (needed.length ? 0.4 : 0) + (tastes.length ? 0.1 : 0)
    const score = weight ? 100 * (urgencyRatio * 0.5 + stockRatio * 0.4 + tasteRatio * 0.1) / weight : 0
    return { ...recipe, recommendationScore: score,
      benefit: '기본 ' + recipe.servings + '인분 기준 재료 ' + available + '/' + needed.length + '개 보유' }
  }).sort((a, b) => b.recommendationScore - a.recommendationScore)
}
export const allergyNotice = '등록된 재료명으로 알레르기·비선호 재료를 제외합니다. 가공식품의 숨은 성분과 교차접촉은 판별하지 못하므로 제품 표시를 반드시 확인해주세요.'
