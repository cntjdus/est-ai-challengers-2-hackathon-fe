// 목록과 상세 화면이 함께 사용하는 레시피별 상세 Mock 정보입니다.
const ingredientMeta = {
  '돼지고기': { id: 'pork-meat', step: 10 }, '대파': { id: 'green-onion', stock: 1, step: 0.25 },
  '양파': { id: 'onion', stock: 1, step: 0.25 }, '고추장': { id: 'chili-paste', isSeasoning: true },
  '간장': { id: 'soy-sauce', isSeasoning: true }, '설탕': { id: 'sugar', isSeasoning: true, storageType: '실온 보관' },
  '다진 마늘': { id: 'garlic', isSeasoning: true }, '차돌박이': { id: 'beef', step: 10 },
  '두부': { id: 'tofu', stock: 0.5, step: 0.25 }, '애호박': { id: 'zucchini', step: 0.25 },
  '된장': { id: 'soybean-paste', isSeasoning: true }, '물': { id: 'water', step: 50, storageType: '실온 보관' },
  '계란': { id: 'egg', stock: 4, step: 1 }, '굴소스': { id: 'oyster-sauce', stock: 5, isSeasoning: true },
}
const ingredient = (name, quantity, unit, inFridge = false) => ({
  name, quantity, unit, inFridge, step: 0.5, storageType: '냉장 보관',
  ...ingredientMeta[name], stock: inFridge ? ingredientMeta[name].stock : 0,
  ...(inFridge ? { storageLabel: '냉장고 보관중' } : {}),
})
export const recipeDetails = {
  pork: {
    description: '매콤달콤한 양념에 돼지고기와 채소를 볶아 만드는 든든한 제육볶음입니다. 냉장고에 남은 대파와 양파를 함께 넣으면 채소의 단맛이 더해져요. 따뜻한 밥과 함께 간단한 한 끼를 준비해보세요.',
    servings: 2, difficulty: '초급', tools: ['프라이팬', '주걱', '칼', '도마', '볼'],
    ingredients: [ingredient('돼지고기', 300, 'g'), ingredient('대파', 0.5, '대', true), ingredient('양파', 0.5, '개', true), ingredient('고추장', 2, '스푼'), ingredient('간장', 1, '스푼'), ingredient('설탕', 1, '스푼'), ingredient('다진 마늘', 1, '스푼')],
    substitute: { title: '대체 가능한 재료!', description: '설탕 대신 올리고당을 조금씩 넣어 단맛을 맞춰도 좋아요.' },
    steps: [
      { step: 1, description: '돼지고기는 한입 크기로, 양파와 대파는 먹기 좋게 썰어 준비합니다.', subDescription: '생고기를 손질한 칼과 도마는 세척한 뒤 다른 재료에 사용해주세요.' },
      { step: 2, description: '볼에 고추장, 간장, 설탕, 다진 마늘을 섞고 돼지고기에 골고루 버무립니다.' },
      { step: 3, description: '달군 팬에 양념한 고기를 볶다가 양파와 대파를 넣어 함께 익힙니다.', subDescription: '양념이 타지 않도록 불을 조절하고 고기 속까지 충분히 익혀주세요.' },
    ],
    tip: '양파와 대파를 마지막에 넣으면 아삭한 식감을 살릴 수 있어요. 양념이 너무 되직하면 물을 조금씩 더해 볶아주세요.',
  },
  stew: {
    description: '고소한 차돌박이와 구수한 된장이 어우러지는 따뜻한 찌개입니다. 두부와 애호박을 넉넉히 넣어 냉장고 속 재료를 활용해보세요. 밥 한 공기에 곁들이면 든든한 한 끼가 완성됩니다.',
    servings: 2, difficulty: '보통', tools: ['냄비', '국자', '칼', '도마'],
    ingredients: [ingredient('차돌박이', 150, 'g'), ingredient('두부', 0.5, '모', true), ingredient('애호박', 0.25, '개'), ingredient('된장', 2, '스푼'), ingredient('대파', 0.5, '대', true), ingredient('물', 500, 'ml')],
    substitute: { title: '대체 가능한 재료!', description: '애호박 대신 냉장고에 남은 버섯을 넣어도 좋아요.' },
    steps: [
      { step: 1, description: '두부와 애호박은 한입 크기로 썰고 대파는 송송 썹니다.' },
      { step: 2, description: '냄비에 차돌박이를 볶은 뒤 물을 붓고 된장을 풀어 끓입니다.', subDescription: '된장은 조금씩 풀어 넣으며 입맛에 맞게 간을 조절해주세요.' },
      { step: 3, description: '애호박과 두부를 넣고 재료가 익을 때까지 끓입니다.' },
      { step: 4, description: '대파를 넣고 한소끔 더 끓여 마무리합니다.' },
    ],
    tip: '두부는 오래 저으면 부서질 수 있어요. 넣은 뒤 국자로 살살 섞고, 차돌박이에서 나온 기름은 취향에 따라 걷어주세요.',
  },
  tofu: {
    description: '부드러운 두부와 계란을 고소하게 볶아 만드는 간단한 요리입니다. 냉장고 속 재료만으로 빠르게 준비할 수 있어 바쁜 날에도 좋아요. 대파 향과 굴소스가 어우러져 혼자 먹는 한 끼도 맛있게 완성됩니다.',
    servings: 1, difficulty: '초급', tools: ['프라이팬', '주걱', '볼'],
    ingredients: [ingredient('두부', 0.5, '모', true), ingredient('계란', 2, '개', true), ingredient('굴소스', 0.5, '스푼', true), ingredient('대파', 0.25, '대', true)],
    steps: [
      { step: 1, description: '두부는 물기를 빼고 먹기 좋게 자릅니다. 계란은 볼에 풀고 대파는 송송 썹니다.', subDescription: '두부의 물기를 충분히 제거하면 볶을 때 물이 덜 생겨요.' },
      { step: 2, description: '달군 팬에 대파와 두부를 볶다가 계란과 굴소스를 넣습니다. 계란이 익을 때까지 부드럽게 저어 완성합니다.' },
    ],
    tip: '계란을 넣은 뒤에는 불을 낮춰 천천히 저어주세요. 두부를 너무 잘게 부수지 않으면 부드러운 식감을 더 잘 느낄 수 있어요.',
  },
}
