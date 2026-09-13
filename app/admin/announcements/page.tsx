'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Announcement = {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [published, setPublished] = useState(false)

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select(
        'id, title, content, image_url, published, published_at, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Announcement loading error:', error)
      setAnnouncements([])
      return
    }

    setAnnouncements(data || [])
  }

  useEffect(() => {
    const loadPage = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle()

      const role = profile?.role
        ?.toLowerCase()
        .replace(/[-\s]/g, '_')

      if (
        error ||
        !profile ||
        (role !== 'admin' && role !== 'super_admin')
      ) {
        router.push('/player/dashboard')
        return
      }

      setUser(currentUser)

      await loadAnnouncements()

      setLoading(false)
    }

    loadPage()
  }, [router])

  const createAnnouncement = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('Title and content are required.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        published,
        published_at: published ? new Date().toISOString() : null,
        created_by: user?.id,
      })

    if (error) {
      console.error('Announcement creation error:', error)
      alert(error.message)
      setSaving(false)
      return
    }

    setTitle('')
    setContent('')
    setImageUrl('')
    setPublished(false)

    await loadAnnouncements()

    setSaving(false)
  }

  const togglePublished = async (announcement: Announcement) => {
    const newPublished = !announcement.published

    const { error } = await supabase
      .from('announcements')
      .update({
        published: newPublished,
        published_at: newPublished
          ? new Date().toISOString()
          : null,
      })
      .eq('id', announcement.id)

    if (error) {
      console.error('Announcement update error:', error)
      alert(error.message)
      return
    }

    await loadAnnouncements()
  }

  const deleteAnnouncement = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this announcement?'
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Announcement deletion error:', error)
      alert(error.message)
      return
    }

    await loadAnnouncements()
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-500">
          Loading announcements...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() =>
                router.push('/admin/dashboard')
              }
              className="mb-2 text-sm text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Announcements
            </h1>

            <p className="mt-1 text-gray-500">
              Create and manage BDLTA announcements
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Create announcement */}

        <div className="rounded-lg bg-white p-6 shadow">

          <h2 className="mb-6 text-xl font-semibold">
            Create Announcement
          </h2>

          <form
            onSubmit={createAnnouncement}
            className="space-y-5"
          >

            <div>
              <label className="mb-1 block text-sm font-medium">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Enter announcement title"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Content
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Write announcement content..."
                rows={6}
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Image URL
              </label>

              <input
                type="url"
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(event.target.value)
                }
                placeholder="Optional image URL"
                className="w-full rounded-lg border px-4 py-2"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty if the announcement does not
                have an image.
              </p>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) =>
                  setPublished(event.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium">
                Publish immediately
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? 'Creating...'
                : 'Create Announcement'}
            </button>

          </form>
        </div>

        {/* Existing announcements */}

        <div className="mt-8 rounded-lg bg-white p-6 shadow">

          <h2 className="mb-6 text-xl font-semibold">
            Existing Announcements
          </h2>

          {announcements.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-4">

              {announcements.map((announcement) => (

                <div
                  key={announcement.id}
                  className="rounded-lg border p-5"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-lg font-semibold">
                          {announcement.title}
                        </h3>

                        {announcement.published ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Draft
                          </span>
                        )}

                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-gray-600">
                        {announcement.content}
                      </p>

                      {announcement.image_url && (
                        <p className="mt-3 break-all text-sm text-blue-600">
                          Image: {announcement.image_url}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-gray-400">
                        Created:{' '}
                        {new Date(
                          announcement.created_at
                        ).toLocaleDateString('en-IN')}
                      </p>

                    </div>

                    <div className="flex shrink-0 gap-2">

                      <button
                        onClick={() =>
                          togglePublished(announcement)
                        }
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {announcement.published
                          ? 'Unpublish'
                          : 'Publish'}
                      </button>

                      <button
                        onClick={() =>
                          deleteAnnouncement(
                            announcement.id
                          )
                        }
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}