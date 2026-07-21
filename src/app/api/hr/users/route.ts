import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase admin client with the service role key.
// This is required to bypass RLS and manage authentication users directly.
// IMPORTANT: Never expose the service_role_key on the client side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password, full_name, role, organization_id, team, team_id, is_team_lead } = data;

    if (!email || !password || !full_name || !role || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    // 2. Insert into profiles table
    // (We use admin client to bypass RLS if necessary, though trigger might handle it.
    // If the trigger exists, it might insert a default row, so we use upsert.)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      role,
      organization_id,
      team: team || null,
      team_id: team_id || null,
      is_team_lead: is_team_lead || false,
      status: 'Active'
    });

    if (profileError) {
      // If profile creation fails, we might want to delete the auth user to keep state clean
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete the user from Auth (this cascades to profiles if foreign keys are set up correctly)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
