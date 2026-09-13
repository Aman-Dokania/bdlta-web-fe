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
          p_phone: phone,
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
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-2xl">

        <div className="rounded-lg bg-white p-8 shadow">

          <h1 className="text-3xl font-bold">
            Player Registration
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your details to create your BDLTA player profile.
          </p>

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

            {/* Phone Number */}
            <div>
              <label className="mb-2 block font-medium">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded border px-4 py-3"
                placeholder="Enter your phone number"
              />

              <p className="mt-1 text-sm text-gray-500">
                This number will be stored in your player profile.
              </p>
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

            {/* Existing Member */}
            <div className="rounded-lg border p-4">

              <label className="block font-medium">
                Are you already a BDLTA member?
              </label>

              <p className="mt-1 text-sm text-gray-500">
                If you are already a member of the association, select Yes.
                Your membership will be verified by an administrator.
              </p>

              <div className="mt-4 space-y-3">

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="existingMember"
                    checked={isExistingMember === false}
                    onChange={() => setIsExistingMember(false)}
                    className="h-4 w-4"
                  />

                  <span>
                    No, I am a new member
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="existingMember"
                    checked={isExistingMember === true}
                    onChange={() => setIsExistingMember(true)}
                    className="h-4 w-4"
                  />

                  <span>
                    Yes, I am already a BDLTA member
                  </span>
                </label>

              </div>

              {isExistingMember && (
                <div className="mt-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
                  Your registration will be sent to an administrator for
                  verification. You will not need to pay the ₹1,000 lifetime
                  membership fee unless your request is rejected and you
                  choose to register as a new member.
                </div>
              )}

            </div>

            {/* Photo Upload */}
            <div>
              <label className="mb-2 block font-medium">
                Player Photo
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null

                  if (
                    selectedFile &&
                    selectedFile.size > 5 * 1024 * 1024
                  ) {
                    setMessage('Photo must be smaller than 5 MB.')
                    e.target.value = ''
                    setPhoto(null)
                    return
                  }

                  setMessage('')
                  setPhoto(selectedFile)
                }}
                className="w-full rounded border px-4 py-3"
              />

              <p className="mt-1 text-sm text-gray-500">
                JPG, PNG or WebP. Maximum 5 MB.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? 'Creating profile...'
                : isExistingMember
                  ? 'Submit Existing Member Request'
                  : 'Create Player Profile'}
            </button>

          </form>

          {/* Message */}
          {message && (
            <p className="mt-5 rounded bg-gray-100 p-3 text-center">
              {message}
            </p>
          )}

        </div>

      </div>

    </main>
  )
}