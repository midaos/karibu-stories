import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WriterDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  const statusLabel = (status: string) =>
    status
      .split('_')
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join(' ')

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12 border-b border-[var(--border-main)] pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-3">
              Writer's Desk
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--text-main)]">
              Your Stories
            </h1>
          </div>
          <Link
            href="/write/new"
            className="text-[11px] uppercase tracking-[0.2em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
          >
            + New Story
          </Link>
        </div>

        {!stories || stories.length === 0 ? (
          <div className="py-20 text-center border-t border-[var(--border-main)]">
            <p className="font-serif text-2xl text-[var(--text-main)] mb-2">
              Nothing written yet.
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-8">
              Every great story starts with a single sentence.
            </p>
            <Link
              href="/write/new"
              className="inline-block text-[11px] uppercase tracking-[0.2em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
            >
              Start Writing →
            </Link>
          </div>
        ) : (
          <div className="border-t border-[var(--border-main)]">
            {stories.map((story) => (
              <div
                key={story.id}
                className="border-b border-[var(--border-main)] py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl font-bold text-[var(--text-main)] truncate">
                    {story.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
                    <span
                      className={
                        story.status === 'published'
                          ? 'text-green-600 dark:text-green-400'
                          : story.status === 'submitted' || story.status === 'in_review'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : story.status === 'rejected' || story.status === 'changes_requested'
                          ? 'text-karibu-red'
                          : ''
                      }
                    >
                      {statusLabel(story.status)}
                    </span>
                    <span>
                      Edited {new Date(story.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {['draft', 'rejected', 'changes_requested'].includes(story.status) && (
                    <Link
                      href={`/write/${story.id}`}
                      className="text-xs uppercase tracking-[0.15em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
                    >
                      {story.status === 'draft' ? 'Continue' : 'Address Feedback'} →
                    </Link>
                  )}
                  {['submitted', 'in_review'].includes(story.status) && (
                    <Link
                      href={`/write/${story.id}`}
                      className="text-xs uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                    >
                      View Submission →
                    </Link>
                  )}
                  {story.status === 'published' && (
                    <Link
                      href={`/story/${story.slug}`}
                      className="text-xs uppercase tracking-[0.15em] font-semibold text-green-600 dark:text-green-400 border-b border-transparent hover:border-green-600 transition"
                    >
                      View Live →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}