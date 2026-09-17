import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import PhotoRecognitionSection from '../src/components/register/PhotoRecognitionSection'
import MaterialRegister from '../src/pages/MaterialRegister'
import { extractExpiry } from '../src/data/expiryOcr'
vi.mock('../src/data/expiryOcr', async original => ({ ...await original(), extractExpiry: vi.fn() }))
const candidate = { id: 'date-1', iso_date: '2026-09-30', raw: '2026.09.30', kind: 'use_by', source_text: '소비기한 2026.09.30', warnings: [] }
const result = { message: '후보 확인', raw_text: '소비기한 2026.09.30', candidates: [candidate] }
const file = new File(['image'], 'date.jpg', { type: 'image/jpeg' })
function Harness({ onConfirm }) {
  const [photo, setPhoto] = useState({ url: 'blob:test', file, loaded: true })
  return <PhotoRecognitionSection photo={photo} onPhotoChange={setPhoto} onConfirm={onConfirm} materialName="우유" />
}
beforeEach(() => {
  vi.clearAllMocks(); history.replaceState({}, '', '/fridge/register')
  URL.createObjectURL = vi.fn(() => 'blob:new-photo'); URL.revokeObjectURL = vi.fn()
  extractExpiry.mockResolvedValue(result)
})
async function readAndChoose() {
  fireEvent.click(screen.getByRole('button', { name: '선택 영역 날짜 읽기' }))
  fireEvent.click(await screen.findByRole('button', { name: /2026-09-30 · 소비기한/ }))
}
it('preselects one safe use-by candidate but never applies it automatically', async () => {
  const confirm = vi.fn(); render(<Harness onConfirm={confirm} />)
  fireEvent.click(screen.getByRole('button', { name: '선택 영역 날짜 읽기' }))
  expect((await screen.findByLabelText('OCR 확인 날짜')).value).toBe('2026-09-30')
  expect(screen.getByRole('checkbox').checked).toBe(false)
  expect(screen.getByRole('button', { name: '확인한 소비기한 반영' }).disabled).toBe(true)
  expect(confirm).not.toHaveBeenCalled()
})
it('requires explicit confirmation and does not auto-register', async () => {
  const confirm = vi.fn(); render(<Harness onConfirm={confirm} />)
  await readAndChoose()
  expect(confirm).not.toHaveBeenCalled()
  const apply = screen.getByRole('button', { name: '확인한 소비기한 반영' })
  expect(apply.disabled).toBe(true)
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(apply)
  expect(confirm).toHaveBeenCalledWith({ date: '2026-09-30', kind: 'use_by', candidateId: 'date-1' })
})
it('keeps missing years empty and does not relabel sell-by as use-by', async () => {
  extractExpiry.mockResolvedValue({ ...result, candidates: [{ ...candidate, iso_date: null, raw: '03.13', kind: 'sell_by', warnings: ['missing_year'] }] })
  const confirm=vi.fn(); render(<Harness onConfirm={confirm} />)
  fireEvent.click(screen.getByRole('button', { name: '선택 영역 날짜 읽기' }))
  fireEvent.click(await screen.findByRole('button', { name: /03.13 · 유통기한/ }))
  expect(screen.getByLabelText('OCR 확인 날짜').value).toBe('')
  fireEvent.change(screen.getByLabelText('OCR 확인 날짜'), { target: { value: '2027-03-13' } })
  fireEvent.click(screen.getByRole('checkbox'))
  expect(screen.getByRole('button', { name: '확인한 소비기한 반영' }).disabled).toBe(true)
  expect(confirm).not.toHaveBeenCalled()
})
it('discards pending results when changing the selected material', async () => {
  let finish; extractExpiry.mockImplementation(() => new Promise(resolve => { finish=resolve }))
  const confirm=vi.fn(); const mounted=render(<Harness key="first" onConfirm={confirm} />)
  fireEvent.click(screen.getByRole('button', { name: '선택 영역 날짜 읽기' }))
  mounted.rerender(<Harness key="second" onConfirm={confirm} />)
  finish(result)
  await waitFor(() => expect(screen.queryByText('후보 확인')).toBeNull())
  expect(confirm).not.toHaveBeenCalled()
})
it('applies the reviewed date to the existing registration flow and only saves on final click', async () => {
  const save=vi.fn().mockResolvedValue()
  render(<MaterialRegister source="fridge-direct" items={[]} onRegister={save} onNavigate={vi.fn()} onBack={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('식재료'), { target: { value: '우유' } })
  fireEvent.change(screen.getByLabelText('구매량'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('구매일'), { target: { value: '2026-09-17' } })
  fireEvent.click(screen.getByRole('button', { name: '사진 촬영(소비기한)' }))
  fireEvent.change(screen.getByLabelText('앨범 사진 선택'), { target: { files: [file] } })
  fireEvent.load(screen.getByAltText('선택한 제품의 날짜 사진'))
  await readAndChoose()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: '확인한 소비기한 반영' }))
  expect(screen.getByLabelText('소비기한').value).toBe('2026-09-30')
  expect(save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '확인하고 냉장고에 등록하기' }))
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  expect(save.mock.calls[0][0][0]).toMatchObject({ expiryDate: '2026-09-30', recognizedFromPhoto: true })
})
