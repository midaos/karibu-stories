import { createClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/ui/StoryCard'
import Link from 'next/link'

export async function StoryFeed() {
  const supabase = await createClient()
  
  // 1. Fetch stories
  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, reading_time_minutes, cover_image_path, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  if (error) return <p className="text-red-500">Error loading stories: {error.message}</p>
  if (!stories || stories.length === 0) {
    return (
      <div className="bg-karibu-surface p-8 rounded-lg text-center border border-neutral-800">
        <p className="text-karibu-muted mb-4">No published stories yet.</p>
        <Link href="/write" className="bg-karibu-red text-white px-6 py-2 rounded-md font-medium">
          Be the first to publish
        </Link>
      </div>
    )
  }

  // 2. Fetch Authors
  const authorIds = [...new Set(stories.map(s => s.author_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)
  const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) ?? [])

  // 3. Fetch Genres (Bypass the join)
  const storyIds = stories.map(s => s.id)
  const { data: storyGenres } = await supabase
    .from('story_genres')
    .select('story_id, genre_id')
    .in('story_id', storyIds)
    
  const genreIds = [...new Set(storyGenres?.map(sg => sg.genre_id) ?? [])]
  const { data: genresData } = await supabase
    .from('genres')
    .select('id, name')
    .in('id', genreIds)
    
  const genreMap = new Map(genresData?.map(g => [g.id, g.name]) ?? [])
  
  // Create a quick lookup: story_id -> genre_name
  const storyGenreMap = new Map()
  storyGenres?.forEach(sg => {
    if (!storyGenreMap.has(sg.story_id)) {
      storyGenreMap.set(sg.story_id, genreMap.get(sg.genre_id) || 'Uncategorized')
    }
  })

  return (
    <div className="space-y-4">
      {stories.map((story: any) => (
        <StoryCard 
          key={story.id} 
          variant="horizontal"
          story={{
            id: story.id,
            title: story.title,
            author: profileMap.get(story.author_id) || 'Unknown',
            genre: storyGenreMap.get(story.id) || 'Uncategorized',
            excerpt: story.excerpt || 'No description provided.',
            coverImage: story.cover_image_path || '',
            reads: "0",
            likes: "0",
            readTime: `${story.reading_time_minutes || 5} min`,
            slug: story.slug
          }} 
        />
      ))}
    </div>
  )
}