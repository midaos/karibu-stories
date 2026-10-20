import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) notFound()

  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, slug, excerpt, cover_image_path, published_at, reading_time_minutes')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-karibu-dark text-white">
      
      {/* Profile Header */}
      <div className="bg-karibu-surface border-b border-neutral-800 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center text-3xl font-bold mb-4 border-2 border-neutral-600">
            {profile.avatar_path ? (
              <img src={profile.avatar_path} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              profile.display_name?.charAt(0) || 'U'
            )}
          </div>
          <h1 className="text-3xl font-serif font-bold mb-1">{profile.display_name}</h1>
          <p className="text-karibu-muted mb-4">@{profile.username}</p>
          {profile.bio && (
            <p className="text-neutral-300 max-w-lg mx-auto">{profile.bio}</p>
          )}
          {profile.website_url && (
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-karibu-red text-sm hover:underline mt-2 inline-block"
            >
              {profile.website_url}
            </a>
          )}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-karibu-red" /> Published Stories ({stories?.length || 0})
        </h2>
        
        {!stories || stories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg bg-karibu-surface/50">
            <p className="text-karibu-muted">No published stories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link key={story.id} href={`/story/${story.slug}`} className="group">
                <div className="bg-karibu-surface border border-neutral-800 rounded-lg overflow-hidden hover:border-karibu-red transition h-full flex flex-col">
                  <div className="aspect-[3/2] bg-neutral-900 relative overflow-hidden">
                    {story.cover_image_path ? (
                      <img src={story.cover_image_path} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="text-neutral-700" size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-serif text-lg font-bold text-white mb-1 line-clamp-2">{story.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-3 mt-2">{story.excerpt}</p>
                    <p className="text-xs text-karibu-muted mt-auto pt-3">
                      {new Date(story.published_at).toLocaleDateString()} • {story.reading_time_minutes} min read
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}