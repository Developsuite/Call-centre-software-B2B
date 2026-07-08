"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  // Turn off loading screen when path or search params change (navigation completes)
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  // Intercept clicks on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      
      if (anchor && anchor.href) {
        const url = new URL(anchor.href)
        const currentUrl = new URL(window.location.href)
        
        // If it's an internal link and not just a hash change or same page
        if (
          url.origin === currentUrl.origin &&
          url.pathname !== currentUrl.pathname &&
          !anchor.hasAttribute('download') &&
          anchor.target !== '_blank'
        ) {
          setIsNavigating(true)
        }
      }
    }

    // Use capture phase to ensure we catch it before default behaviors
    document.addEventListener('click', handleClick, true) 
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  if (!isNavigating) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff5a36]" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Connecting...</span>
      </div>
    </div>
  )
}
