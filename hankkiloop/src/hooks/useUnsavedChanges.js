import { useEffect } from 'react'

export default function useUnsavedChanges(dirty, busy = false) {
  useEffect(() => {
    if (!dirty && !busy) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy])
  return () => !busy && (!dirty || window.confirm('저장하지 않은 변경사항이 있어요. 저장하지 않고 이동할까요?'))
}
