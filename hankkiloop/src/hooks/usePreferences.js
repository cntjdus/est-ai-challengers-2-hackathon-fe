import { useState } from 'react'
import { defaultPreferences } from '../data/preferences'

export default function usePreferences(initial = defaultPreferences) {
  const [householdType, setHouseholdType] = useState(initial.householdType ?? defaultPreferences.householdType)
  const [cookingFrequency, setCookingFrequency] = useState(initial.cookingFrequency ?? defaultPreferences.cookingFrequency)
  const [dietStyles, setDietStyles] = useState(initial.dietStyles ?? defaultPreferences.dietStyles)
  const [excludedIngredients, setExcludedIngredients] = useState(initial.excludedIngredients ?? defaultPreferences.excludedIngredients)
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
    preferences: { householdType, cookingFrequency, dietStyles, excludedIngredients },
    dietaryProps: {
      householdType, onHouseholdChange: setHouseholdType,
      cookingFrequency, onFrequencyChange: setCookingFrequency,
      dietStyles, onRemoveStyle: (style) => setDietStyles((previous) => previous.filter((item) => item !== style)),
      onAddKeyword: addDietKeyword, dietKeyword, onKeywordChange: setDietKeyword,
      onKeywordKeyDown: (event) => addOnEnter(event, dietKeyword, setDietKeyword, setDietStyles, true),
    },
    avoidProps: {
      ingredientInput, onInputChange: setIngredientInput,
      onInputKeyDown: (event) => addOnEnter(event, ingredientInput, setIngredientInput, setExcludedIngredients),
      excludedIngredients, onRemove: (ingredient) => setExcludedIngredients((previous) => previous.filter((item) => item !== ingredient)),
    },
  }
}
