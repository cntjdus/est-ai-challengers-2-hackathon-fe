import { defaultGoogleAccount } from '../../data/googleAccount'
import { useEffect, useRef, useState } from 'react'
import googleLogo from '../../assets/google-logo.svg'
import sproutIcon from '../../assets/icons/sprout.svg'
import closeIcon from '../../assets/icons/close.svg'
import accountAddIcon from '../../assets/icons/account-add.svg'
import chevronIcon from '../../assets/icons/account-chevron.svg'
import plusIcon from '../../assets/icons/account-plus.svg'
import arrowIcon from '../../assets/icons/continue-arrow.svg'
import shieldIcon from '../../assets/icons/shield.svg'

export default function GoogleAccountModal({ onClose, onTerms, onPrivacy, account = defaultGoogleAccount, onContinue }) {
  const dialogRef = useRef(null)
  const sheetRef = useRef(null)
  const dragRef = useRef(null)
  const [sheetHeight, setSheetHeight] = useState(null)

  const resizeSheet = (height) => {
    const viewportHeight = dialogRef.current.clientHeight
    setSheetHeight(Math.max(Math.min(180, viewportHeight), Math.min(viewportHeight, height)))
  }

  const handleDragStart = (event) => {
    if (!event.isPrimary || event.button !== 0) return
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: sheetRef.current.getBoundingClientRect().height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    resizeSheet(drag.startHeight + drag.startY - event.clientY)
  }

  const handleDragEnd = () => {
    dragRef.current = null
  }

  const handleResizeKey = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const height = sheetRef.current.getBoundingClientRect().height
    resizeSheet(event.key === 'Home' ? 180
      : event.key === 'End' ? dialogRef.current.clientHeight
      : height + (event.key === 'ArrowUp' ? 40 : -40))
  }

  const [selectedAccount, setSelectedAccount] = useState(account)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return
    const buttons = Array.from(dialogRef.current.querySelectorAll('button:not(:disabled)'))
      .filter((button) => button.tabIndex >= 0)
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  const handleOtherGoogleAccount = () => {
    // TODO: Google OAuth 계정 선택 연결
    console.info('Google OAuth 계정 선택 연결 예정')
  }

  const handleContinue = () => {
    if (!selectedAccount) return
    // TODO: 선택한 Google 계정으로 로그인 처리
    onContinue?.(selectedAccount)
  }

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      aria-labelledby="google-account-title"
      aria-describedby="google-account-description"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-[#161c25] backdrop:bg-transparent"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="계정 선택 배경 닫기"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-[#161c25]/30 backdrop-blur-[3px] transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none"
      />
      <div ref={sheetRef} style={sheetHeight === null ? undefined : { height: sheetHeight }} className="absolute bottom-0 left-1/2 flex max-h-[100dvh] w-full flex-col max-w-app -translate-x-1/2 overflow-hidden rounded-t-[32px] border-t border-[#bbcabf]/30 bg-white shadow-[0_-10px_40px_-10px_rgba(0,108,73,0.08),0_-4px_16px_-4px_rgba(22,28,37,0.05)] transition-[translate,opacity] duration-200 ease-out starting:translate-y-4 starting:opacity-0 motion-reduce:transition-none">
        <button
          type="button"
          aria-label="계정 선택 시트 높이 조절"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onLostPointerCapture={handleDragEnd}
          onKeyDown={handleResizeKey}
          className="flex h-[34px] w-full shrink-0 touch-none select-none items-start justify-center rounded-t-[32px] pt-3 cursor-grab active:cursor-grabbing"
        >
          <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-[#bbcabf]/60" />
        </button>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-[max(32px,env(safe-area-inset-bottom))]">

        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#006c49]/10 shadow-xs">
              <img src={sproutIcon} alt="" className="size-[15px]" />
            </span>
            <p className="flex items-baseline gap-2">
              <span className="text-xs leading-[18px] font-bold tracking-[-0.3px] text-[#006c49]">한끼루프</span>
              <span className="text-[11px] leading-[16.5px] font-medium text-[#3c4a42]">계정 연동</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="계정 선택 닫기" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e9eefb]">
            <img src={closeIcon} alt="" className="size-[11.667px]" />
          </button>
        </header>

        <section className="mb-5 flex flex-col gap-1">
          <p className="flex items-center gap-2 text-[13px] leading-[19.5px] font-medium text-[#3c4a42]">
            <img src={googleLogo} alt="" className="size-4" />
            Google 빠른 로그인
          </p>
          <h2 id="google-account-title" className="pt-0.5 text-xl leading-[27.5px] font-bold tracking-[-0.5px]">
            한끼루프에 로그인할 계정을<br />선택해 주세요
          </h2>
          <p id="google-account-description" className="text-[13px] leading-[19.5px] text-[#3c4a42]/80">
            식재료 유통기한과 식단 루틴을 안전하게 동기화합니다.
          </p>
        </section>

        <div className="mb-5 flex flex-col gap-2.5">
          <button
            type="button"
            aria-pressed={selectedAccount?.id === account.id}
            onClick={() => setSelectedAccount(account)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#bbcabf]/40 bg-[#f8f9ff] p-[15px] text-left aria-pressed:border-[#006c49]/20 aria-pressed:bg-[#eff4ff] aria-pressed:shadow-[0_2px_8px_rgba(0,108,73,0.04),0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-45 from-[#059669] to-[#14b8a6] text-[15px] font-bold text-white shadow-xs">
                {account.nickname}
                <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-white p-0.5 shadow-sm">
                  <img src={googleLogo} alt="" className="size-3" />
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] leading-[22.5px] font-bold tracking-[-0.375px]">{account.name}</span>
                  <span className="rounded-full bg-[#006c49]/10 px-1.5 py-0.5 text-[10px] leading-[15px] font-semibold text-[#006c49]">최근 사용</span>
                </span>
                <span className="break-all text-[13px] leading-[19.5px] text-[#3c4a42]">{account.email}</span>
              </span>
            </span>
            <img src={chevronIcon} alt="" className="h-2.5 w-[14.167px] shrink-0" />
          </button>

          <button type="button" onClick={handleOtherGoogleAccount} className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#bbcabf]/40 bg-[#f8f9ff] p-[15px] text-left transition-colors hover:bg-[#eff4ff]">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e9eefb]">
                <img src={accountAddIcon} alt="" className="h-[14.667px] w-[20.167px]" />
              </span>
              <span className="min-w-0">
                <span className="block break-keep text-sm leading-[21px] font-semibold">다른 Google 계정으로 로그인</span>
                <span className="block text-xs leading-[18px] text-[#3c4a42]">새로운 계정 직접 입력</span>
              </span>
            </span>
            <img src={plusIcon} alt="" className="size-[11.667px] shrink-0" />
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button type="button" onClick={handleContinue} disabled={!selectedAccount} className="flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#006c49] px-4 py-3.5 text-[15px] leading-[22.5px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(0,108,73,0.2),0_2px_4px_-2px_rgba(0,108,73,0.2)] transition-colors hover:bg-[#005b3e] disabled:cursor-not-allowed disabled:opacity-50">
            <span className="w-[160px] max-w-full">계정으로 계속하기</span>
            <img src={arrowIcon} alt="" className="size-3 shrink-0" />
          </button>
          <div className="flex items-start gap-2 rounded-xl border border-[#bbcabf]/30 bg-[#eff4ff]/80 p-[13px]">
            <img src={shieldIcon} alt="" className="h-[15.333px] w-[10.667px] shrink-0" />
            <p className="min-w-0 text-[11.5px] leading-[18.69px] text-[#3c4a42]">
              계속 진행하면 한끼루프의{' '}
              <button type="button" onClick={onTerms} className="font-medium text-[#006c49] underline underline-offset-2">이용약관</button> 및{' '}
              <button type="button" onClick={onPrivacy} className="font-medium text-[#006c49] underline underline-offset-2">개인정보처리방침</button>에
              동의하게 되며, 이름 및 이메일 정보가 안전하게 전달됩니다.
            </p>
          </div>
        </div>
      </div>
        </div>
    </dialog>
  )
}
