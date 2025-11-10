// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interfaces para tipagem
interface Promotion {
  name: string
  price: number | string
  ends_at?: string
}

interface RequestBody {
  promotion: Promotion
  emails: string[]
}

interface ResendError {
  message: string
  name?: string
  statusCode?: number
}

// Função auxiliar para formatar dinheiro
function formatMoney(amount: number | string): string {
  if (!amount) return "R$ 0,00"
  const num = Number(amount)
  if (isNaN(num)) return "R$ 0,00"
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { promotion, emails }: RequestBody = await req.json()

    console.log('📧 Enviando promoção para:', emails?.length || 0, 'usuários')
    console.log('Promoção:', promotion)

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum email fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!promotion) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma promoção fornecida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'Comedoria da Tia <nao-responda@resend.dev>',
      to: emails,
      subject: `🎉 PROMOÇÃO RELÂMPAGO: ${promotion.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Promoção Relâmpago - Comedoria da Tia</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669;">🍕 Comedoria da Tia</h1>
              <h2 style="color: #dc2626;">🚨 PROMOÇÃO RELÂMPAGO!</h2>
            </div>

            <div style="background: #fef2f2; padding: 25px; border-radius: 12px; border: 2px solid #dc2626;">
              <h3 style="margin-top: 0; color: #dc2626; font-size: 24px;">${promotion.name}</h3>
              <div style="text-align: center;">
                <p style="font-size: 32px; font-weight: bold; color: #dc2626; margin: 15px 0;">
                  ${formatMoney(promotion.price)}
                </p>
                <span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                  ⏰ TEMPO LIMITADO
                </span>
              </div>
              
              ${promotion.ends_at ? `
                <p style="color: #666; text-align: center; margin-top: 15px;">
                  <strong>⏰ Válida até:</strong> ${new Date(promotion.ends_at).toLocaleDateString('pt-BR')} às ${new Date(promotion.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              ` : ''}

              <p style="color: #666; text-align: center; margin-top: 10px;">
                <strong>📍 Local:</strong> Cantina da Faculdade
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #dc2626; color: white; padding: 16px 32px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                🏃‍♂️ CORRA PARA A CANTINA! 🏃‍♀️
              </div>
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                ⚠️ Promoção válida apenas na cantina física • Não perca essa chance!
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; text-align: center;">
              <p style="font-size: 12px; color: #999;">
                Comedoria da Tia • Cantina da Faculdade • Email automático
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('✅ Emails enviados com sucesso para:', emails.length, 'usuários')

    return new Response(
      JSON.stringify({ 
        message: `Promoção enviada para ${emails.length} usuários`,
        success: true,
        usersCount: emails.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: unknown) {
    console.error('💥 Erro na function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})