// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Item = { product_id: string; qty: number };

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json().catch(() => null);
  const items: Item[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return new Response(JSON.stringify({ error: "items required" }), { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // para escrever orders
  );

  // Preços
  const { data: prods, error: e1 } = await supabase
    .from("products_public")
    .select("id, price")
    .in("id", items.map((i) => i.product_id));
  if (e1) return new Response(JSON.stringify({ error: e1.message }), { status: 500 });

  // Custos
  const { data: costs } = await supabase
    .from("product_cost_calc")
    .select("product_id, cost_from_recipe")
    .in("product_id", items.map((i) => i.product_id));

  const costMap = new Map<string, number>((costs ?? []).map((c: any) => [c.product_id, Number(c.cost_from_recipe)]));
  const priceMap = new Map<string, number>(prods.map((p: any) => [p.id, Number(p.price)]));

  let total: number = 0;
  const snapshotItems = items.map((i) => {
    const unit_price = Number(priceMap.get(i.product_id) ?? 0);
    const unit_cost = Number(costMap.get(i.product_id) ?? 0);
    const line_total = unit_price * Number(i.qty);
    total += line_total;
    return { ...i, unit_price, unit_cost, total: line_total };
  });

  // Pedido
  const { data: order, error: e2 } = await supabase
    .from("orders")
    .insert({ total_amount: total, provider: "pix", status: "pending", payment_status: "initiated" })
    .select("id")
    .single();
  if (e2) return new Response(JSON.stringify({ error: e2.message }), { status: 500 });

  // Itens
  const toInsert = snapshotItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    qty: i.qty,
    unit_price: i.unit_price,
    unit_cost: i.unit_cost,
    total: i.total,
  }));
  const { error: e3 } = await supabase.from("order_items").insert(toInsert);
  if (e3) return new Response(JSON.stringify({ error: e3.message }), { status: 500 });

  // PIX (placeholder)
  const brcode = "00020126..."; // gere via seu PSP
  await supabase.from("orders").update({ qr_code: brcode }).eq("id", order.id);

  return new Response(JSON.stringify({ order_id: order.id, amount: total, brcode }), {
    headers: { "Content-Type": "application/json" },
  });
});
