'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

import { getAdminClient } from '@/utils/supabase/admin'

// Simple in-memory rate limit map to protect against naive brute force attacks
const rateLimitMap = new Map<string, { count: number, lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 60 * 1000 // 1 minute lockout

export async function login(formData: FormData) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const limitData = rateLimitMap.get(ip);
    if (limitData) {
      if (now - limitData.lastAttempt < LOCKOUT_TIME && limitData.count >= MAX_ATTEMPTS) {
        redirect('/login?error=Too many login attempts. Please try again in 1 minute.');
      }
      if (now - limitData.lastAttempt >= LOCKOUT_TIME) {
        rateLimitMap.delete(ip);
      }
    }

    const supabase = await createClient()

    const emailValue = formData.get('email');
    if (!emailValue) {
      redirect('/login?error=Email is required');
    }
    const identifier = (emailValue as string).trim()
    const password = formData.get('password') as string

    if (!password) {
      redirect('/login?error=Password is required');
    }

    let emailToUse = identifier

    // If identifier is not an email, try resolving it as a full name
    if (!identifier.includes('@')) {
      const admin = getAdminClient()
      const { data: profiles } = await admin.from('profiles').select('id').ilike('full_name', identifier)
      
      if (profiles && profiles.length > 1) {
        console.warn(`[SECURITY] Multiple login matches for name: ${identifier}. Forcing email login.`);
        redirect('/login?error=Multiple accounts share this name. Please log in with your email address.');
      } else if (profiles && profiles.length === 1) {
        const profile = profiles[0]
        const { data: userData } = await admin.auth.admin.getUserById(profile.id)
        if (userData?.user?.email) {
          emailToUse = userData.user.email
        } else {
           redirect('/login?error=Invalid credentials')
        }
      } else {
        redirect('/login?error=Invalid credentials')
      }
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password
    })

    if (error) {
      const current = rateLimitMap.get(ip) || { count: 0, lastAttempt: now };
      rateLimitMap.set(ip, { count: current.count + 1, lastAttempt: now });
      // Add artificial delay to slow down brute force scripts
      await new Promise(resolve => setTimeout(resolve, 1500));
      redirect('/login?error=Invalid credentials')
    }

    // Success - clear rate limit for this IP
    rateLimitMap.delete(ip);

    // Determine where to redirect based on user role
    let redirectPath = '/'
    if (signInData?.user) {
      const admin = getAdminClient()
      const { data: profile } = await admin.from('profiles').select('role').eq('id', signInData.user.id).single()
      if (profile?.role === 'SuperAdmin') redirectPath = '/master/dashboard'
      else if (profile?.role === 'Admin') redirectPath = '/admin'
      else if (profile?.role === 'Processor') redirectPath = '/processor/queue'
    }

    revalidatePath('/', 'layout')
    redirect(redirectPath)
  } catch (error: any) {
    // If it's a redirect error, Next.js needs us to rethrow it so navigation works!
    if (error && typeof error === 'object' && 'digest' in error && (error.digest as string).startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    // Otherwise it's a real crash, let's log it safely and redirect to show the error
    console.error("Login Server Action Error:", error);
    redirect('/login?error=An internal server error occurred');
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
