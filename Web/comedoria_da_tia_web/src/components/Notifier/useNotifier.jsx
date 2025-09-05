import React, { useCallback, useMemo, useState } from 'react'
import Notifier from './Notifier'

export function useNotifier() {
  const [state, setState] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    duration: 3500,
    position: 'top-right',
  })

  // fecha o popup
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  // dispara um popup
  const notify = useCallback((opts = {}) => {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 3500,
      position = 'top-right',
    } = opts
    setState({ open: true, type, title, message, duration, position })
  }, [])

  // componente host memoizado (estável) que lê o estado do hook
  const NotifierHost = useMemo(
    () =>
      function NotifierHost() {
        return (
          <Notifier
            open={state.open}
            type={state.type}
            title={state.title}
            message={state.message}
            duration={state.duration}
            position={state.position}
            onClose={close}
          />
        )
      },
    [state, close]
  )

  return { notify, NotifierHost }
}
