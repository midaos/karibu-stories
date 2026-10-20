import { StoryEditor } from '@/components/writer/StoryEditor'

export default function NewStoryPage() {
  return (
    <div className="min-h-screen bg-karibu-dark text-white">
      <StoryEditor story={null} />
    </div>
  )
}