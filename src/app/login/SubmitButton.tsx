"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 mt-1 flex items-center justify-center gap-2 bg-[#ff5a36] hover:bg-[#e8502f] active:scale-[0.98] text-white text-[14px] font-semibold rounded-full shadow-md shadow-[#ff5a36]/20 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Logging in...
        </>
      ) : (
        "Login"
      )}
    </button>
  )
}
