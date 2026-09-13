import { recipeDetails } from './recipeDetails'
const recipeCards = [
  { id: 'pork', title: '제육볶음', source: 'YouTube 백종원', sourceType: 'youtube', ingredients: '돼지고기, 대파, 양파, 고추장 양념', minutes: 15, benefit: '내 냉장고 대파·양파 소진', tag: '난이도 하' },
  { id: 'stew', title: '차돌 된장찌개', source: '자취생 집밥 꿀팁', sourceType: 'blog', ingredients: '두부, 애호박, 된장, 대파, 차돌박이', minutes: 20, benefit: '두부 소비기한 임박(D-1) 완벽 활용' },
  { id: 'tofu', title: '두부 계란 볶음', source: '냉장고 파먹기', sourceType: 'fridge', ingredients: '두부 반모, 계란 2개, 굴소스, 대파', minutes: 10, benefit: '추가 구매 0원 (냉장고 재료 100%)', tag: '초간단 1인분' },
]

export const recipes = recipeCards.map((recipe) => ({ ...recipe, ingredientSummary: recipe.ingredients, ...recipeDetails[recipe.id] }))