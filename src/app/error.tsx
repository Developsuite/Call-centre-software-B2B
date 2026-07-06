'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard caught an error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/10 dark:bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Something went wrong!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
            We encountered an unexpected error while loading this page. Our team has been notified. 
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => reset()}
              className="flex-1 h-12 rounded-xl bg-[#ff5a36] text-white font-semibold text-sm hover:bg-[#e04829] hover:shadow-[0_0_20px_rgba(255,90,54,0.3)] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
