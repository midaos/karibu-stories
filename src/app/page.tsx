import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/ui/StoryCard'

// ---------- MASTHEAD ----------
function Masthead() {
  const d = new Date()
  const dateStr = d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return (
    <div className="border-b border-[var(--border-main)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)]">
        <span>{dateStr}</span>
        <span className="text-karibu-red">Karibu Stories</span>
        <span>Issue No. 001</span>
      </div>
    </div>
  )
}

// ---------- ASYMMETRIC HERO ----------
async function Hero() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isMember = !!user
  let firstName = 'Reader'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    firstName = profile?.display_name?.split(' ')[0] || 'Reader'
  }

  return (
    <section className="relative border-b border-[var(--border-main)] overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Left: text 7 cols */}
        <div className="md:col-span-7 px-4 md:px-10 py-16 md:py-28 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-karibu-red mb-8">
            {isMember ? `Welcome back, ${firstName}` : 'A new literary quarterly'}
          </p>

          <h1 className="font-serif text-5xl md:text-8xl font-bold text-[var(--text-main)] leading-[0.9] tracking-tight mb-8">
            {isMember ? (
              <>What will you <span className="italic">write</span> today?</>
            ) : (
              <>The best of African <span className="italic">storytelling</span>, every week.</>
            )}
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-xl mb-10">
            {isMember
              ? 'Continue a draft, discover a new voice, or share your latest work with our community of readers.'
              : "Fiction, essays, and poetry from a continent of voices. Read for free. Write when you're ready."}
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href={isMember ? '/write/new' : '/search'}
              className="group inline-flex items-center gap-3 text-sm font-semibold text-[var(--text-main)] uppercase tracking-[0.2em] hover:text-karibu-red transition"
            >
              <span className="border-b-2 border-[var(--text-main)] group-hover:border-karibu-red pb-1 transition">
                {isMember ? 'Start a new story' : 'Start reading'}
              </span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href={isMember ? '/write' : '/write'}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
            >
              {isMember ? 'Your drafts →' : 'Become a writer →'}
            </Link>
          </div>
        </div>

        {/* Right: tall image bleeding right, 5 cols */}
        <div className="hidden md:block md:col-span-5 relative bg-[var(--bg-muted)]">
          <img
            src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=80"
            alt="Reader"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient that works in both light and dark mode */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-app)] via-[var(--bg-app)]/30 to-transparent" />
          <div className="absolute bottom-10 left-10 max-w-[240px] text-[10px] uppercase tracking-[0.25em] font-semibold text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.7)]">
            Reading in Nairobi, photographed for Karibu
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- FEATURED STORY ----------
async function FeaturedStory() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, reading_time_minutes, cover_image_path, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)

  if (!stories || stories.length === 0) return null
  const story = stories[0]

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', story.author_id)
    .single()

  const { data: sg } = await supabase
    .from('story_genres')
    .select('genre_id')
    .eq('story_id', story.id)
    .maybeSingle()

  let genreName = 'Fiction'
  if (sg) {
    const { data: g } = await supabase.from('genres').select('name').eq('id', sg.genre_id).single()
    if (g) genreName = g.name
  }

  return (
    <section className="border-b border-[var(--border-main)]">
      <div className="max-w-7xl mx-auto px-4 py-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--text-main)]">
          The Cover Story
        </h2>
        <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)]">
          Weekly Selection
        </span>
      </div>

      <StoryCard
        variant="featured"
        story={{
          id: story.id,
          title: story.title,
          author: profile?.display_name || 'Unknown',
          genre: genreName,
          excerpt: story.excerpt || '',
          coverImage: story.cover_image_path || '',
          reads: '0',
          likes: '0',
          readTime: `${story.reading_time_minutes || 5} min read`,
          slug: story.slug,
        }}
      />
    </section>
  )
}

// ---------- LATEST STORIES ----------
async function LatestStories() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, reading_time_minutes, cover_image_path, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6)

  if (!stories || stories.length === 0) {
    return (
      <div className="py-20 text-center border-t border-[var(--border-main)]">
        <p className="text-[var(--text-muted)] mb-4">No stories published yet.</p>
        <Link href="/write" className="text-karibu-red hover:underline font-medium">
          Be the first to publish →
        </Link>
      </div>
    )
  }

  const authorIds = [...new Set(stories.map((s) => s.author_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)
  const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? [])

  const storyIds = stories.map((s) => s.id)
  const { data: storyGenres } = await supabase
    .from('story_genres')
    .select('story_id, genre_id')
    .in('story_id', storyIds)
  const genreIds = [...new Set(storyGenres?.map((sg) => sg.genre_id) ?? [])]
  const { data: genresData } = await supabase
    .from('genres')
    .select('id, name')
    .in('id', genreIds)
  const genreMap = new Map(genresData?.map((g) => [g.id, g.name]) ?? [])
  const storyGenreMap = new Map()
  storyGenres?.forEach((sg) => {
    if (!storyGenreMap.has(sg.story_id)) {
      storyGenreMap.set(sg.story_id, genreMap.get(sg.genre_id) || 'Story')
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
      {stories.map((s: any) => (
        <StoryCard
          key={s.id}
          variant="default"
          story={{
            id: s.id,
            title: s.title,
            author: profileMap.get(s.author_id) || 'Unknown',
            genre: storyGenreMap.get(s.id) || 'Story',
            excerpt: s.excerpt || '',
            coverImage: s.cover_image_path || '',
            reads: '0',
            likes: '0',
            readTime: `${s.reading_time_minutes || 5} min`,
            slug: s.slug,
          }}
        />
      ))}
    </div>
  )
}

// ---------- SIDEBAR ----------
async function GenreSidebar() {
  const supabase = await createClient()
  const { data: genres } = await supabase
    .from('genres')
    .select('name, slug')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <aside className="hidden lg:block space-y-10 sticky top-24 h-fit">
      <div>
        <h3 className="font-serif text-lg font-bold text-[var(--text-main)] mb-4">Sections</h3>
        <ul>
          {genres?.map((g) => (
            <li key={g.slug} className="border-t border-[var(--border-main)]">
              <Link
                href={`/search?genre=${g.slug}`}
                className="flex items-center justify-between py-3 text-sm text-[var(--text-muted)] hover:text-karibu-red transition group"
              >
                <span>{g.name}</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[var(--border-main)] pt-8">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-3">
          Want to write?
        </p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
          Join a growing community of African storytellers. Publish your first story today.
        </p>
        <Link
          href="/write"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-main)] border-b border-[var(--text-main)] pb-0.5 hover:text-karibu-red hover:border-karibu-red transition"
        >
          Submit a story <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  )
}

// ---------- PAGE ----------
export default function Home() {
  return (
    <div className="min-h-screen">
      <Masthead />

      <Suspense fallback={<div className="h-[80vh]" />}>
        <Hero />
      </Suspense>

      <Suspense fallback={null}>
        <FeaturedStory />
      </Suspense>

      <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3">
          <Suspense fallback={null}>
            <GenreSidebar />
          </Suspense>
        </aside>

        <section className="lg:col-span-9">
          <div className="flex items-end justify-between mb-8 border-b border-[var(--border-main)] pb-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--text-main)]">
              Latest Stories
            </h2>
            <Link
              href="/search"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] hover:text-karibu-red transition"
            >
              Archive →
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-10">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] bg-[var(--bg-muted)] animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <LatestStories />
          </Suspense>
        </section>
      </main>
    </div>
  )
}