'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { DeleteStoryButton } from '@/components/admin/DeleteStoryButton'

export function ReviewActions({
  storyId,
  authorId,
  storyTitle,
}: {
  storyId: string
  authorId: string
  storyTitle: string
}) {
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [feedback, setFeedback] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleApprove = async () => {
    setLoading(true)

    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('title, slug')
      .eq('id', storyId)
      .single()

    if (fetchError || !story) {
      toast('Error loading story details.', 'error')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('stories')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', storyId)

    if (error) {
      toast('Error publishing: ' + error.message, 'error')
      setLoading(false)
      return
    }

    await supabase.from('notifications').insert({
      recipient_id: authorId,
      notification_type: 'story_published',
      title: 'Your story is live!',
      message: `"${story.title}" has been approved and published.`,
      action_url: `/story/${story.slug}`,
    })

    toast('Story published successfully!', 'success')
    router.push('/admin/queue')
    router.refresh()
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast('Please provide feedback for the author.', 'error')
      return
    }

    setLoading(true)

    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('title')
      .eq('id', storyId)
      .single()

    if (fetchError || !story) {
      toast('Error loading story details.', 'error')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('stories')
      .update({ status: 'changes_requested', rejection_reason: feedback })
      .eq('id', storyId)

    if (error) {
      toast('Error: ' + error.message, 'error')
      setLoading(false)
      return
    }

    await supabase.from('notifications').insert({
      recipient_id: authorId,
      notification_type: 'story_changes_requested',
      title: 'Story needs revisions',
      message: `Your story "${story.title}" needs changes before it can be published.`,
      action_url: `/write/${storyId}`,
    })

    toast('Feedback sent to author.', 'success')
    setShowRejectModal(false)
    router.push('/admin/queue')
    router.refresh()
  }

  return (
    <>
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] p-6 rounded-lg flex flex-col md:flex-row gap-4 md:items-center justify-between sticky bottom-6 shadow-2xl">
        <div>
          <h3 className="font-medium text-[var(--text-main)]">Editorial Decision</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Approve to publish, request changes, or delete.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DeleteStoryButton
            storyId={storyId}
            storyTitle={storyTitle}
            redirectTo="/admin/queue"
          />
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border-main)] rounded-md text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition disabled:opacity-50"
          >
            <XCircle size={16} /> Request Changes
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition disabled:opacity-50"
          >
            <CheckCircle size={16} /> Approve & Publish
          </button>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-elevated)] max-w-lg w-full rounded-lg border border-[var(--border-main)] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
                Request Changes
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Provide actionable feedback. This will be visible to the author on their dashboard.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Please expand on the second chapter and fix the formatting..."
              className="w-full h-32 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-md p-3 text-[var(--text-main)] focus:outline-none focus:border-karibu-red mb-4 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="bg-karibu-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}