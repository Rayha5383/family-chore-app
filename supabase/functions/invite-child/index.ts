import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ok = (data: object) => new Response(JSON.stringify(data), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const SEED_CHORES = [
  { title: 'Make Bed', description: 'Make your bed neatly — pillows straight, blanket smooth', frequency: 'daily', value: 0.34, due_time: '08:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Brush Teeth (Morning)', description: 'Brush for at least 2 minutes before school', frequency: 'daily', value: 0.27, due_time: '08:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Shoes Put Away', description: 'Shoes in the closet or shoe rack, not the floor', frequency: 'daily', value: 0.20, due_time: '20:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Backpack Hung Up', description: 'Backpack on the hook, not on the floor', frequency: 'daily', value: 0.20, due_time: '17:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Brush Teeth (Night)', description: 'Brush before bed', frequency: 'daily', value: 0.27, due_time: '21:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Bedroom Surfaces Clean', description: 'Desk, nightstand, and dresser cleared and wiped', frequency: 'daily', value: 0.40, due_time: '20:00', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Clean a Full Bathroom', description: 'Sink, mirror, toilet, floor, and trash — all done', frequency: 'weekly', value: 3.00, due_time: '20:00', verification_type: 'both', checklist_items: ['Sink scrubbed', 'Mirror cleaned', 'Toilet cleaned', 'Floor mopped/swept', 'Trash emptied'], requires_before_after: true, active: true, week_days: [0,1,2,3,4,5,6] },
  { title: 'Do Your Own Laundry', description: 'Wash, dry, fold, and put away your laundry', frequency: 'weekly', value: 3.00, due_time: '20:00', verification_type: 'both', checklist_items: ['Clothes washed', 'Clothes dried', 'Folded and put away'], requires_before_after: false, active: true, week_days: [0,1,2,3,4,5,6] },
  { title: 'Mop the Downstairs Floor', description: 'Sweep then mop the entire downstairs floor', frequency: 'weekly', value: 4.00, due_time: '20:00', verification_type: 'photo', checklist_items: [], requires_before_after: true, active: true, week_days: [0,1,2,3,4,5,6] },
  { title: 'Mow the Lawn', description: 'Mow the front and back yard', frequency: 'weekly', value: 12.00, due_time: '20:00', verification_type: 'photo', checklist_items: [], requires_before_after: true, active: true, week_days: [0,1,2,3,4,5,6] },
  { title: 'Unload the Dishwasher', description: 'Unload all clean dishes and put them away', frequency: 'anytime', value: 1.00, due_time: '23:59', verification_type: 'photo', checklist_items: [], requires_before_after: true, active: true, week_days: [] },
  { title: 'Cook Dinner', description: 'Cook a full meal for the family', frequency: 'anytime', value: 5.00, due_time: '23:59', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
  { title: 'Organize a Closet or Drawer', description: 'Pick one closet or drawer and fully organize it', frequency: 'anytime', value: 3.00, due_time: '23:59', verification_type: 'photo', checklist_items: [], requires_before_after: true, active: true, week_days: [] },
  { title: 'Wash Windows', description: 'Wash windows inside and out including sills ($2 per window)', frequency: 'anytime', value: 2.00, due_time: '23:59', verification_type: 'photo', checklist_items: [], requires_before_after: true, active: true, week_days: [] },
  { title: 'Take the Dogs Out', description: 'Take the dogs outside for a walk or bathroom break', frequency: 'anytime', value: 0.50, due_time: '23:59', verification_type: 'photo', checklist_items: [], requires_before_after: false, active: true, week_days: [] },
];

function generateUUID() {
  return crypto.randomUUID();
}

async function seedChoresIfNeeded(adminClient: any, childId: string) {
  const { count } = await adminClient
    .from('chores')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_user_id', childId);
  if ((count ?? 0) > 0) return; // already has chores
  const now = new Date().toISOString();
  const choresToInsert = SEED_CHORES.map(chore => ({
    id: generateUUID(),
    ...chore,
    assigned_user_id: childId,
    created_at: now,
  }));
  await adminClient.from('chores').insert(choresToInsert);
}

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

    // Check if user already exists via profiles table (fast, avoids listUsers timeout)
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('login_email', childEmail.toLowerCase())
      .maybeSingle();

    if (existingProfile?.id) {
      const existingId = existingProfile.id;
      const { data: authUser } = await adminClient.auth.admin.getUserById(existingId);

      await adminClient.auth.admin.updateUserById(existingId, { user_metadata: userData });
      await adminClient.from('profiles').update({
        name: childName,
        avatar_emoji: userData.avatar_emoji,
        role: inviteRole,
        monthly_cap: userData.monthly_cap,
        parent_id: primaryParentId,
      }).eq('id', existingId);

      if (!authUser?.user?.email_confirmed_at) {
        await adminClient.auth.admin.deleteUser(existingId);
        const { data: reInviteData, error: reInviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
          redirectTo: appUrl,
          data: userData,
        });
        if (reInviteError) return ok({ error: 'Re-invite failed: ' + reInviteError.message });
        if (inviteRole === 'child' && reInviteData?.user?.id) {
          await seedChoresIfNeeded(adminClient, reInviteData.user.id);
        }
        return ok({ success: true, resent: true });
      }

      if (inviteRole === 'child') await seedChoresIfNeeded(adminClient, existingId);
      return ok({ success: true, alreadyConfirmed: true });
    }

    // New user — send invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
      redirectTo: appUrl,
      data: userData,
    });

    if (inviteError) {
      // User exists in auth but not found in profiles (e.g. login_email not set yet)
      const alreadyExists = inviteError.message.toLowerCase().includes('already');
      if (!alreadyExists) return ok({ error: 'Invite failed: ' + inviteError.message });

      // Fallback: find via listUsers and handle re-invite
      const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === childEmail.toLowerCase());
      if (!existingUser) return ok({ error: 'User exists but could not be located' });

      await adminClient.auth.admin.updateUserById(existingUser.id, { user_metadata: userData });
      await adminClient.from('profiles').update({
        name: childName,
        avatar_emoji: userData.avatar_emoji,
        role: inviteRole,
        monthly_cap: userData.monthly_cap,
        parent_id: primaryParentId,
        login_email: childEmail.toLowerCase(),
      }).eq('id', existingUser.id);

      if (!existingUser.email_confirmed_at) {
        await adminClient.auth.admin.deleteUser(existingUser.id);
        const { data: reInviteData, error: reInviteError } = await adminClient.auth.admin.inviteUserByEmail(childEmail, {
          redirectTo: appUrl,
          data: userData,
        });
        if (reInviteError) return ok({ error: 'Re-invite failed: ' + reInviteError.message });
        if (inviteRole === 'child' && reInviteData?.user?.id) {
          await seedChoresIfNeeded(adminClient, reInviteData.user.id);
        }
        return ok({ success: true, resent: true });
      }

      if (inviteRole === 'child') await seedChoresIfNeeded(adminClient, existingUser.id);
      return ok({ success: true, alreadyConfirmed: true });
    }

    if (inviteRole === 'child' && inviteData?.user?.id) {
      await seedChoresIfNeeded(adminClient, inviteData.user.id);
    }

    return ok({ success: true });

  } catch (err) {
    return ok({ error: 'Unexpected error: ' + String(err) });
  }
});
