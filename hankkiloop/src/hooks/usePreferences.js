import { useState } from 'react'
import { defaultPreferences } from '../data/preferences'
import { appendTag, collectPreferenceDraft, normalizeTags } from '../utils/preferenceDraft.js'

export default function usePreferences(initial = defaultPreferences) {
  const [value, setValue] = useState(() => ({ ...defaultPreferences, ...initial, allergies: initial?.allergies ?? [] }))
  const [dietKeyword, setDietKeyword] = useState('')
  const [ingredientInput, setIngredientInput] = useState('')
  const [allergyInput, setAllergyInput] = useState('')
  const [inputError, setInputError] = useState('')
  const change = (key, next) => { setInputError(''); setValue(previous => ({ ...previous, [key]: next })) }
  const remove = (key, item) => { setInputError(''); setValue(previous => ({ ...previous, [key]: previous[key].filter(tag => tag !== item) })) }
  const add = (key, input, clear, stripHash = false) => {
    try { const next = normalizeTags(appendTag(value[key], input, stripHash)); change(key, next); clear('') }
    catch (error) { setInputError(error.message) }
  }
  const onEnter = action => event => {
    if (event.key !== 'Enter' || event.nativeEvent?.isComposing || event.keyCode === 229) return
    event.preventDefault(); action()
  }
  const addDiet = () => add('dietStyles', dietKeyword, setDietKeyword, true)
  const addAvoid = () => add('excludedIngredients', ingredientInput, setIngredientInput)
  const addAllergy = () => add('allergies', allergyInput, setAllergyInput)
  const reset = next => {
    setValue({ ...defaultPreferences, ...next, allergies: next?.allergies ?? [] })
    setDietKeyword(''); setIngredientInput(''); setAllergyInput(''); setInputError('')
  }
  return {
    preferences: value, reset, inputError,
    hasPendingInput: Boolean(dietKeyword.trim() || ingredientInput.trim() || allergyInput.trim()),
    getDraft: () => collectPreferenceDraft(value, { dietKeyword, ingredientInput, allergyInput }),
    dietaryProps: {
      householdType: value.householdType, onHouseholdChange: next => change('householdType', next),
      cookingFrequency: value.cookingFrequency, onFrequencyChange: next => change('cookingFrequency', next),
      dietStyles: value.dietStyles, onRemoveStyle: item => remove('dietStyles', item),
      dietKeyword, onKeywordChange: setDietKeyword, onKeywordKeyDown: onEnter(addDiet), onAddKeyword: addDiet,
    },
    avoidProps: {
      ingredientInput, onInputChange: setIngredientInput, onInputKeyDown: onEnter(addAvoid), onAdd: addAvoid,
      excludedIngredients: value.excludedIngredients, onRemove: item => remove('excludedIngredients', item),
    },
    allergyProps: {
      ingredientInput: allergyInput, onInputChange: setAllergyInput, onInputKeyDown: onEnter(addAllergy), onAdd: addAllergy,
      excludedIngredients: value.allergies, onRemove: item => remove('allergies', item),
      title: '알레르기 재료', description: '알레르기가 있는 재료를 추가해주세요. 실제 성분표도 반드시 확인해주세요.',
      sectionId: 'allergy-heading', inputLabel: '알레르기 재료 입력', selectedLabel: '등록된 알레르기 재료:',
    },
  }
}
