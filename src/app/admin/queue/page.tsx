import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/utils/is-admin'
import { ArrowLeft } from 'lucide-react'
import { DeleteStoryButton } from '@/components/admin/DeleteStoryButton'

export const dynamic = 'force-dynamic'

export default async function ModerationQueue() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (!(await isAdmin())) redirect('/')

  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, word_count, reading_time_minutes, submitted_at, status, profiles ( display_name )')
    .in('status', ['submitted', 'in_review'])
    .order('submitted_at', { ascending: true })

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
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-2">
              Editorial
            </p>
            <h1 className="font-serif text-4xl font-bold text-[var(--text-main)]">
              Moderation Queue
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              {stories?.length || 0} pending review
            </p>
          </div>
        </div>

        {!stories || stories.length === 0 ? (
          <div className="py-20 text-center border-t border-[var(--border-main)]">
            <p className="text-[var(--text-muted)]">
              All caught up! There are no stories waiting for review.
            </p>
          </div>
        ) : (
          <div className="border-t border-[var(--border-main)]">
            {stories.map((story: any) => (
              <div
                key={story.id}
                className="border-b border-[var(--border-main)] py-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl font-bold text-[var(--text-main)] mb-1 truncate">
                    {story.title}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2">
                    By {story.profiles?.display_name || 'Unknown'} ·{' '}
                    {story.word_count} words · {story.reading_time_minutes} min read
                  </p>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                    {story.excerpt || 'No excerpt provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] hidden md:inline">
                    {story.submitted_at
                      ? new Date(story.submitted_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'N/A'}
                  </span>
                  <Link
                    href={`/admin/review/${story.id}`}
                    className="bg-karibu-red text-white px-5 py-2 rounded-md font-medium hover:bg-red-700 transition text-sm"
                  >
                    Review
                  </Link>
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