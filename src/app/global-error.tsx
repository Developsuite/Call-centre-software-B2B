'use client'

import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Critical System Error</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                A critical error occurred while initializing the application layout. Our team has been notified. 
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => reset()}
                  className="flex-1 h-12 rounded-xl bg-[#ff5a36] text-white font-semibold text-sm hover:bg-[#e04829] transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
