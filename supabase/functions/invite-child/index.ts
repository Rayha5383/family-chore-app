import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile } = await adminClient.from('profiles').select('role, parent_id').eq('id', user.id).single();
    if (!callerProfile || callerProfile.role !== 'parent') {
      return new Response(JSON.stringify({ error: 'Only parents can send invites' }), { status: 403, headers: corsHeaders });
    }

    const { childEmail, childName, avatarEmoji, monthlyCap, redirectTo, role } = await req.json();
    if (!childEmail || !childName) {
      return new Response(JSON.stringify({ error: 'childEmail and childName are required' }), { status: 400, headers: corsHeaders });
    }

    const inviteRole = role === 'parent' ? 'parent' : 'child';
    const primaryParentId = callerProfile.parent_id || user.id;
    const appUrl = redirectTo || 'https://family-chore-app-chi.vercel.app';

    const userData = {
      name: childName,
      avatar_emoji: inviteRole === 'parent' ? '👨‍👧' : (avatarEmoji || '🦁'),
      avatar_color: inviteRole === 'parent' ? 'bg-amber-500' : 'bg-indigo-500',
      role: inviteRole,
      monthly_cap: inviteRole === 'parent' ? 0 : (monthlyCap || 100),
      parent_id: primaryParentId,
    };

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === childEmail.toLowerCase());

    if (existingUser) {
      // User exists — update their metadata and send a magic link so they can sign in
      await adminClient.auth.admin.updateUserById(existingUser.id, { user_metadata: userData });
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: childEmail,
        options: { redirectTo: appUrl },
      });
      // Send password reset so they can set/reset their password and get back in
      await userClient.auth.resetPasswordForEmail(childEmail, { redirectTo: appUrl });
      return new Response(JSON.stringify({ success: true, resent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // New user — send invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
      redirectTo: appUrl,
      data: userData,
    });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, userId: inviteData.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
