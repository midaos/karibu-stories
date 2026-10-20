import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/utils/is-admin'
import { ReviewActions } from './ReviewActions'

export const dynamic = 'force-dynamic'

export default async function ReviewStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  
  const adminStatus = await isAdmin()
  if (!adminStatus) redirect('/')

  const { data: story } = await supabase
    .from('stories')
    .select('*, profiles(display_name, username)')
    .eq('id', id)
    .single()

  if (!story) notFound()

  return (
    <div className="min-h-screen bg-karibu-dark text-white p-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-2 text-sm text-karibu-muted mb-4">
            <a href="/admin/queue" className="hover:text-white transition">Queue</a>
            <span>/</span>
            <span>Review</span>
          </div>
          <h1 className="text-3xl font-serif font-bold">{story.title}</h1>
          <p className="text-karibu-muted mt-2">
            By {story.profiles?.display_name} (@{story.profiles?.username})
          </p>
          <div className="flex gap-4 mt-4 text-sm text-neutral-400">
            <span>{story.word_count} words</span>
            <span>{story.reading_time_minutes} min read</span>
            <span>Status: <strong className="text-yellow-400 capitalize">{story.status.replace('_', ' ')}</strong></span>
          </div>
        </div>

        {/* Writer's Resolution Note if they resubmitted */}
        {story.resolution_note && (
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-green-400 mb-2">Writer's Response to Previous Feedback</h3>
            <p className="text-sm text-neutral-200 whitespace-pre-wrap">{story.resolution_note}</p>
          </div>
        )}

        <div 
          className="prose prose-invert prose-karibu max-w-none font-serif text-lg leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: story.body }} 
        />

        <ReviewActions
  storyId={story.id}
  authorId={story.author_id}
  storyTitle={story.title}
/>

      </div>
    </div>
  )
}