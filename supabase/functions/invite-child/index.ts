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
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client to verify the calling user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Verify caller is a parent
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (!callerProfile || callerProfile.role !== 'parent') {
      return new Response(JSON.stringify({ error: 'Only parents can invite children' }), { status: 403, headers: corsHeaders });
    }

    const { childEmail, childName, avatarEmoji, monthlyCap, redirectTo } = await req.json();
    if (!childEmail || !childName) {
      return new Response(JSON.stringify({ error: 'childEmail and childName are required' }), { status: 400, headers: corsHeaders });
    }

    // Send invite email via Supabase Admin
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
      redirectTo: redirectTo || 'https://family-chore-app.vercel.app',
      data: {
        name: childName,
        avatar_emoji: avatarEmoji || '🦁',
        avatar_color: 'bg-indigo-500',
        role: 'child',
        monthly_cap: monthlyCap || 100,
        parent_id: user.id,
      },
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
