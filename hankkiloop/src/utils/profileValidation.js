export function isValidNickname(value) {
  // TODO: 닉네임 중복 확인 API 연결
  return /^[가-힣a-zA-Z0-9]{2,12}$/.test(value.trim())
}
