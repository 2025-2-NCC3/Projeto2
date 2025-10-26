import { useState } from 'react'
import { Send, Loader } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import './PromotionSender.css'

export default function PromotionSender({ promotion }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const YOUR_EMAIL = "brenocostanascimento031@gmail.com"

  const sendPromotionEmails = async () => {
    if (!promotion) {
      alert('Selecione uma promoção primeiro')
      return
    }

    setSending(true)
    setResult(null)

    try {
      const emails = [YOUR_EMAIL]
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        'https://qiwlkpkgkcopdvuqkcmx.supabase.co/functions/v1/send-promo-alert',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            promotion: {
              name: promotion.name,
              price: promotion.price,
              ends_at: promotion.ends_at,
              product_id: promotion.product_id
            },
            emails: emails
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      setResult({ 
        success: true, 
        message: `✅ Email enviado!` 
      })

    } catch (error) {
      console.error('Erro ao enviar promoção:', error)
      setResult({ 
        success: false, 
        message: `❌ Erro ao enviar` 
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="promotion-sender-simple">
      <button
        onClick={sendPromotionEmails}
        disabled={sending || !promotion}
        className="send-button-simple"
        title={!promotion ? "Selecione uma promoção primeiro" : "Enviar email de teste"}
      >
        {sending ? (
          <>
            <Loader size={16} className="spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={16} />
            Enviar Promoção
          </>
        )}
      </button>

      {result && (
        <div className={`result-message-simple ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}