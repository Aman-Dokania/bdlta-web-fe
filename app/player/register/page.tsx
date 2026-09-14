'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase/client'

export default function PlayerRegistrationPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  const [isExistingMember, setIsExistingMember] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      // Check logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please login first.')
      }

      let photoPath = ''

      // Upload photo
      if (photo) {
        const fileExtension = photo.name.split('.').pop()?.toLowerCase()

        const fileName = `profile.${fileExtension}`

        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('player-photos')
          .upload(filePath, photo, {
            upsert: false,
            contentType: photo.type,
          })

        if (uploadError) {
          console.error(uploadError)
          throw new Error('Could not upload photo.')
        }

        photoPath = filePath
      }

      // Create player profile
      const { data, error } = await supabase.rpc(
        'create_player_profile',
        {
          p_full_name: fullName,
          p_date_of_birth: dateOfBirth || null,
          p_gender: gender || null,
          p_phone: phone ? `+91 ${phone}` : phone,
          p_address: address || null,
          p_photo_url: photoPath || null,
          p_is_existing_member: isExistingMember,
        }
      )

      if (error) {
        console.error(error)

        // If player creation fails after photo upload,
        // remove the uploaded photo.
        if (photoPath) {
          await supabase.storage
            .from('player-photos')
            .remove([photoPath])
        }

        throw new Error(error.message)
      }

      console.log('Player created:', data)

      if (isExistingMember) {
        setMessage(
          'Registration submitted! Your existing membership request is now pending admin approval.'
        )
      } else {
        setMessage('Registration successful!')
      }

      setTimeout(() => {
        router.push('/player/dashboard')
        router.refresh()
      }, 1500)

    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-court)]">
          <span className="h-px w-8 bg-[var(--color-court)]" />
          New player profile
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(18,60,44,0.16)] backdrop-blur-sm">
          <div className="bg-[var(--color-forest)] px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-bold tracking-[0.3em] text-[#b9f23d]">BDLTA</p>
                <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Player Registration
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-100 sm:text-base">
                  Enter your details to create your BDLTA player profile.
                </p>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold text-[#b9f23d] sm:flex">
                B
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 py-7 sm:px-10 sm:py-10">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[var(--color-court)]">1</span>
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-forest)]">Personal details</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="full-name" className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-court)] focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Enter your full name" />
                </div>

                <div>
                  <label htmlFor="date-of-birth" className="mb-2 block text-sm font-semibold text-slate-700">Date of Birth</label>
                  <input id="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-court)] focus:bg-white focus:ring-4 focus:ring-emerald-100" />
                </div>

                <div>
                  <label htmlFor="gender" className="mb-2 block text-sm font-semibold text-slate-700">Gender</label>
                  <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-court)] focus:bg-white focus:ring-4 focus:ring-emerald-100">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="flex overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] transition focus-within:border-[var(--color-court)] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                    <span className="flex items-center border-r border-[var(--color-line)] px-4 text-sm font-bold text-[var(--color-forest)]">+91</span>
                    <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400" placeholder="Enter your phone number" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">This number will be stored in your player profile.</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="mb-2 block text-sm font-semibold text-slate-700">Address <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-court)] focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Enter your address" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[var(--color-court)]">2</span>
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-forest)]">Membership status</h2>
              </div>

              <fieldset>
                <legend className="text-base font-bold text-slate-800">Are you already a BDLTA member?</legend>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">If you are already a member of the association, select Yes. Your membership will be verified by an administrator.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${!isExistingMember ? 'border-[var(--color-court)] bg-emerald-50 ring-2 ring-emerald-100' : 'border-[var(--color-line)] bg-white hover:border-emerald-300'}`}>
                    <input type="radio" name="existingMember" checked={!isExistingMember} onChange={() => setIsExistingMember(false)} className="mt-0.5 h-4 w-4 accent-[var(--color-court)]" />
                    <span><span className="block text-sm font-bold text-slate-800">New member</span><span className="mt-1 block text-xs text-slate-500">I am joining BDLTA for the first time.</span></span>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${isExistingMember ? 'border-[var(--color-court)] bg-emerald-50 ring-2 ring-emerald-100' : 'border-[var(--color-line)] bg-white hover:border-emerald-300'}`}>
                    <input type="radio" name="existingMember" checked={isExistingMember} onChange={() => setIsExistingMember(true)} className="mt-0.5 h-4 w-4 accent-[var(--color-court)]" />
                    <span><span className="block text-sm font-bold text-slate-800">Existing member</span><span className="mt-1 block text-xs text-slate-500">I already have a BDLTA membership.</span></span>
                  </label>
                </div>
              </fieldset>

              {isExistingMember && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Your registration will be sent to an administrator for verification. You will not need to pay the ₹1,000 lifetime membership fee unless your request is rejected and you choose to register as a new member.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[var(--color-court)]">3</span>
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-forest)]">Profile photo</h2>
              </div>
              <label htmlFor="player-photo" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-8 text-center transition hover:border-[var(--color-court)] hover:bg-emerald-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-[var(--color-court)] shadow-sm">↑</span>
                <span className="mt-3 text-sm font-bold text-[var(--color-forest)]">{photo ? photo.name : 'Upload your player photo'}</span>
                <span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP · Maximum 5 MB</span>
                <input id="player-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null
                  if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
                    setMessage('Photo must be smaller than 5 MB.')
                    e.target.value = ''
                    setPhoto(null)
                    return
                  }
                  setMessage('')
                  setPhoto(selectedFile)
                }} className="sr-only" />
              </label>
            </div>

            <div className="border-t border-slate-100 pt-7">
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--color-forest)] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[var(--color-court)] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Creating profile...' : isExistingMember ? 'Submit Existing Member Request' : 'Create Player Profile'}
              </button>
              {message && <p role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-600">{message}</p>}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}