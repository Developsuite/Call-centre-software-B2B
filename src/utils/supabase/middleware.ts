import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user;
  } catch (error) {
    console.error("Middleware Supabase connection error:", error);
    // If Supabase is unreachable (timeout/DNS issue), assume unauthenticated
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  
  // If user is NOT logged in and trying to access a protected route
  // Redirect to login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user IS logged in and trying to access login page
  // Redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Role-Based Route Protection
  if (user && !isAuthRoute) {
    let profile = null;
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      profile = data;
    } catch (error) {
      console.error("Middleware profile fetch error:", error);
    }
    
    const pathname = request.nextUrl.pathname;
    let shouldRedirect = false;

    if (pathname.startsWith('/master') && profile?.role !== 'SuperAdmin') {
      shouldRedirect = true;
    } else if (pathname.startsWith('/admin') && !['SuperAdmin', 'Admin'].includes(profile?.role)) {
      shouldRedirect = true;
    } else if (pathname.startsWith('/processor') && !['SuperAdmin', 'Admin', 'Processor'].includes(profile?.role)) {
      shouldRedirect = true;
    }

    if (shouldRedirect) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
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
