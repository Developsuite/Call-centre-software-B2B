import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const allCookies = request.cookies.getAll()
  const hasAuthCookies = allCookies.some(c => c.name.startsWith('sb-') || c.name.includes('auth-token'))
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isHealthCheck = request.nextUrl.pathname.startsWith('/api/health')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          return fetch(url, {
            ...options,
            signal: options?.signal || controller.signal,
          }).finally(() => clearTimeout(timeoutId))
        }
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null;
  if (hasAuthCookies) {
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null;
    } catch (error: any) {
      console.warn("Middleware Supabase connection unavailable:", error?.message || error);
    }
  }

  // If user is NOT logged in and trying to access a protected route
  // Redirect to login
  if (!user && !isAuthRoute && !isHealthCheck) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in
  if (user) {
    let profile = null;
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      profile = data;
    } catch (error: any) {
      console.warn("Middleware profile fetch unavailable:", error?.message || error);
    }

    const pathname = request.nextUrl.pathname;
    let targetPath = null;

    // Helper to get correct dashboard based on role
    const getDashboardPath = (role: string | undefined) => {
      if (role === 'SuperAdmin') return '/master/dashboard';
      if (role === 'Admin') return '/admin';
      if (role === 'Processor') return '/processor/queue';
      return '/'; // Default to Agent dashboard
    };

    if (isAuthRoute) {
      // If logged in user tries to access login page, redirect to their respective dashboard
      targetPath = getDashboardPath(profile?.role);
    } else {
      // Role-Based Route Protection
      let shouldRedirect = false;

      if (pathname.startsWith('/master') && profile?.role !== 'SuperAdmin') {
        shouldRedirect = true;
      } else if (pathname.startsWith('/admin') && !['SuperAdmin', 'Admin'].includes(profile?.role)) {
        shouldRedirect = true;
      } else if (pathname.startsWith('/processor') && !['SuperAdmin', 'Admin', 'Processor'].includes(profile?.role)) {
        shouldRedirect = true;
      } else if (profile?.role !== 'Agent' && (pathname === '/' || pathname === '/sales')) {
        // Prevent non-agents from seeing the agent dashboard or agent sales page
        shouldRedirect = true;
      }

      if (shouldRedirect) {
        targetPath = getDashboardPath(profile?.role);
      }
    }

    if (targetPath && targetPath !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = targetPath
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!
  return supabaseResponse
}
