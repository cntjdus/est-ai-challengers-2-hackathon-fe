import { useEffect, useRef, useState } from 'react'
import { authErrorMessage } from '../auth/errors'
import usePreferences from '../hooks/usePreferences'
import useUnsavedChanges from '../hooks/useUnsavedChanges'
import { isValidNickname } from '../utils/profileValidation'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import AccountInfoCard from '../components/profile/AccountInfoCard'
import EditProfileFooter from '../components/profile/EditProfileFooter'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'

export default function EditProfilePage({ account, nickname = '', initialPreferences, onCancel, onSave }) {
  const [editedNickname, setEditedNickname] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const form = usePreferences(initialPreferences)
  const [baseline] = useState(() => JSON.stringify(form.preferences))
  const dirty = editedNickname.trim() !== nickname || form.hasPendingInput || JSON.stringify(form.preferences) !== baseline
  const confirmLeave = useUnsavedChanges(dirty, busy)
  const isNicknameValid = isValidNickname(editedNickname)
  const canSave = isNicknameValid && !busy
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current?.focus() }, [])
  const cancel = () => { if (confirmLeave()) onCancel() }
  const save = async () => {
    if (!canSave || saving.current) return
    saving.current = true; setBusy(true); setError('')
    try { await onSave({ account, nickname: editedNickname.trim(), preferences: form.getDraft() }) }
    catch (failure) { setError(authErrorMessage(failure)) }
    finally { saving.current = false; setBusy(false) }
  }
  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8fafc] outline-none">
      <EditProfileHeader onBack={cancel} />
      <main aria-label="개인정보 수정 양식" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <fieldset disabled={busy} className="flex flex-col gap-4">
          <AccountInfoCard email={account.email} nickname={editedNickname} onNicknameChange={setEditedNickname} realName={account.name ?? ''} isNicknameValid={isNicknameValid} />
          <DietaryPreferencesSection {...form.dietaryProps} showAddButton />
          <AvoidIngredientsSection {...form.avoidProps} />
          <AvoidIngredientsSection {...form.allergyProps} />
          {(error || form.inputError) && <p role="alert" className="text-sm text-red-700">{error || form.inputError}</p>}
        </fieldset>
      </main>
      <EditProfileFooter busy={busy} onCancel={cancel} onSave={save} disabled={!canSave} />
    </div>
  )
}
