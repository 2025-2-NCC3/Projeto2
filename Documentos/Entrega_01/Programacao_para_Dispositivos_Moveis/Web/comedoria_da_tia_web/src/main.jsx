// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- DEBUG TEMPORÁRIO — REMOVER DEPOIS ---
// Ative/Desative rápido só mudando este valor:
const ENABLE_REST_WATCH = true

if (import.meta.env.DEV && ENABLE_REST_WATCH) {
  const MATCH = /\/rest\/v1\//i

  // fetch
  const _fetch = window.fetch
  window.fetch = async (input, init = {}) => {
    const url = String(input)
    if (MATCH.test(url)) {
      console.warn('[REST via fetch]', url, 'headers=', init?.headers)
      console.trace()
    }
    return _fetch(input, init)
  }

  // XHR
  const _open = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (MATCH.test(String(url))) {
      console.warn('[REST via XHR]', method, url)
      console.trace()
    }
    return _open.call(this, method, url, ...rest)
  }

  // Observa src/href em <img>, <script>, <link>, <iframe>
  const observe = (proto, attr) => {
    const desc = Object.getOwnPropertyDescriptor(proto, attr)
    if (!desc?.set) return
    Object.defineProperty(proto, attr, {
      set(v) {
        if (MATCH.test(String(v))) {
          console.warn(`[REST via ${this?.constructor?.name}.${attr}]`, v, this)
          console.trace()
        }
        return desc.set.call(this, v)
      },
      get() { return desc.get.call(this) }
    })
  }
  ;[HTMLImageElement, HTMLScriptElement, HTMLLinkElement, HTMLIFrameElement].forEach(Ctor => {
    if (Ctor) { observe(Ctor.prototype, 'src'); observe(Ctor.prototype, 'href') }
  })

  // Também pega setAttribute em src/href
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'href')) {
        const v = m.target.getAttribute(m.attributeName)
        if (v && MATCH.test(v)) {
          console.warn(`[REST via setAttribute ${m.target.tagName}.${m.attributeName}]`, v, m.target)
          console.trace()
        }
      }
    }
  })
  mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['src','href'] })
}
// --- FIM DEBUG ---

ReactDOM.createRoot(document.getElementById('root')).render(
  // Se quiser evitar efeitos duplicados durante a depuração:
  // <App />
  <React.StrictMode>
    <App />
  </React.StrictMode>
)