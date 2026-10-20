import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: savedRelations } = await supabase
    .from('saved_stories')
    .select('story_id')
    .eq('user_id', user.id)
  const { data: likedRelations } = await supabase
    .from('story_likes')
    .select('story_id')
    .eq('user_id', user.id)

  const savedIds = savedRelations?.map((r) => r.story_id) || []
  const likedIds = likedRelations?.map((r) => r.story_id) || []

  let savedStories: any[] = []
  let likedStories: any[] = []
  if (savedIds.length > 0) {
    const { data } = await supabase
      .from('stories')
      .select(
        'id, title, slug, excerpt, cover_image_path, reading_time_minutes, profiles(display_name)'
      )
      .in('id', savedIds)
      .eq('status', 'published')
    savedStories = data || []
  }
  if (likedIds.length > 0) {
    const { data } = await supabase
      .from('stories')
      .select(
        'id, title, slug, excerpt, cover_image_path, reading_time_minutes, profiles(display_name)'
      )
      .in('id', likedIds)
      .eq('status', 'published')
    likedStories = data || []
  }

  const renderGrid = (stories: any[], emptyMsg: string) =>
    stories.length === 0 ? (
      <div className="py-16 text-center border-t border-[var(--border-main)]">
        <p className="text-sm text-[var(--text-muted)]">{emptyMsg}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
        {stories.map((story) => (
          <Link key={story.id} href={`/story/${story.slug}`} className="group">
            <div className="relative aspect-[4/5] bg-[var(--bg-muted)] overflow-hidden mb-4">
              {story.cover_image_path ? (
                <img
                  src={story.cover_image_path}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="text-[var(--text-faint)]" size={28} />
                </div>
              )}
            </div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-main)] leading-tight line-clamp-2 mb-1 group-hover:underline underline-offset-4 decoration-karibu-red">
              {story.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              by {story.profiles?.display_name || 'Unknown'}
            </p>
          </Link>
        ))}
      </div>
    )

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-4">
          Personal Library
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-12">
          Your Reading Shelf
        </h1>

        <section className="mb-16">
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-6">
            Saved · {savedStories.length}
          </h2>
          {renderGrid(savedStories, "You haven't saved any stories yet.")}
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-6">
            Liked · {likedStories.length}
          </h2>
          {renderGrid(likedStories, "You haven't liked any stories yet.")}
        </section>
      </div>
    </div>
  )
}