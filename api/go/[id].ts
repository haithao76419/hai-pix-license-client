// api/go/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send('Missing id');

    const { data, error } = await supabaseAdmin
      .from('redirect_tokens')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).send('Not found');

    // check expiry
    if (new Date(data.expires_at) < new Date()) {
      // delete stale token
      await supabaseAdmin.from('redirect_tokens').delete().eq('id', id);
      return res.status(410).send('Expired');
    }

    const target = data.target;

    // delete token after use
    await supabaseAdmin.from('redirect_tokens').delete().eq('id', id);

    // redirect user (302) — this will change the tab location to target
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, target);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal error');
  }
}
