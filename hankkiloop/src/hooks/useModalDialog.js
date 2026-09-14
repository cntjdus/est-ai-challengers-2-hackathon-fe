import { useLayoutEffect } from 'react'

// Native modal focus isolation and the same body lock for drawers and sheets.
export default function useModalDialog(dialogRef) {
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const focus = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (focus?.isConnected) focus.focus({ preventScroll: true })
    }
  }, [dialogRef])
}
