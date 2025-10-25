import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { users } = await req.json()

    console.log('Enviando alerta Supabase para:', users.length, 'usuários')

    // Email SIMPLES com SMTP do Supabase
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>🚨 Promoção Hoje!</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white;">
          <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 36px; margin-bottom: 10px;">🚨🚨🚨</h1>
            <h2 style="font-size: 32px; margin-bottom: 20px;">TEM PROMOÇÃO HOJE!</h2>
            <p style="font-size: 24px; margin-bottom: 30px;">💸 CORRE LÁ! 💸</p>
            
            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin: 30px 0;">
              <p style="font-size: 20px; margin: 0;">Novos produtos em promoção disponíveis!</p>
            </div>

            <a href="${Deno.env.get('APP_URL')}/app/alunos/ofertas" 
               style="background: white; color: #FF6B6B; padding: 15px 40px; text-decoration: none; 
                      border-radius: 25px; font-weight: bold; font-size: 18px; display: inline-block;">
              👉 VER OFERTAS AGORA 👈
            </a>

            <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
              Comedoria da Tia • Não perca essa chance!
            </p>
          </div>
        </body>
      </html>
    `

    // Enviar emails usando SMTP do Supabase
    const emailPromises = users.map(user => 
      fetch('https://api.supabase.com/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          to: user.email,
          subject: '🚨 TEM PROMOÇÃO HOJE - CORRE!!!',
          html: emailHtml,
          from: 'Comedoria da Tia <noreply@supabase.com>'
        })
      })
    )

    const results = await Promise.allSettled(emailPromises)
    
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length

    console.log(`Emails enviados via Supabase: ${successful} sucesso, ${failed} falhas`)

    return new Response(
      JSON.stringify({
        message: `Alertas enviados: ${successful} sucesso, ${failed} falhas`,
        successful,
        failed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})