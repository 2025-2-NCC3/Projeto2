import { useState } from 'react'
import { Send, Loader, Users } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import './PromotionSender.css'

export default function PromotionSender({ promotion }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const sendPromotionEmails = async () => {
    if (!promotion) {
      alert('Selecione uma promoção primeiro')
      return
    }

    setSending(true)
    setResult(null)

    try {
      // ✅ 1. BUSCAR TODOS OS EMAILS DA TABELA PROFILES
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('is_active', true) // Apenas usuários ativos
        .not('email', 'is', null) // Apenas emails válidos

      if (profilesError) {
        throw new Error(`Erro ao buscar emails: ${profilesError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('Nenhum usuário encontrado para enviar promoção')
      }

      // ✅ 2. EXTRAIR APENAS OS EMAILS
      const emails = profiles.map(profile => profile.email).filter(email => email)
      
      console.log(`📧 Enviando para ${emails.length} usuários:`, emails)

      // ✅ 3. CHAMAR A EDGE FUNCTION
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
        message: `✅ Promoção enviada para ${emails.length} usuários!` 
      })

    } catch (error) {
      console.error('Erro ao enviar promoção:', error)
      setResult({ 
        success: false, 
        message: `❌ ${error.message}` 
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
        title={!promotion ? "Selecione uma promoção primeiro" : `Enviar promoção para todos os usuários`}
      >
        {sending ? (
          <>
            <Loader size={16} className="spin" />
            Enviando...
          </>
        ) : (
          <>
            <Users size={16} />
            Enviar para Todos
          </>
        )}
      </button>

      {result && (
        <div className={`result-message-simple ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}

      {/* ✅ INFO: Mostrar quantos usuários serão atingidos */}
      <div className="user-count-info">
        <small>
          📊 Esta ação enviará a promoção para todos os usuários ativos cadastrados
        </small>
      </div>
    </div>
  )
}