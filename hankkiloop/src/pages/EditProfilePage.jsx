import { useEffect, useRef, useState } from 'react'
import { authErrorMessage } from '../auth/errors'
import usePreferences from '../hooks/usePreferences'
import { isValidNickname } from '../utils/profileValidation'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import AccountInfoCard from '../components/profile/AccountInfoCard'
import EditProfileFooter from '../components/profile/EditProfileFooter'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'

export default function EditProfilePage({ account, nickname = '자취새싹이', initialPreferences, onCancel, onSave }) {
  const [editedNickname, setEditedNickname] = useState(nickname)
  const realName = account.name ?? ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const { preferences, dietaryProps, avoidProps } = usePreferences(initialPreferences)
  const isNicknameValid = isValidNickname(editedNickname)
  const canSave = isNicknameValid && !busy
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleSave = async () => {
    if (!canSave || saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    try { await onSave({ account, nickname: editedNickname.trim(), preferences }) }
    catch (failure) { setError(authErrorMessage(failure)) }
    finally { saving.current = false; setBusy(false) }
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8fafc] outline-none">
      <EditProfileHeader onBack={onCancel} />
      <main aria-label="개인정보 수정 양식" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <fieldset disabled={busy} className="flex flex-col gap-4">
          <AccountInfoCard email={account.email} nickname={editedNickname} onNicknameChange={setEditedNickname} realName={realName} isNicknameValid={isNicknameValid} />
          <DietaryPreferencesSection {...dietaryProps} showAddButton />
          <AvoidIngredientsSection {...avoidProps} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </fieldset>
      </main>
      <EditProfileFooter busy={busy} onCancel={onCancel} onSave={handleSave} disabled={!canSave} />
    </div>
  )
}
