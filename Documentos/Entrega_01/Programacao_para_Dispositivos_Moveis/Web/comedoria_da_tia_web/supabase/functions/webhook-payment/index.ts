// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // TODO: validar assinatura do PSP
  const event = await req.json().catch(() => null);
  const chargeId = event?.chargeId as string | undefined;
  const status = event?.status as string | undefined;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (chargeId && status === "approved") {
    await supabase
      .from("orders")
      .update({ payment_status: "approved", status: "paid" })
      .eq("external_id", chargeId);
  } else if (chargeId && status === "failed") {
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("external_id", chargeId);
  }

  return new Response("ok");
});
