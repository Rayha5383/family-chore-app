import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ok = (data: object) => new Response(JSON.stringify(data), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return ok({ error: 'Unauthorized' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return ok({ error: 'Unauthorized: ' + (userError?.message || 'no user') });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles').select('role, parent_id').eq('id', user.id).single();

    if (profileError) return ok({ error: 'Profile error: ' + profileError.message });
    if (!callerProfile || callerProfile.role !== 'parent') return ok({ error: 'Only parents can send invites' });

    const body = await req.json();
    const { childEmail, childName, avatarEmoji, monthlyCap, redirectTo, role } = body;

    if (!childEmail || !childName) return ok({ error: 'childEmail and childName are required' });

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
    const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === childEmail.toLowerCase());

    if (existingUser) {
      // Update metadata
      await adminClient.auth.admin.updateUserById(existingUser.id, { user_metadata: userData });

      // If never confirmed, delete and re-invite
      if (!existingUser.email_confirmed_at) {
        await adminClient.auth.admin.deleteUser(existingUser.id);
        const { error: reInviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
          redirectTo: appUrl,
          data: userData,
        });
        if (reInviteError) return ok({ error: 'Re-invite failed: ' + reInviteError.message });
        return ok({ success: true, resent: true });
      }

      return ok({ success: true, alreadyConfirmed: true });
    }

    // New user — send invite
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
      redirectTo: appUrl,
      data: userData,
    });

    if (inviteError) return ok({ error: 'Invite failed: ' + inviteError.message });

    return ok({ success: true });

  } catch (err) {
    return ok({ error: 'Unexpected error: ' + String(err) });
  }
});
