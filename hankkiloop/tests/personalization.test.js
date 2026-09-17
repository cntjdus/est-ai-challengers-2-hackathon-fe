import { expect, it } from 'vitest'
import { personalizeRecipes } from '../src/data/personalization'

const now = new Date(2026, 8, 17, 23, 59)
const ingredient = (id, quantity = 100, optional = false) => ({ id, name: id, quantity, optional })
const recipe = (id, ingredients, extra = {}) => ({ id, title: id, servings: 1, ingredients, ...extra })
const lot = (id, purchaseAmount, expiryDate) => ({ ingredientId: id, purchaseAmount, expiryDate })
const rank = (recipes, inventory, lots = [], preferences = {}) => personalizeRecipes(recipes, preferences, inventory, lots, now)

it('combines expiry utilization, partial stock, and style with 50:40:10 weights', () => {
  const result = rank([recipe('간단', [ingredient('감자'), ingredient('양파')], { minutes: 15 })],
    { 감자: 200, 양파: 50 }, [lot('감자', 200, '2026-09-18')], { dietStyles: ['초간단', '고단백'] })
  // Expiry 0.5, stock 0.75, style 0.5 => 25 + 30 + 5.
  expect(result[0].recommendationScore).toBeCloseTo(60)
})

it('prioritizes urgent inventory use over a fully stocked nonurgent recipe', () => {
  const result = rank([
    recipe('일반', [ingredient('양파')]),
    recipe('임박', [ingredient('감자'), ingredient('당근')]),
  ], { 감자: 100, 양파: 100 }, [lot('감자', 100, '2026-09-17'), lot('양파', 100, '2026-10-01')])
  expect(result.map(r => r.id)).toEqual(['임박', '일반'])
})

it('allocates consumption to earlier lots first without using the same quantity twice', () => {
  const result = rank([recipe('감자요리', [ingredient('감자', 150)])], { 감자: 300 }, [
    lot('감자', 200, '2026-09-20'), lot('감자', 100, '2026-09-17'),
  ])
  expect(result[0].recommendationScore).toBeCloseTo(100 * (((1 + 0.7 * 0.25) / 1.7) * 0.5 + 0.4) / 0.9)
})

it('omits unavailable criteria and counts partial stock without optional ingredients', () => {
  const result = rank([recipe('감자요리', [ingredient('감자'), ingredient('양파', 100, true)])], { 감자: 50 })
  expect(result[0].recommendationScore).toBeCloseTo(50)
})

it('excludes expired stock from availability and treats invalid dates as unknown', () => {
  const result = rank([recipe('감자요리', [ingredient('감자')])], { 감자: 100 }, [
    lot('감자', 50, '2026-09-16'), lot('감자', 50, '2026-02-30'),
  ])
  expect(result[0].recommendationScore).toBeCloseTo(50)
})

it('uses urgency tiers through day seven and ignores zero-quantity lots', () => {
  const result = rank([recipe('감자요리', [ingredient('감자')])], { 감자: 100, 양파: 100, 당근: 100 }, [
    lot('감자', 100, '2026-09-24'), lot('양파', 100, '2026-09-19'),
    lot('당근', 100, '2026-09-25'), lot('고추', 0, '2026-09-17'),
  ])
  expect(result[0].recommendationScore).toBeCloseTo(100 * (0.3 * 0.5 + 0.4) / 0.9)
})

it('filters excluded ingredients before scoring and preserves input order for ties', () => {
  const result = rank([
    recipe('최신', [ingredient('감자')]), recipe('이전', [ingredient('감자')]),
    recipe('제외', [ingredient('계란')]), recipe('비선호', [ingredient('양파')]),
  ], { 감자: 100, 계란: 100, 양파: 100 }, [lot('계란', 100, '2026-09-17')],
  { allergies: ['달걀'], excludedIngredients: ['양파'] })
  expect(result.map(r => r.id)).toEqual(['최신', '이전'])
  expect(rank([recipe('빈레시피', [])], {})[0].recommendationScore).toBe(0)
})
