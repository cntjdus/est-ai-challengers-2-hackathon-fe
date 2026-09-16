import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canonicalQuantity } from '../src/data/unitConversion'
import { loadRecipeCatalog, recipeStock } from '../src/data/recipeApi'
import { planDeductions } from '../src/data/fridgeApi'
import { shoppingPayload } from '../src/data/shoppingApi'
import useUserState from '../src/hooks/useUserState'
import UnitConversionSettings from '../src/components/mypage/UnitConversionSettings'
import * as api from '../src/data/userStateApi'
vi.mock('../src/data/userStateApi', () => ({ loadSavedRecipes: vi.fn(), loadNotificationReads: vi.fn(), setRecipeSaved: vi.fn(), saveNotificationReads: vi.fn() }))

const foods = [{ id: 'tofu', name: '두부', base_unit: 'g' }, { id: 'sauce', name: '간장', base_unit: 'ml' }]
const conversions = [{ food_id: 'tofu', unit: 'ea', base_quantity: 300 }, { food_id: 'tofu', unit: 'pack', base_quantity: 600 }]
const lot = (id, quantity, unit, date) => ({ id, purchaseAmount: quantity, expiryDate: date, dbRow: { food_id: 'tofu', display_name: '두부', quantity, unit } })
describe('unit conversions across the shopping/cooking flow', () => {
  it('combines grams and pieces once and deducts original lot units by expiry', () => {
    const stock = recipeStock([lot('a', 0.5, 'ea', '2026-09-20'), lot('b', 100, 'g', '2026-09-21')], foods, [], conversions)
    expect(stock.inventory['food:tofu:g']).toBe(250)
    const changes = planDeductions(stock.registrations, [{ id: 'food:tofu:g', deduct: 200 }])
    expect(changes.map(c => [c.id, c.delta, c.status])).toEqual([['a', -0.5, 'consumed'], ['b', -50, 'active']])
    const recipe = { servings: 1, ingredients: [{ id: 'food:tofu:g', foodId: 'tofu', quantity: 300, dbUnit: 'g' }] }
    expect(shoppingPayload(recipe, 2, stock.inventory)).toEqual([{ food_id: 'tofu', unit: 'g', required_quantity: 600, available_quantity: 250 }])
  })
  it('converts recipe ingredients before grouping to avoid double stock budgets', async () => {
    const tables = { food_items: foods, food_aliases: [], hk_food_unit_conversions: conversions, recipes: [{ id: 'r', base_servings: 1, recipe_ingredients: [{ food_id: 'tofu', quantity: 0.5, unit: 'ea' }, { food_id: 'tofu', quantity: 50, unit: 'g' }] }] }
    const client = { from: name => { const q = { select: () => q, eq: () => q, order: () => q, then: resolve => resolve({ data: tables[name] }) }; return q } }
    const catalog = await loadRecipeCatalog(client, 'u')
    expect(catalog.recipes[0].ingredients).toHaveLength(1)
    expect(catalog.recipes[0].ingredients[0].quantity).toBe(200)
  })
  it('does not infer unconfigured piece/mass conversions and supports measured spoons', () => {
    expect(canonicalQuantity(foods[0], 1, 'ea', [])).toEqual({ quantity: 1, unit: 'ea', factor: 1 })
    expect(canonicalQuantity(foods[1], 2, 'tbsp')).toEqual({ quantity: 30, unit: 'ml', factor: 15 })
    expect(canonicalQuantity(foods[0], 1, 'tbsp')).toEqual({ quantity: 1, unit: 'tbsp', factor: 1 })
    expect(() => canonicalQuantity(foods[0], 1e8, 'pack', conversions)).toThrow('범위')
  })
  it('rounds in the stored unit without leaving an active zero-quantity lot', () => {
    const stock = recipeStock([lot('a', 0.0001, 'ea', '')], foods, [], conversions)
    expect(planDeductions(stock.registrations, [{ id: 'food:tofu:g', deduct: 0.029 }])[0]).toMatchObject({ delta: -0.0001, status: 'consumed' })
    expect(() => planDeductions(stock.registrations, [{ id: 'food:tofu:g', deduct: 0.001 }])).toThrow('최소 수량')
  })
  it('saves a user-entered conversion through the settings screen', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const reload = vi.fn()
    render(<UnitConversionSettings client={{ from: () => ({ upsert }) }} userId="u" foods={foods} conversions={[]} onReload={reload} />)
    fireEvent.change(screen.getByLabelText('환산 식재료'), { target: { value: 'tofu' } })
    fireEvent.change(screen.getByLabelText('기준 단위 수량'), { target: { value: '300' } })
    fireEvent.click(screen.getByText('환산 기준 저장'))
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
    expect(upsert.mock.calls[0][0]).toEqual({ user_id: 'u', food_id: 'tofu', unit: 'ea', base_quantity: 300 })
  })
})

describe('persistent user state', () => {
  let saved, reads
  beforeEach(() => {
    vi.resetAllMocks(); saved = new Map(); reads = new Map()
    api.loadSavedRecipes.mockImplementation(async (_client, user) => [...(saved.get(user) ?? [])])
    api.loadNotificationReads.mockImplementation(async (_client, user) => [...(reads.get(user) ?? [])])
    api.setRecipeSaved.mockImplementation(async (_client, user, id, value) => { const s = saved.get(user) ?? new Set(); if (value) s.add(id); else s.delete(id); saved.set(user, s) })
    api.saveNotificationReads.mockImplementation(async (_client, user, ids) => { reads.set(user, new Set([...(reads.get(user) ?? []), ...ids])) })
  })
  it('restores saves and read acknowledgements after remount and isolates accounts', async () => {
    let hook = renderHook(() => useUserState(null, 'a'))
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    await act(async () => { await hook.result.current.toggleSave('recipe'); await hook.result.current.markRead(['one', 'two']) })
    hook.unmount()
    hook = renderHook(() => useUserState(null, 'a'))
    await waitFor(() => expect(hook.result.current.savedIds).toEqual(['recipe']))
    expect(hook.result.current.readIds).toEqual(['one', 'two'])
    await act(() => hook.result.current.toggleSave('recipe'))
    expect(hook.result.current.savedIds).toEqual([])
    hook.unmount()
    hook = renderHook(() => useUserState(null, 'b'))
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    expect(hook.result.current.readIds).toEqual([])
    expect(hook.result.current.savedIds).toEqual([])
  })
  it('does not show success for a failed write and prevents duplicate rapid clicks', async () => {
    const hook = renderHook(() => useUserState(null, 'a'))
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    api.setRecipeSaved.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await Promise.all([hook.result.current.toggleSave('r'), hook.result.current.toggleSave('r')]) })
    expect(api.setRecipeSaved).toHaveBeenCalledOnce()
    expect(hook.result.current.savedIds).toEqual([])
    expect(hook.result.current.error).toContain('offline')
    api.saveNotificationReads.mockRejectedValueOnce(new Error('offline'))
    await act(() => hook.result.current.markRead(['n']))
    expect(hook.result.current.readIds).toEqual([])
  })
})
