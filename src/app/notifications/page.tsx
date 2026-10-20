import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, ChevronLeft } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read on page load
  if (notifications && notifications.some(n => !n.read_at)) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .is('read_at', null)
  }

  return (
    <div className="min-h-screen bg-karibu-dark text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-karibu-muted hover:text-white flex items-center gap-1 mb-6 transition">
          <ChevronLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-3xl font-serif font-bold mb-8 flex items-center gap-2">
          <Bell size={24} /> Notifications
        </h1>

        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-lg bg-karibu-surface/50">
            <p className="text-karibu-muted">You have no notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Link 
                key={n.id} 
                href={n.action_url || '#'}
                className={`block p-4 rounded-lg border transition hover:border-karibu-red ${
                  n.read_at ? 'bg-karibu-surface border-neutral-800' : 'bg-karibu-surface border-karibu-red/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white">{n.title}</h3>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-karibu-red shrink-0 mt-1.5"></span>}
                </div>
                <p className="text-sm text-neutral-300">{n.message}</p>
                <p className="text-xs text-karibu-muted mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}