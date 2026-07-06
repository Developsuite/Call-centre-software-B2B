import { login } from './actions'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Lock, Mail } from "lucide-react"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-background p-4 font-sans relative overflow-hidden">
      
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff5a36]/10 dark:bg-[#ff5a36]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-[2rem] border-none shadow-2xl bg-white dark:bg-card p-8 md:p-10 relative z-10">
        
        {/* Logo / Brand */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] text-white p-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_rgba(255,90,54,0.3)] border border-[#e04a29]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your Call Center account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl text-center">
            {error}
          </div>
        )}

        <form action={login} className="flex flex-col gap-5">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#ff5a36] transition-colors" strokeWidth={1.5} />
              <Input 
                id="email" 
                name="email" 
                type="text" 
                placeholder="Email or Full Name" 
                required 
                className="pl-12 h-14 bg-slate-50 dark:bg-background border-slate-200 dark:border-border rounded-xl text-slate-800 dark:text-white focus-visible:ring-[#ff5a36] transition-all"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#ff5a36] transition-colors" strokeWidth={1.5} />
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                className="pl-12 h-14 bg-slate-50 dark:bg-background border-slate-200 dark:border-border rounded-xl text-slate-800 dark:text-white focus-visible:ring-[#ff5a36] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-1 mb-2">
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <input type="checkbox" className="rounded border-slate-300 text-[#ff5a36] focus:ring-[#ff5a36]" />
              Remember me
            </label>
            <a href="#" className="text-sm font-medium text-[#ff5a36] hover:text-[#e04a29] transition-colors">Forgot password?</a>
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-border hover:brightness-110 transition-all text-white font-medium rounded-xl flex items-center justify-center gap-2 group"
          >
            Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
      </Card>
    </div>
  )
}
