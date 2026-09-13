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
