import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StoryCard } from '@/components/ui/StoryCard'
import { Search as SearchIcon } from 'lucide-react'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string }>
}) {
  const { q, genre } = await searchParams
  const supabase = await createClient()
  const query = q || ''
  const genreFilter = genre || ''

  let genreId = null
  if (genreFilter) {
    const { data } = await supabase
      .from('genres')
      .select('id')
      .eq('slug', genreFilter)
      .maybeSingle()
    if (data) genreId = data.id
  }

  let storiesQuery = supabase
    .from('stories')
    .select('id, title, slug, excerpt, reading_time_minutes, cover_image_path, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (query) {
    storiesQuery = storiesQuery.or(`title.ilike.%${query}%, excerpt.ilike.%${query}%`)
  }

  let finalStories: any[] = []

  if (genreId) {
    const { data: sgData } = await supabase
      .from('story_genres')
      .select('story_id')
      .eq('genre_id', genreId)
    const ids = sgData?.map((sg) => sg.story_id) || []
    if (ids.length > 0) {
      storiesQuery = storiesQuery.in('id', ids)
      const { data } = await storiesQuery
      finalStories = data || []
    }
  } else {
    const { data } = await storiesQuery
    finalStories = data || []
  }

  let profileMap = new Map()
  let storyGenreMap = new Map()
  if (finalStories.length > 0) {
    const authorIds = [...new Set(finalStories.map((s) => s.author_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? [])

    const storyIds = finalStories.map((s) => s.id)
    const { data: sgData } = await supabase
      .from('story_genres')
      .select('story_id, genre_id')
      .in('story_id', storyIds)
    const genreIds = [...new Set(sgData?.map((sg) => sg.genre_id) ?? [])]
    const { data: genresData } = await supabase
      .from('genres')
      .select('id, name')
      .in('id', genreIds)
    const genreMap = new Map(genresData?.map((g) => [g.id, g.name]) ?? [])
    sgData?.forEach((sg) => {
      if (!storyGenreMap.has(sg.story_id)) {
        storyGenreMap.set(sg.story_id, genreMap.get(sg.genre_id) || 'Story')
      }
    })
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--border-main)]">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-4">
            The Archive
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-8 leading-tight">
            {query ? `"${query}"` : genreFilter ? `Section: ${genreFilter}` : 'Browse all stories'}
          </h1>

          <form action="/search" method="GET" className="relative">
            <SearchIcon
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={18}
            />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by title or excerpt..."
              className="w-full bg-transparent border-b border-[var(--border-main)] focus:border-karibu-red py-3 pl-8 pr-4 text-lg text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-faint)]"
            />
            {genreFilter && <input type="hidden" name="genre" value={genreFilter} />}
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-6">
          {finalStories.length} {finalStories.length === 1 ? 'story' : 'stories'}
        </p>

        {finalStories.length === 0 ? (
          <div className="py-20 text-center border-t border-[var(--border-main)]">
            <p className="text-[var(--text-muted)] mb-4">No stories found.</p>
            <Link
              href="/search"
              className="text-[11px] uppercase tracking-[0.2em] font-semibold text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div>
            {finalStories.map((story: any) => (
              <StoryCard
                key={story.id}
                variant="horizontal"
                story={{
                  id: story.id,
                  title: story.title,
                  author: profileMap.get(story.author_id) || 'Unknown',
                  genre: storyGenreMap.get(story.id) || 'Story',
                  excerpt: story.excerpt || '',
                  coverImage: story.cover_image_path || '',
                  reads: '0',
                  likes: '0',
                  readTime: `${story.reading_time_minutes || 5} min`,
                  slug: story.slug,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}