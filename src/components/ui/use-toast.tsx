'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-karibu-red" size={20} />,
    info: <AlertCircle className="text-blue-500" size={20} />,
  }

  const borders = {
    success: 'border-green-900/50 bg-[#0a1f0a]',
    error: 'border-karibu-red/50 bg-[#1f0a0a]',
    info: 'border-blue-900/50 bg-[#0a0f1f]',
  }

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl z-50 transition-all animate-in slide-in-from-bottom-5 ${borders[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium text-white">{message}</p>
      <button onClick={onClose} className="ml-4 text-neutral-400 hover:text-white transition">
        <X size={16} />
      </button>
    </div>
  )
}

// A simple global state hook for toasts
let showToastGlobal: (message: string, type: ToastType) => void = () => {}

export function useToast() {
  return {
    toast: (message: string, type: ToastType = 'info') => showToastGlobal(message, type),
  }
}

export function Toaster() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    showToastGlobal = (message: string, type: ToastType) => {
      setToast({ message, type })
    }
  }, [])

  if (!toast) return null

  return <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
}