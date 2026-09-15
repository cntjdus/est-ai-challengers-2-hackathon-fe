import { useState } from 'react'
import { defaultPreferences } from '../data/preferences'

export default function usePreferences(initial = defaultPreferences) {
  const [householdType, setHouseholdType] = useState(initial.householdType ?? defaultPreferences.householdType)
  const [cookingFrequency, setCookingFrequency] = useState(initial.cookingFrequency ?? defaultPreferences.cookingFrequency)
  const [dietStyles, setDietStyles] = useState(initial.dietStyles ?? defaultPreferences.dietStyles)
  const [excludedIngredients, setExcludedIngredients] = useState(initial.excludedIngredients ?? defaultPreferences.excludedIngredients)
  const [allergies, setAllergies] = useState(initial.allergies ?? [])
  const [allergyInput, setAllergyInput] = useState('')
  const [dietKeyword, setDietKeyword] = useState('')
  const [ingredientInput, setIngredientInput] = useState('')

  const addDietKeyword = () => {
    const value = dietKeyword.trim().replace(/^#+\s*/, '').trim()
    if (value) setDietStyles((previous) => previous.includes(value) ? previous : [...previous, value])
    setDietKeyword('')
  }
  const addOnEnter = (event, input, setInput, setItems, stripHash = false) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    const value = (stripHash ? input.trim().replace(/^#+\s*/, '') : input).trim()
    if (value) setItems((previous) => previous.includes(value) ? previous : [...previous, value])
    setInput('')
  }
  return {
    preferences: { householdType, cookingFrequency, dietStyles, excludedIngredients, allergies },
    dietaryProps: {
      householdType, onHouseholdChange: setHouseholdType,
      cookingFrequency, onFrequencyChange: setCookingFrequency,
      dietStyles, onRemoveStyle: (style) => setDietStyles((previous) => previous.filter((item) => item !== style)),
      onAddKeyword: addDietKeyword, dietKeyword, onKeywordChange: setDietKeyword,
      onKeywordKeyDown: (event) => addOnEnter(event, dietKeyword, setDietKeyword, setDietStyles, true),
    },
    allergyProps: {
      ingredientInput: allergyInput, onInputChange: setAllergyInput,
      onInputKeyDown: event => addOnEnter(event, allergyInput, setAllergyInput, setAllergies),
      excludedIngredients: allergies, onRemove: value => setAllergies(items => items.filter(i => i !== value)),
      title: '알레르기 재료', description: '알레르기가 있는 재료를 입력하고 Enter를 눌러 등록해주세요.', sectionId: 'allergy-heading', inputLabel: '알레르기 재료 입력',
    },
    avoidProps: {
      ingredientInput, onInputChange: setIngredientInput,
      onInputKeyDown: (event) => addOnEnter(event, ingredientInput, setIngredientInput, setExcludedIngredients),
      excludedIngredients, onRemove: (ingredient) => setExcludedIngredients((previous) => previous.filter((item) => item !== ingredient)),
    },
  }
}
