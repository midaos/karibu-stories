'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, X } from 'lucide-react'

interface DeleteStoryButtonProps {
  storyId: string
  storyTitle: string
  variant?: 'button' | 'icon'
  redirectTo?: string
}

export function DeleteStoryButton({
  storyId,
  storyTitle,
  variant = 'button',
  redirectTo,
}: DeleteStoryButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase.from('stories').delete().eq('id', storyId)

    if (error) {
      toast('Error deleting story: ' + error.message, 'error')
      setLoading(false)
      return
    }

    toast('Story deleted permanently.', 'success')
    setShowModal(false)

    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className="p-2 text-[var(--text-muted)] hover:text-karibu-red transition"
          title="Delete story"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-karibu-red/40 text-karibu-red rounded-md text-sm font-medium hover:bg-karibu-red hover:text-white transition"
        >
          <Trash2 size={16} /> Delete
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-[var(--bg-elevated)] max-w-md w-full rounded-lg border border-[var(--border-main)] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
                Delete Story?
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-2">
              You're about to permanently delete:
            </p>
            <p className="font-serif text-lg text-[var(--text-main)] mb-4">
              "{storyTitle}"
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              This will also delete all associated likes, saves, comments, and genre links.{' '}
              <strong className="text-karibu-red">This cannot be undone.</strong>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-karibu-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}