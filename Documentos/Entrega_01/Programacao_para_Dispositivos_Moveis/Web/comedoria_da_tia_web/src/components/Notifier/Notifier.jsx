import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import './Notifier.css'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const POSITIONS = {
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
}

export default function Notifier({
  open,
  type = 'info', // 'success' | 'error' | 'info' | 'warning'
  title,
  message,
  onClose,
  duration = 3500,
  position = 'top-right',
}) {
  const containerRef = useRef(null)
  const Icon = ICONS[type] || Info

  // Auto-close timer
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(id)
  }, [open, duration, onClose])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Click outside
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  const stylePos = POSITIONS[position] || POSITIONS['top-right']

  return createPortal(
    <div className="notifier-root" style={stylePos} aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            ref={containerRef}
            className={`notifier-card variant-${type}`}
            role={type === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.7 }}
          >
            <div className="notifier-icon">
              <Icon className="icon" aria-hidden="true" />
            </div>
            <div className="notifier-content">
              {title && <div className="notifier-title">{title}</div>}
              {message && <div className="notifier-message">{message}</div>}
            </div>
            <button className="notifier-close" onClick={() => onClose?.()} aria-label="Fechar alerta">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}