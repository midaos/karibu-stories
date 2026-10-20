import { createClient } from '@/lib/supabase/server'
import { StoryEditor } from '@/components/writer/StoryEditor'
import { notFound } from 'next/navigation'

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: story } = await supabase
    .from('stories')
    .select(`
      *, 
      story_genres ( genre_id )
    `)
    .eq('id', id)
    .eq('author_id', user.id)
    .single()

  if (!story) {
    notFound()
  }

  // Extract the first genre ID if it exists
  const initialGenreId = story?.story_genres?.[0]?.genre_id || ''

  return (
    <div className="min-h-screen bg-karibu-dark text-white">
      <StoryEditor story={story} initialGenreId={initialGenreId} />
    </div>
  )
}