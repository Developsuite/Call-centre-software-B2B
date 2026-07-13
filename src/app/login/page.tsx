import { login } from './actions'
import Image from 'next/image'
import { SubmitButton } from './SubmitButton'
import { PasswordInput } from '@/components/ui/password-input'
import { LoginForm } from './LoginForm'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* Left Side — Padded Image Panel */}
      <div className="hidden lg:block w-1/2 relative p-4 lg:p-6">
        <div className="relative w-full h-full overflow-hidden rounded-3xl">
          <Image
            src="/image.jpg"
            alt="Call Suite background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[400px] my-auto">
          
          {/* Logo area */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-[8px] bg-[#ff5a36] flex items-center justify-center shadow-md shadow-[#ff5a36]/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </div>
            <span className="text-[18px] font-bold text-slate-800 tracking-tight">Call Suite</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-[25px] font-bold text-slate-900 tracking-tight">Login to your account</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">Welcome back! Enter your details to log in to your account</p>
          </div>

          {/* Login Form (Client Component) */}
          <LoginForm error={error} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-center text-[10px] font-medium text-slate-400">
              Call Suite Developed by Developsuite
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
