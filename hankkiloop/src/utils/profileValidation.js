export function isValidNickname(value) {
  // 닉네임 중복은 허용하고 표시 형식만 검증합니다.
  return /^[가-힣a-zA-Z0-9]{2,12}$/.test(value.trim())
}
