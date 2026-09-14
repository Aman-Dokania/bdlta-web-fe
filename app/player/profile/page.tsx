'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase/client'

export default function PlayerProfilePage() {
  const router = useRouter()

  const [player, setPlayer] = useState<any>(null)

  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('players')
        .select(
          `
          id,
          player_number,
          full_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          photo_url,
          status
        `
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setError('Unable to load your profile.')
        setLoading(false)
        return
      }

      if (!data) {
        router.push('/player/register')
        return
      }

      setPlayer(data)

      setFullName(data.full_name || '')
      setDateOfBirth(data.date_of_birth || '')
      setGender(data.gender || '')
      setPhoneNumber(
        (data.phone || '').replace(/^\+91\s*/, '').replace(/\D/g, '').slice(-10)
      )
      setAddress(data.address || '')

      // Generate signed URL for existing photo
      if (data.photo_url) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from('player-photos')
            .createSignedUrl(data.photo_url, 60 * 60)

        if (!signedUrlError && signedUrlData?.signedUrl) {
          setPhotoPreview(signedUrlData.signedUrl)
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null

    if (!selectedFile) {
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5 MB.')
      event.target.value = ''
      setPhoto(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Photo must be JPG, PNG or WebP.')
      event.target.value = ''
      setPhoto(null)
      return
    }

    setError('')
    setMessage('')

    setPhoto(selectedFile)

    const previewUrl = URL.createObjectURL(selectedFile)
    setPhotoPreview(previewUrl)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please login first.')
      }

      if (!player) {
        throw new Error('Player profile not found.')
      }

      let photoPath: string | null = null

      /*
       * Upload new photo if selected.
       *
       * We use the same path as registration:
       * user-id/profile.extension
       */
      if (photo) {
        const fileExtension =
          photo.name.split('.').pop()?.toLowerCase() || 'jpg'

        const fileName = `profile.${fileExtension}`
        photoPath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('player-photos')
          .upload(photoPath, photo, {
            upsert: true,
            contentType: photo.type,
          })

        if (uploadError) {
          console.error(uploadError)
          throw new Error('Could not upload the new photo.')
        }
      }

      const { data, error: updateError } = await supabase.rpc(
        'update_player_profile',
        {
          p_full_name: fullName.trim(),
          p_date_of_birth: dateOfBirth || null,
          p_gender: gender || null,
          p_phone: phoneNumber ? `+91 ${phoneNumber}` : '',
          p_address: address.trim() || null,
          p_photo_url: photoPath,
        }
      )

      if (updateError) {
        console.error(updateError)
        throw new Error(updateError.message)
      }

      setPlayer(data)

      /*
       * If a new photo was uploaded, generate a fresh signed URL.
       */
      if (photoPath) {
        const { data: signedUrlData } = await supabase.storage
          .from('player-photos')
          .createSignedUrl(photoPath, 60 * 60)

        if (signedUrlData?.signedUrl) {
          setPhotoPreview(signedUrlData.signedUrl)
        }
      }

      setPhoto(null)

      setMessage('Profile updated successfully.')

      setTimeout(() => {
        router.push('/player/dashboard')
        router.refresh()
      }, 1000)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while updating your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Edit Player Profile
              </h1>

              <p className="mt-2 text-gray-600">
                Update your personal information.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/player/dashboard')}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </button>
          </div>

          {/* Player ID */}
          <div className="mt-8 rounded-lg bg-gray-100 p-5">
            <p className="text-sm text-gray-500">
              BDLTA Player ID
            </p>

            <p className="mt-1 text-2xl font-bold">
              {player?.player_number || 'Not assigned'}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Player ID cannot be changed.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* Full Name */}
            <div>
              <label className="mb-2 block font-medium">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded border px-4 py-3"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block font-medium">
                Email
              </label>

              <input
                type="email"
                value={player?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded border bg-gray-100 px-4 py-3 text-gray-500"
              />

              <p className="mt-1 text-sm text-gray-500">
                Email is linked to your login account and cannot be changed here.
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 block font-medium">
                Date of Birth
              </label>

              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded border px-4 py-3"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="mb-2 block font-medium">
                Gender
              </label>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded border px-4 py-3"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block font-medium">
                Phone Number
              </label>

              <div className="flex overflow-hidden rounded border bg-white focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500">
                <span className="flex items-center border-r bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  required
                  className="min-w-0 flex-1 px-4 py-3 outline-none"
                  placeholder="Enter 10-digit number"
                  aria-label="Phone number without country code"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block font-medium">
                Address
              </label>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                className="w-full rounded border px-4 py-3"
                placeholder="Enter your address"
              />
            </div>

            {/* Photo */}
            <div>
              <p className="mb-2 block font-medium">Player Photo</p>

              <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Player profile"
                    className="h-20 w-20 shrink-0 rounded-xl border border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl text-slate-400">
                    <span aria-hidden="true">+</span>
                  </div>
                )}

                <div className="min-w-0">
                  <label
                    htmlFor="player-photo"
                    className="inline-flex cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    {photoPreview ? 'Change photo' : 'Choose photo'}
                  </label>
                  <input
                    id="player-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                  <p className="mt-2 truncate text-sm text-slate-600">
                    {photo?.name || (photoPreview ? 'Current profile photo' : 'No photo selected')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG or WebP. Maximum 5 MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}