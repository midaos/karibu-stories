import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/utils/is-admin'
import {
  Users,
  BookOpen,
  Clock,
  MessageSquare,
  Activity,
  ArrowRight,
  ShieldCheck,
  Heart,
  Bookmark,
  Flame,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const adminStatus = await isAdmin()
  if (!adminStatus) redirect('/')

  // 1. Overview Stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  const { count: storyCount } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  const { count: pendingCount } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .in('status', ['submitted', 'in_review'])
  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })

  // 2. Recent Submissions
  const { data: recentStories } = await supabase
    .from('stories')
    .select('id, title, status, submitted_at, author_id')
    .order('submitted_at', { ascending: false })
    .limit(5)

  // 3. Recent Comments
  const { data: recentComments } = await supabase
    .from('comments')
    .select('id, body, created_at, user_id, story_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. All Published Stories for Ranking
  const { data: publishedStories } = await supabase
    .from('stories')
    .select('id, title, slug, author_id')
    .eq('status', 'published')

  // 5. Per-story engagement stats
  const storyStats = await Promise.all(
    (publishedStories || []).map(async (story) => {
      const [likes, saves, comments] = await Promise.all([
        supabase
          .from('story_likes')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story.id),
        supabase
          .from('saved_stories')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story.id)
          .eq('status', 'visible'),
      ])
      const likeCount = likes.count || 0
      const saveCount = saves.count || 0
      const commentCount = comments.count || 0

      return {
        ...story,
        likes: likeCount,
        saves: saveCount,
        comments: commentCount,
        totalEngagement: likeCount + saveCount,
        totalDiscussion: commentCount,
      }
    })
  )

  // 6. Top by Engagement
  const topByEngagement = [...storyStats]
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 5)

  // 7. Top by Comments
  const topByComments = [...storyStats]
    .sort((a, b) => b.totalDiscussion - a.totalDiscussion)
    .slice(0, 5)

  // Author profiles for recent submissions
  const authorIds = [...new Set(recentStories?.map((s) => s.author_id) || [])]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)
  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.display_name]) ?? []
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-[var(--border-main)] pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-2">
              Overview
            </p>
            <h1 className="font-serif text-4xl font-bold text-[var(--text-main)]">
              Admin Dashboard
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              Platform overview and editorial metrics.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin/stories"
              className="border border-[var(--border-main)] text-[var(--text-main)] px-4 py-2 rounded-md font-medium hover:border-karibu-red hover:text-karibu-red transition flex items-center gap-2 text-sm"
            >
              All Stories
            </Link>
            <Link
              href="/admin/queue"
              className="bg-karibu-red text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition flex items-center gap-2 text-sm"
            >
              Moderation Queue <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
                Total Users
              </span>
              <Users size={16} className="text-karibu-red" />
            </div>
            <p className="font-serif text-3xl font-bold text-[var(--text-main)]">
              {userCount || 0}
            </p>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
                Published
              </span>
              <BookOpen size={16} className="text-green-500" />
            </div>
            <p className="font-serif text-3xl font-bold text-[var(--text-main)]">
              {storyCount || 0}
            </p>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
                Pending
              </span>
              <Clock size={16} className="text-yellow-500" />
            </div>
            <p className="font-serif text-3xl font-bold text-[var(--text-main)]">
              {pendingCount || 0}
            </p>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
                Comments
              </span>
              <MessageSquare size={16} className="text-blue-400" />
            </div>
            <p className="font-serif text-3xl font-bold text-[var(--text-main)]">
              {commentCount || 0}
            </p>
          </div>
        </div>

        {/* Top Stories - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Top by Engagement */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
              <Flame size={18} className="text-karibu-red" /> Top by Engagement
            </h2>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] mb-4">
              Most liked & saved
            </p>

            <div className="space-y-3">
              {topByEngagement.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No engagement yet.
                </p>
              ) : (
                topByEngagement.map((story, index) => (
                  <div
                    key={story.id}
                    className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-serif text-lg font-bold text-[var(--text-faint)] w-6 shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/story/${story.slug}`}
                        className="text-sm font-medium text-[var(--text-main)] hover:text-karibu-red transition line-clamp-1 block"
                      >
                        {story.title}
                      </Link>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1 text-karibu-red">
                          <Heart size={12} /> {story.likes}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          <Bookmark size={12} /> {story.saves}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top by Comments */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" /> Top Discussions
            </h2>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] mb-4">
              Most commented
            </p>

            <div className="space-y-3">
              {topByComments.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No discussions yet.
                </p>
              ) : (
                topByComments.map((story, index) => (
                  <div
                    key={story.id}
                    className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-serif text-lg font-bold text-[var(--text-faint)] w-6 shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/story/${story.slug}`}
                        className="text-sm font-medium text-[var(--text-main)] hover:text-karibu-red transition line-clamp-1 block"
                      >
                        {story.title}
                      </Link>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} /> {story.comments} comments
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Recent Submissions */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
              <Activity size={18} /> Recent Submissions
            </h2>
            <div className="space-y-3">
              {recentStories?.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No recent submissions.
                </p>
              ) : (
                recentStories?.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between border-b border-[var(--border-main)] pb-3 last:border-0 last:pb-0 gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-main)] text-sm truncate">
                        {story.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        By {profileMap.get(story.author_id) || 'Unknown'} ·{' '}
                        {story.submitted_at
                          ? new Date(story.submitted_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Draft'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-1 shrink-0
                        ${
                          story.status === 'published'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : story.status === 'submitted' || story.status === 'in_review'
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                            : story.status === 'rejected' || story.status === 'changes_requested'
                            ? 'bg-red-500/10 text-karibu-red'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                        }`}
                    >
                      {story.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
              <MessageSquare size={18} /> Recent Comments
            </h2>
            <div className="space-y-3">
              {recentComments?.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">
                  No recent comments.
                </p>
              ) : (
                recentComments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-[var(--border-main)] pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-[var(--text-main)]/90 line-clamp-2 italic">
                      "{comment.body}"
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-faint)] mt-1">
                      {new Date(comment.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-lg p-6">
          <h2 className="font-serif text-xl font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" /> System Diagnostics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-[var(--bg-muted)] p-4 rounded border border-[var(--border-main)]">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">Database</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--bg-muted)] p-4 rounded border border-[var(--border-main)]">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">Auth Service</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--bg-muted)] p-4 rounded border border-[var(--border-main)]">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">Storage</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Operational
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}