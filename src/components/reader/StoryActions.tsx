'use client'

import { useState, useEffect } from 'react'
import { Heart, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function StoryActions({ storyId }: { storyId: string }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchUserData() {
      // 1. Get the total like count
      const { count } = await supabase
        .from('story_likes')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
      
      setLikeCount(count || 0)

      // 2. Check if the current user has liked or saved this story
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: likeData } = await supabase
          .from('story_likes')
          .select('id')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .maybeSingle()
          
        setLiked(!!likeData)

        const { data: saveData } = await supabase
          .from('saved_stories')
          .select('id')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .maybeSingle()
          
        setSaved(!!saveData)
      }
      
      setLoading(false)
    }
    
    fetchUserData()
  }, [storyId, supabase])

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast('Please log in to like this story.', 'error')
      router.push('/login')
      return
    }

    if (liked) {
      // Optimistic UI update
      setLiked(false)
      setLikeCount(prev => Math.max(0, prev - 1))
      
      const { error } = await supabase
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        
      if (error) {
        // Revert if error
        setLiked(true)
        setLikeCount(prev => prev + 1)
        toast('Failed to unlike story.', 'error')
      }
    } else {
      // Optimistic UI update
      setLiked(true)
      setLikeCount(prev => prev + 1)
      
      const { error } = await supabase
        .from('story_likes')
        .insert({ story_id: storyId, user_id: user.id })
        
      if (error) {
        // Revert if error
        setLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
        toast('Failed to like story: ' + error.message, 'error')
      }
    }
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast('Please log in to save this story.', 'error')
      router.push('/login')
      return
    }

    if (saved) {
      setSaved(false)
      const { error } = await supabase
        .from('saved_stories')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        
      if (error) {
        setSaved(true)
        toast('Failed to remove story from library.', 'error')
      } else {
        toast('Removed from your library.', 'info')
      }
    } else {
      setSaved(true)
      const { error } = await supabase
        .from('saved_stories')
        .insert({ story_id: storyId, user_id: user.id })
        
      if (error) {
        setSaved(false)
        toast('Failed to save story: ' + error.message, 'error')
      } else {
        toast('Story saved to your library!', 'success')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-8 my-8 opacity-50">
        <div className="flex flex-col items-center gap-1 text-neutral-400">
          <Heart size={24} />
          <span className="text-xs font-medium">...</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-neutral-400">
          <Bookmark size={24} />
          <span className="text-xs font-medium">...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-8 my-8">
      <button 
        onClick={handleLike} 
        className={`flex flex-col items-center gap-1 transition group ${liked ? 'text-karibu-red' : 'text-neutral-400 hover:text-white'}`}
      >
        <Heart size={24} fill={liked ? 'currentColor' : 'none'} className="group-active:scale-90 transition-transform" />
        <span className="text-xs font-medium">{likeCount} Likes</span>
      </button>
      
      <button 
        onClick={handleSave} 
        className={`flex flex-col items-center gap-1 transition group ${saved ? 'text-karibu-red' : 'text-neutral-400 hover:text-white'}`}
      >
        <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} className="group-active:scale-90 transition-transform" />
        <span className="text-xs font-medium">{saved ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  )
}