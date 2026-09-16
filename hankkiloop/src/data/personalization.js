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
export function personalizeRecipes(recipes, preferences = {}, inventory = {}) {
  const tastes = (preferences.dietStyles ?? []).map(normalize)
  return recipes.filter(r => !recipeExclusions(r, preferences).length).map(recipe => {
    const needed = recipe.ingredients.filter(i => !i.optional)
    const available = needed.filter(i => (inventory[i.id] ?? 0) >= i.quantity).length
    const text = normalize(recipe.title + recipe.tag + recipe.description)
    const tasteScore = tastes.filter(t => text.includes(t) || (t.includes('초간단') && recipe.minutes <= 20)).length
    return { ...recipe, recommendationScore: available / Math.max(needed.length, 1) * 10 + tasteScore * 2,
      benefit: '기본 ' + recipe.servings + '인분 기준 재료 ' + available + '/' + needed.length + '개 보유' }
  }).sort((a, b) => b.recommendationScore - a.recommendationScore)
}
export const allergyNotice = '등록된 재료명으로 알레르기·비선호 재료를 제외합니다. 가공식품의 숨은 성분과 교차접촉은 판별하지 못하므로 제품 표시를 반드시 확인해주세요.'
