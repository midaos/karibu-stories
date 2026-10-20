'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, X, User, Lock, ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [avatarPath, setAvatarPath] = useState('')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfile(profile)
        setDisplayName(profile.display_name || '')
        setUsername(profile.username || '')
        setBio(profile.bio || '')
        setWebsiteUrl(profile.website_url || '')
        setAvatarPath(profile.avatar_path || '')
      }
      setLoading(false)
    }
    loadData()
  }, [supabase, router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast('Avatar too large. Max 2MB.', 'error')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast('Upload failed: ' + uploadError.message, 'error')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    // Add a cache-buster so the new image shows immediately
    const urlWithBuster = `${publicUrl}?t=${Date.now()}`
    setAvatarPath(urlWithBuster)
    
    // Save immediately
    await supabase.from('profiles').update({ avatar_path: urlWithBuster }).eq('id', user.id)
    
    toast('Avatar updated!', 'success')
    setUploading(false)
    router.refresh()
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    if (!displayName.trim() || !username.trim()) {
      toast('Display name and username are required.', 'error')
      return
    }

    // Validate username (alphanumeric + underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast('Username can only contain letters, numbers, and underscores.', 'error')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      if (error.message.includes('duplicate')) {
        toast('That username is already taken.', 'error')
      } else {
        toast('Error saving: ' + error.message, 'error')
      }
    } else {
      toast('Profile updated successfully!', 'success')
      router.refresh()
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters.', 'error')
      return
    }

    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      toast('Error updating password: ' + error.message, 'error')
    } else {
      toast('Password updated successfully.', 'success')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-karibu-dark flex items-center justify-center">
        <Loader2 className="animate-spin text-karibu-red" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-karibu-dark text-white p-6">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 border-b border-neutral-800 pb-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-karibu-muted hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h1 className="text-3xl font-serif font-bold">Account Settings</h1>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="bg-karibu-surface border border-neutral-800 rounded-lg p-6 mb-8">
          <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <User size={18} /> Profile Picture
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-700 flex items-center justify-center text-2xl font-bold">
              {avatarPath ? (
                <img src={avatarPath} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayName?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-karibu-red hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              <p className="text-xs text-karibu-muted mt-2">JPG, PNG. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-karibu-surface border border-neutral-800 rounded-lg p-6 mb-8 space-y-4">
          <h2 className="font-serif text-lg font-bold mb-2">Public Profile</h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-karibu-red"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Username</label>
            <div className="flex items-center">
              <span className="bg-karibu-dark border border-r-0 border-neutral-700 rounded-l-md px-3 py-2 text-neutral-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-karibu-dark border border-neutral-700 rounded-r-md p-2 text-white focus:outline-none focus:border-karibu-red"
                pattern="[a-zA-Z0-9_]+"
                required
              />
            </div>
            <p className="text-xs text-karibu-muted mt-1">Letters, numbers, and underscores only.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself..."
              className="w-full h-24 bg-karibu-dark border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-karibu-red resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Website URL</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourblog.com"
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-karibu-red"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-karibu-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Password */}
        <form onSubmit={handleChangePassword} className="bg-karibu-surface border border-neutral-800 rounded-lg p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold mb-2 flex items-center gap-2">
            <Lock size={18} /> Security
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-karibu-red"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-karibu-red"
              minLength={6}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={changingPassword || !newPassword}
              className="bg-neutral-700 text-white px-6 py-2 rounded-md font-medium hover:bg-neutral-600 transition disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}