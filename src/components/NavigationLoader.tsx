"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [showConnecting, setShowConnecting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Listen for sign out event
  useEffect(() => {
    const handleSignout = () => setIsSigningOut(true)
    window.addEventListener('signout', handleSignout)
    return () => window.removeEventListener('signout', handleSignout)
  }, [])

  // Turn off loading screen when path or search params change (navigation completes)
  useEffect(() => {
    setIsNavigating(false)
    setShowConnecting(false)
    setIsSigningOut(false)
  }, [pathname, searchParams])

  // Delay the "Connecting..." overlay by 1 second to avoid flashing on fast navigations
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (isNavigating) {
      timeoutId = setTimeout(() => setShowConnecting(true), 1000)
    } else {
      setShowConnecting(false)
    }
    return () => clearTimeout(timeoutId)
  }, [isNavigating])

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

  if (isSigningOut) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-900 flex flex-col items-center justify-center transition-all animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-light text-white tracking-widest">See you soon.</h1>
          <Loader2 className="w-5 h-5 animate-spin text-[#ff5a36]/80" />
        </div>
      </div>
    )
  }

  if (!showConnecting) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-full shadow-2xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff5a36]" />
      </div>
    </div>
  )
}
