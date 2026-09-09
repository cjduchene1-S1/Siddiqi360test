// Admin-only. Creates one new random access code. Called from admin.html.
// Protected by ADMIN_SECRET — a password-like value you set in Netlify's
// environment variables and share only with office staff who manage codes.
const { createClient } = require('@supabase/supabase-js');

function makeCode() {
  // Avoids visually confusing characters (0/O, 1/I/L) so staff can read codes
  // off a printed page without ambiguity.
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = 'SID-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const adminKey = event.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  let note = '';
  try {
    ({ note } = JSON.parse(event.body || '{}'));
  } catch (e) { /* note is optional */ }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Retry a few times in the extremely unlikely event of a random collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const { data, error } = await supabase
      .from('access_codes')
      .insert({ code, note: note || null })
      .select('code, created_at')
      .single();

    if (!error) {
      return { statusCode: 200, body: JSON.stringify({ code: data.code, created_at: data.created_at }) };
    }
    if (error.code !== '23505') { // not a unique-constraint collision — a real error
      return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
  }
  return { statusCode: 500, body: JSON.stringify({ error: 'Could not generate a unique code, try again' }) };
};
