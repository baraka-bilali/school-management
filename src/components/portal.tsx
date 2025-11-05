'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [el] = useState(() => typeof document !== 'undefined' ? document.createElement('div') : null)

  useEffect(() => {
    if (!el) return
    el.setAttribute('data-portal', 'true')
    document.body.appendChild(el)
    setMounted(true)
    return () => {
      try { document.body.removeChild(el) } catch (e) {}
    }
  }, [el])

  if (!mounted || !el) return null
  return createPortal(children, el)
}
