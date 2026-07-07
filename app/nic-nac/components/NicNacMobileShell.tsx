'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { NicNacGlyph } from './NicNacGlyph'
import styles from './NicNacMobileShell.module.css'

export function NicNacMobileShell({
  open,
  onOpen,
  onClose,
  children,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}) {
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const hasMountedRef = useRef(false)
  const wasOpenRef = useRef(open)

  // Body scroll lock + Escape close + focus trap when modal is open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const root = modalRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  // Return focus to bubble on close.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      wasOpenRef.current = open
      return
    }

    if (wasOpenRef.current && !open && bubbleRef.current) {
      bubbleRef.current.focus()
    }

    wasOpenRef.current = open
  }, [open])

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        className={styles.bubble}
        onClick={onOpen}
        aria-label="Open Nic-Nac"
        aria-expanded={open}
      >
        <NicNacGlyph size={28} />
      </button>
      {open ? (
        <div
          className={styles.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          role="presentation"
        >
          <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-label="Nic-Nac">
            {children}
          </div>
        </div>
      ) : null}
    </>
  )
}
