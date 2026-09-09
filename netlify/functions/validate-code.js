// Called by the patient app at sign-in. Checks whether the entered code
// exists and is active. Never receives or stores any patient-identifying
// information — just the code string itself.
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let code;
  try {
    ({ code } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Bad request' }) };
  }
  if (!code || typeof code !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Missing code' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // secret key, server-side only — never exposed to the app
  );

  const normalized = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('access_codes')
    .select('id, status, redemption_count')
    .eq('code', normalized)
    .maybeSingle();

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'Server error' }) };
  }
  if (!data || data.status !== 'active') {
    return { statusCode: 200, body: JSON.stringify({ valid: false }) };
  }

  // Record that the code was used (for staff visibility only — no patient identity attached)
  await supabase
    .from('access_codes')
    .update({
      redemption_count: (data.redemption_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return { statusCode: 200, body: JSON.stringify({ valid: true }) };
};
