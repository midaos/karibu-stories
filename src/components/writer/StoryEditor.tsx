'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, ImagePlus, X } from 'lucide-react'

interface StoryEditorProps {
  story: any
  initialGenreId?: string
}

export function StoryEditor({ story, initialGenreId }: StoryEditorProps) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState(story?.title || '')
  const [excerpt, setExcerpt] = useState(story?.excerpt || '')
  const [status, setStatus] = useState(story?.status || 'draft')
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [resolutionNote, setResolutionNote] = useState('')

  const [coverImage, setCoverImage] = useState(story?.cover_image_path || '')
  const [uploading, setUploading] = useState(false)

  const [genres, setGenres] = useState<{ id: string; name: string }[]>([])
  const [selectedGenreId, setSelectedGenreId] = useState(initialGenreId || '')

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(
    story ? new Date(story.updated_at) : null
  )

  const storyIdRef = useRef<string | null>(story?.id || null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)

  const isLocked = ['submitted', 'in_review', 'approved', 'published'].includes(status)
  const isChangesRequested = status === 'changes_requested'

  useEffect(() => {
    async function fetchGenres() {
      const { data } = await supabase
        .from('genres')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order')
      if (data) setGenres(data)
    }
    fetchGenres()
  }, [supabase])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Once upon a time...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: story?.body || '',
    editable: !isLocked,
    editorProps: {
      attributes: {
        class:
          'prose-karibu max-w-none focus:outline-none min-h-[500px] font-serif text-lg leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter((word) => word.length > 0).length
      setWordCount(words)
      setReadingTime(Math.ceil(words / 200))
      if (!isSubmittingRef.current) setSaveStatus('unsaved')
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Image is too large. Maximum size is 5MB.', 'error')
      return
    }

    setUploading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast('Error uploading image: ' + uploadError.message, 'error')
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('covers').getPublicUrl(fileName)
    setCoverImage(publicUrl)
    setSaveStatus('unsaved')
    setUploading(false)
    toast('Cover image uploaded!', 'success')
  }

  const performSave = useCallback(
    async (newStatus = 'draft') => {
      if (!editor || isLocked) return null
      if (newStatus === 'draft' && isSubmittingRef.current) return null

      setSaveStatus('saving')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        toast('You must be logged in to save.', 'error')
        setSaveStatus('unsaved')
        return null
      }

      const body = editor.getHTML()
      const generatedSlug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || `untitled-${Date.now()}`

      const payload = {
        author_id: user.id,
        title: title || 'Untitled Story',
        slug: story?.slug || generatedSlug,
        excerpt,
        body,
        cover_image_path: coverImage || null,
        word_count: wordCount,
        reading_time_minutes: readingTime,
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'submitted'
          ? {
              submitted_at: new Date().toISOString(),
              rejection_reason: null,
              resolution_note: resolutionNote || null,
            }
          : {}),
      }

      let savedId = storyIdRef.current

      if (savedId) {
        const { error } = await supabase.from('stories').update(payload).eq('id', savedId)
        if (error) {
          toast('Failed to save: ' + error.message, 'error')
          setSaveStatus('unsaved')
          return null
        }
      } else {
        const { data, error } = await supabase
          .from('stories')
          .insert([payload])
          .select('id')
          .single()
        if (error) {
          toast('Failed to create story: ' + error.message, 'error')
          setSaveStatus('unsaved')
          return null
        }
        savedId = data.id
        storyIdRef.current = savedId
        window.history.replaceState(null, '', `/write/${savedId}`)
      }

      if (savedId && selectedGenreId) {
        await supabase.from('story_genres').delete().eq('story_id', savedId)
        const { error: insertError } = await supabase
          .from('story_genres')
          .insert({ story_id: savedId, genre_id: selectedGenreId })
        if (insertError) {
          console.error('Failed to save genre:', insertError)
        }
      }

      setSaveStatus('saved')
      setLastSaved(new Date())
      return savedId
    },
    [
      editor,
      title,
      excerpt,
      wordCount,
      readingTime,
      story,
      supabase,
      toast,
      isLocked,
      selectedGenreId,
      resolutionNote,
      coverImage,
    ]
  )

  useEffect(() => {
    if (isLocked || saveStatus === 'saved' || isSubmittingRef.current) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      performSave('draft')
    }, 1500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [title, excerpt, editor?.getText(), performSave, isLocked, saveStatus, selectedGenreId, coverImage])

  const handleSubmit = async () => {
    if (!title || !editor?.getText()) {
      toast('Please add a title and some content before submitting.', 'error')
      return
    }
    if (!selectedGenreId) {
      toast('Please select a genre before submitting.', 'error')
      return
    }

    isSubmittingRef.current = true
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const savedId = await performSave('submitted')
    if (savedId) {
      setStatus('submitted')
      toast(
        isChangesRequested
          ? 'Story resubmitted with your changes!'
          : 'Story submitted for review!',
        'success'
      )
      router.push('/write')
    } else {
      isSubmittingRef.current = false
    }
  }

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    performSave('draft')
  }

  if (!editor) return null

  const formattedTime = lastSaved?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      {isLocked && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold">Story Under Review</h3>
            <p className="text-sm">
              Your story has been submitted to the editorial team. You cannot make edits until the review is complete.
            </p>
          </div>
          <button
            onClick={() => router.push('/write')}
            className="text-sm font-medium underline hover:text-karibu-red shrink-0 ml-4"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {isChangesRequested && (
        <div className="bg-karibu-red/10 border border-karibu-red/30 rounded-md p-4 mb-6">
          <h3 className="text-sm font-bold text-karibu-red mb-2">Editor Feedback to Address</h3>
          <p className="text-sm text-[var(--text-main)] mb-4 whitespace-pre-wrap">
            {story?.rejection_reason}
          </p>

          <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
            How did you address this? (Optional)
          </label>
          <textarea
            value={resolutionNote}
            onChange={(e) => {
              setResolutionNote(e.target.value)
              setSaveStatus('unsaved')
            }}
            placeholder="e.g., Expanded chapter 2 and fixed the formatting issues..."
            className="w-full h-24 bg-[var(--bg-elevated)] border border-[var(--border-main)] rounded-md p-3 text-[var(--text-main)] focus:outline-none focus:border-karibu-red resize-none text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-[var(--border-main)] pb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{readingTime} min read</span>
          <span>•</span>

          {!isLocked ? (
            <select
              value={selectedGenreId}
              onChange={(e) => {
                setSelectedGenreId(e.target.value)
                setSaveStatus('unsaved')
              }}
              className="bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-main)] rounded px-2 py-1 text-sm focus:outline-none focus:border-karibu-red"
            >
              <option value="">Select Genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="capitalize">
              {genres.find((g) => g.id === selectedGenreId)?.name || 'No Genre'}
            </span>
          )}

          {!isLocked && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5 min-w-[80px]">
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-yellow-500" />
                    <span className="text-yellow-500">Saving...</span>
                  </>
                ) : saveStatus === 'unsaved' ? (
                  <span className="text-[var(--text-faint)]">Unsaved changes</span>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-green-500">Saved {formattedTime}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLocked && (
            <>
              <button
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
                className="text-sm font-medium text-[var(--text-muted)] hover:text-karibu-red transition disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveStatus === 'saving'}
                className="bg-karibu-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {status === 'draft'
                  ? 'Submit for Review'
                  : status === 'changes_requested'
                  ? 'Resubmit for Review'
                  : 'Submitted'}
              </button>
            </>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Story Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setSaveStatus('unsaved')
        }}
        disabled={isLocked}
        className="w-full bg-transparent text-4xl font-serif font-bold text-[var(--text-main)] placeholder:text-[var(--text-faint)] outline-none mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
      />

      <input
        type="text"
        placeholder="Add a brief excerpt (optional)..."
        value={excerpt}
        onChange={(e) => {
          setExcerpt(e.target.value)
          setSaveStatus('unsaved')
        }}
        disabled={isLocked}
        className="w-full bg-transparent text-lg text-[var(--text-muted)] placeholder:text-[var(--text-faint)] outline-none mb-8 border-b border-transparent focus:border-[var(--border-strong)] pb-2 disabled:opacity-70 disabled:cursor-not-allowed"
      />

      <div className="mb-8">
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Cover Image
        </label>
        {coverImage ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-[var(--border-main)] group">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            {!isLocked && (
              <button
                onClick={() => {
                  setCoverImage('')
                  setSaveStatus('unsaved')
                }}
                className="absolute top-3 right-3 bg-black/70 hover:bg-karibu-red text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : !isLocked ? (
          <div className="border-2 border-dashed border-[var(--border-main)] hover:border-karibu-red/50 transition rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading || isLocked}
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${
                uploading ? 'text-[var(--text-faint)]' : 'text-karibu-red hover:text-red-500'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <ImagePlus size={24} />
                  <span className="text-sm font-medium">+ Upload Cover Image</span>
                </>
              )}
            </label>
            <p className="text-xs text-[var(--text-faint)] mt-2">JPG, PNG or WEBP. Max 5MB.</p>
          </div>
        ) : (
          <div className="h-64 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] text-sm">
            No cover image
          </div>
        )}
      </div>

      <div className={isLocked ? 'opacity-70 cursor-not-allowed' : ''}>
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-faint);
          pointer-events: none;
          height: 0;
        }
        .prose-karibu p {
          margin-bottom: 1.5em;
          color: var(--text-main);
        }
        .prose-karibu h1,
        .prose-karibu h2,
        .prose-karibu h3 {
          color: var(--text-main);
          font-family: var(--font-serif);
          margin-top: 1.5em;
          margin-bottom: 0.75em;
        }
        .prose-karibu blockquote {
          border-left: 3px solid var(--color-karibu-red);
          padding-left: 1rem;
          font-style: italic;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}