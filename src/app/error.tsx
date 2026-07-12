'use client' // Error components must be Client Components

import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard caught an error:", error)

    // Detect if this is a deployment version mismatch (Next.js Server Action hash changed)
    const isVersionMismatch = 
      error.message?.includes('UnrecognizedActionError') || 
      error.message?.includes('not found on the server') ||
      error.message?.includes('Failed to fetch');

    if (isVersionMismatch) {
      const reloadCount = parseInt(sessionStorage.getItem('deploy_reload_count') || '0');
      
      // Prevent infinite reload loop (max 2 auto-reloads)
      if (reloadCount < 2) {
        setIsUpdating(true);
        sessionStorage.setItem('deploy_reload_count', (reloadCount + 1).toString());
        
        // Auto-refresh after a short delay to fetch the new JavaScript bundle
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
    }

    // Reset reload count if we rendered a normal error
    sessionStorage.removeItem('deploy_reload_count');
  }, [error])

  if (isUpdating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RefreshCw className="w-12 h-12 text-[#ff5a36] animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Updating Application...</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[300px]">
            We just rolled out a new update! Seamlessly refreshing your session to load the latest features.
          </p>
        </div>
      </div>
    )
  }

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
