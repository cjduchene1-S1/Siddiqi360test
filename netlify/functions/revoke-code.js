// Admin-only. Marks a code as revoked so it can no longer be used to sign in
// (e.g. issued to the wrong patient, or typo'd on the discharge paperwork).
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const adminKey = event.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  let code;
  try {
    ({ code } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code' }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from('access_codes')
    .update({ status: 'revoked' })
    .eq('code', code.trim().toUpperCase());

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
