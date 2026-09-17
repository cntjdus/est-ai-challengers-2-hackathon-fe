export function isValidNickname(value) {
  // Duplicate nicknames are allowed; only the display format is validated.
  return typeof value === 'string' && /^[가-힣a-zA-Z0-9]{2,12}$/.test(value.trim())
}
