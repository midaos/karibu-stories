'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function CommentSection({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      fetchComments()
    }
    init()
  }, [supabase])

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id, status')
      .eq('story_id', storyId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fetch comments error:', error)
      return
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([])
      return
    }

    const userIds = [...new Set(commentsData.map((c) => c.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_path')
      .in('id', userIds)

    const profileMap = new Map(profilesData?.map((p) => [p.id, p]) ?? [])

    const enriched = commentsData.map((comment) => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || null,
    }))

    setComments(enriched)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setLoading(true)
    const { error } = await supabase.from('comments').insert({
      story_id: storyId,
      user_id: user.id,
      body: newComment.trim(),
      status: 'visible',
    })

    if (error) {
      toast('Error posting comment: ' + error.message, 'error')
    } else {
      setNewComment('')
      await fetchComments()
      toast('Comment posted!', 'success')
    }
    setLoading(false)
  }

  return (
    <div className="mt-12 pt-10 border-t border-[var(--border-main)]">
      <h3 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-8">
        Discussion · {comments.length}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-12">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this story..."
            className="w-full h-28 bg-[var(--bg-elevated)] border border-[var(--border-main)] focus:border-karibu-red p-4 text-[var(--text-main)] text-sm outline-none transition resize-none placeholder:text-[var(--text-faint)]"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="text-[11px] uppercase tracking-[0.2em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition disabled:opacity-40"
            >
              {loading ? 'Posting...' : 'Post Comment →'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border border-[var(--border-main)] p-8 text-center mb-12">
          <p className="font-serif text-lg text-[var(--text-main)] mb-2">Join the discussion</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">You must be logged in to comment.</p>
          <Link
            href="/login"
            className="inline-block text-[11px] uppercase tracking-[0.2em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
          >
            Log In to Comment →
          </Link>
        </div>
      )}

      <div>
        {comments.map((comment) => (
          <div key={comment.id} className="border-t border-[var(--border-main)] py-6 flex gap-4">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-[var(--text-main)]">
              {comment.profiles?.avatar_path ? (
                <img
                  src={comment.profiles.avatar_path}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                comment.profiles?.display_name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  {comment.profiles?.display_name || 'Reader'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                  {new Date(comment.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <p className="text-sm text-[var(--text-main)]/90 whitespace-pre-wrap leading-relaxed">
                {comment.body}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] py-6">
            No comments yet. Be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  )
}