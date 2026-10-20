import Link from "next/link";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    author: string;
    genre: string;
    excerpt: string;
    coverImage: string;
    reads: string;
    likes: string;
    readTime: string;
    slug: string;
  };
  variant?: "default" | "horizontal" | "featured";
}

export function StoryCard({ story, variant = "default" }: StoryCardProps) {
  if (variant === "featured") {
    return (
      <Link
        href={`/story/${story.slug}`}
        className="group block relative w-full h-[70vh] min-h-[520px] overflow-hidden bg-neutral-900"
      >
        {story.coverImage && (
          <img
            src={story.coverImage}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.2s] ease-out"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

        <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white/70 text-[11px] uppercase tracking-[0.2em] font-medium">
          <span>{story.genre}</span>
          <span className="hidden md:inline">Featured</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-14 max-w-5xl">
          <h2 className="font-serif text-4xl md:text-7xl font-bold text-white leading-[0.95] tracking-tight mb-6">
            {story.title}
          </h2>
          <p className="text-white/75 text-base md:text-lg max-w-2xl leading-relaxed mb-6 line-clamp-3">
            {story.excerpt}
          </p>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-white/60 font-medium">
            <span>By {story.author}</span>
            <span>{story.readTime}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/story/${story.slug}`}
        className="group flex gap-5 py-6 border-t border-[var(--border-main)]"
      >
        <div className="relative w-24 h-32 shrink-0 overflow-hidden bg-[var(--bg-muted)]">
          {story.coverImage && (
            <img
              src={story.coverImage}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
        </div>
        <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-karibu-red mb-2">
              {story.genre}
            </p>
            <h3 className="font-serif text-xl font-bold text-[var(--text-main)] leading-tight mb-1 line-clamp-2 group-hover:underline underline-offset-4 decoration-karibu-red">
              {story.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">by {story.author}</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] mt-3">
            <span>{story.readTime}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/story/${story.slug}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--bg-muted)] mb-4">
        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] text-[10px] uppercase tracking-widest">
            No Cover
          </div>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-karibu-red mb-2">
        {story.genre}
      </p>
      <h3 className="font-serif text-xl font-bold text-[var(--text-main)] leading-tight mb-1 line-clamp-2 group-hover:underline underline-offset-4 decoration-karibu-red">
        {story.title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-2">by {story.author}</p>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        <span>{story.readTime}</span>
      </div>
    </Link>
  );
}