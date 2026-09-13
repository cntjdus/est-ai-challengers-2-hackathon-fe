import { useEffect, useRef, useState } from 'react'
import { defaultGoogleAccount } from '../data/googleAccount'
import usePreferences from '../hooks/usePreferences'
import { isValidNickname } from '../utils/profileValidation'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import AccountInfoCard from '../components/profile/AccountInfoCard'
import EditProfileFooter from '../components/profile/EditProfileFooter'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'

export default function EditProfilePage({ account = defaultGoogleAccount, nickname = '자취새싹이', initialPreferences, onCancel, onSave }) {
  const [editedNickname, setEditedNickname] = useState(nickname)
  const [realName, setRealName] = useState(account.name ?? '')
  const { preferences, dietaryProps, avoidProps } = usePreferences(initialPreferences)
  const isNicknameValid = isValidNickname(editedNickname)
  const canSave = isNicknameValid && realName.trim().length > 0
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleSave = () => {
    if (!canSave) return
    // TODO: profile 수정 API 연결
    onSave({ account: { ...account, name: realName.trim() }, nickname: editedNickname.trim(), preferences })
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8fafc] outline-none">
      <EditProfileHeader onBack={onCancel} />
      <main aria-label="개인정보 수정 양식" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="flex flex-col gap-4">
          <AccountInfoCard email={account.email} nickname={editedNickname} onNicknameChange={setEditedNickname} realName={realName} onRealNameChange={setRealName} isNicknameValid={isNicknameValid} />
          <DietaryPreferencesSection {...dietaryProps} showAddButton />
          <AvoidIngredientsSection {...avoidProps} />
        </div>
      </main>
      <EditProfileFooter onCancel={onCancel} onSave={handleSave} disabled={!canSave} />
    </div>
  )
}
