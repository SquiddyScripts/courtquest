import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

/** Admin write via the PIN-gated dispatcher RPC. Throws on bad PIN. */
export async function adminWrite(pin: string, action: string, payload: unknown) {
  const { data, error } = await supabase.rpc("admin_write", { pin, action, payload });
  if (error) throw new Error(error.message);
  return data;
}

/** Referee write via the tournament-code-gated dispatcher RPC. */
export async function refWrite(tournamentId: string, code: string, action: string, payload: unknown) {
  const { data, error } = await supabase.rpc("ref_write", {
    t_id: tournamentId,
    code,
    action,
    payload,
  });
  if (error) throw new Error(error.message);
  return data;
}
