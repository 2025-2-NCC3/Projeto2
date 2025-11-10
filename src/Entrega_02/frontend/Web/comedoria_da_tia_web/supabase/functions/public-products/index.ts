// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_ANON_KEY")!; // ou service role se preferir
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("products_public")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});
