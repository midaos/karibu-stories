import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { StoryActions } from '@/components/reader/StoryActions'
import { CommentSection } from '@/components/reader/CommentSection'

export default async function StoryReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: story } = await supabase
    .from('stories')
    .select(
      `
      *,
      profiles ( display_name, username, bio, avatar_path ),
      story_genres ( genres ( name ) )
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!story) notFound()

  const author = story.profiles
  const genre = story.story_genres?.[0]?.genres?.name || 'Uncategorized'

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      {/* Genre + metadata strip */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)] mb-10 border-b border-[var(--border-main)] pb-4">
        <span className="text-karibu-red">{genre}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {story.reading_time_minutes} min read
        </span>
      </div>

      {/* Title */}
      <h1 className="font-serif text-4xl md:text-6xl font-bold text-[var(--text-main)] leading-[1.02] tracking-tight mb-6">
        {story.title}
      </h1>

      {story.excerpt && (
        <p className="text-xl md:text-2xl text-[var(--text-muted)] italic mb-10 leading-snug">
          {story.excerpt}
        </p>
      )}

      {/* Author row */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-[var(--border-main)]">
        <Link href={`/profile/${author?.username}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] overflow-hidden flex items-center justify-center text-sm font-bold text-[var(--text-main)]">
            {author?.avatar_path ? (
              <img
                src={author.avatar_path}
                alt={author.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              author?.display_name?.charAt(0) || 'A'
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)] group-hover:text-karibu-red transition">
              {author?.display_name || 'Unknown Author'}
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              @{author?.username}
            </p>
          </div>
        </Link>

        <StoryActions storyId={story.id} />
      </div>

      {/* Cover */}
      {story.cover_image_path && (
        <div className="mb-12 bg-[var(--bg-muted)]">
          <img
            src={story.cover_image_path}
            alt={story.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Body */}
      <article
        className="prose-karibu max-w-none font-serif text-lg md:text-xl leading-[1.8] mb-16"
        dangerouslySetInnerHTML={{ __html: story.body }}
      />

      {/* Comments */}
      <CommentSection storyId={story.id} />

      {/* Author bio */}
      {author?.bio && (
        <div className="mt-16 pt-8 border-t border-[var(--border-main)] flex gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-muted)] shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold text-[var(--text-main)]">
            {author.avatar_path ? (
              <img
                src={author.avatar_path}
                alt={author.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              author.display_name?.charAt(0) || 'A'
            )}
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-main)]">
              {author.display_name}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
              {author.bio}
            </p>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose-karibu p {
          margin-bottom: 1.8em;
          color: var(--text-main);
        }
        .prose-karibu h1,
        .prose-karibu h2,
        .prose-karibu h3 {
          color: var(--text-main);
          font-family: var(--font-serif);
          margin-top: 2em;
          margin-bottom: 1em;
          letter-spacing: -0.02em;
        }
        .prose-karibu blockquote {
          border-left: 2px solid var(--color-karibu-red);
          padding-left: 1.5rem;
          font-style: italic;
          color: var(--text-muted);
          margin: 2em 0;
        }
        .prose-karibu a {
          color: var(--color-karibu-red);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .prose-karibu img {
          margin: 2em 0;
        }
        .prose-karibu strong {
          color: var(--text-main);
          font-weight: 700;
        }
      `,
        }}
      />
    </main>
  )
}