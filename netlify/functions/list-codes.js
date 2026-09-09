// Admin-only. Returns every code and its status for the admin table view.
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const adminKey = event.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('access_codes')
    .select('code, status, note, created_at, redemption_count, last_used_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
  return { statusCode: 200, body: JSON.stringify({ codes: data }) };
};
