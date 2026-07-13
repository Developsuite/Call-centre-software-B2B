"use client"

import { useState, useEffect } from "react";
import { login } from './actions'
import { SubmitButton } from './SubmitButton'
import { PasswordInput } from '@/components/ui/password-input'
import { Check } from 'lucide-react'

export function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleSubmit = () => {
    if (remember) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberedPassword", password);
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedPassword");
    }
  };

  // Prevent hydration mismatch on the checkbox state
  if (!mounted) {
    return null; // Or a simple skeleton, but login form is small enough
  }

  return (
    <>
      {error && (
        <div className="mb-5 px-4 py-2.5 bg-red-50 border border-red-100 text-red-500 text-[13px] font-medium rounded-xl text-center">
          {error}
        </div>
      )}

      <form action={login} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="text-[12px] text-slate-600 font-medium mb-1.5 block ml-1">Email</label>
          <input
            id="email"
            name="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-[13px] text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:border-[#ff5a36] focus:ring-1 focus:ring-[#ff5a36] transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-[12px] text-slate-600 font-medium mb-1.5 block ml-1">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            required
            className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-[13px] text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:border-[#ff5a36] focus:ring-1 focus:ring-[#ff5a36] transition-all"
          />
        </div>

        <div className="flex items-center justify-between mt-1 mb-2 px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-[14px] h-[14px] rounded-[3px] border transition-colors flex items-center justify-center ${remember ? 'bg-[#ff5a36] border-[#ff5a36]' : 'border-slate-300 bg-white group-hover:border-[#ff5a36]'}`}>
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              {remember && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
            <span className="text-[12px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Remember login</span>
          </label>
          <a href="#" className="text-[12px] font-semibold text-[#635BFF] hover:text-[#ff5a36] underline decoration-[#635BFF]/30 underline-offset-2 transition-colors">Forget Password?</a>
        </div>

        <SubmitButton />
      </form>
    </>
  )
}
