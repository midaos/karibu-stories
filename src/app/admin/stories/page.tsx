import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/utils/is-admin'
import { ArrowLeft } from 'lucide-react'
import { DeleteStoryButton } from '@/components/admin/DeleteStoryButton'

export const dynamic = 'force-dynamic'

export default async function AllStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  if (!(await isAdmin())) redirect('/')

  const { status } = await searchParams
  const filterStatus = status || 'all'

  let query = supabase
    .from('stories')
    .select('id, title, slug, status, created_at, author_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus)
  }

  const { data: stories } = await query

  const authorIds = [...new Set(stories?.map((s) => s.author_id) || [])]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)
  const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? [])

  const statuses = [
    'all',
    'published',
    'submitted',
    'in_review',
    'changes_requested',
    'rejected',
    'draft',
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="border-b border-[var(--border-main)] pb-6 mb-8">
          <Link
            href="/admin"
            className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] hover:text-karibu-red inline-flex items-center gap-1 mb-3 transition"
          >
            <ArrowLeft size={12} /> Admin Dashboard
          </Link>
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-2">
            Content Management
          </p>
          <h1 className="font-serif text-4xl font-bold text-[var(--text-main)]">
            All Stories
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            {stories?.length || 0} {filterStatus === 'all' ? 'total' : filterStatus.replace('_', ' ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {statuses.map((s) => (
            <Link
              key={s}
              href={s === 'all' ? '/admin/stories' : `/admin/stories?status=${s}`}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold border transition ${
                filterStatus === s
                  ? 'bg-karibu-red text-white border-karibu-red'
                  : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-karibu-red hover:text-karibu-red'
              }`}
            >
              {s.replace('_', ' ')}
            </Link>
          ))}
        </div>

        {!stories || stories.length === 0 ? (
          <div className="py-20 text-center border-t border-[var(--border-main)]">
            <p className="text-[var(--text-muted)]">No stories found.</p>
          </div>
        ) : (
          <div className="border-t border-[var(--border-main)]">
            {stories.map((story) => (
              <div
                key={story.id}
                className="border-b border-[var(--border-main)] py-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="font-serif text-lg font-bold text-[var(--text-main)] truncate">
                      {story.title}
                    </h3>
                    <span
                      className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-0.5 shrink-0 ${
                        story.status === 'published'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : story.status === 'submitted' || story.status === 'in_review'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : story.status === 'rejected' ||
                            story.status === 'changes_requested'
                          ? 'bg-red-500/10 text-karibu-red'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                      }`}
                    >
                      {story.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    by {profileMap.get(story.author_id) || 'Unknown'} ·{' '}
                    {new Date(story.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {story.status === 'published' && (
                    <Link
                      href={`/story/${story.slug}`}
                      className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                    >
                      View →
                    </Link>
                  )}
                  {(story.status === 'submitted' || story.status === 'in_review') && (
                    <Link
                      href={`/admin/review/${story.id}`}
                      className="text-[11px] uppercase tracking-[0.15em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
                    >
                      Review →
                    </Link>
                  )}
                  <DeleteStoryButton
                    storyId={story.id}
                    storyTitle={story.title}
                    variant="icon"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}