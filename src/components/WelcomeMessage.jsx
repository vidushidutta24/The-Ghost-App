/**
 * WelcomeMessage — speech bubble shown by the Ghost on session start.
 *
 * Fades in immediately, stays for DISPLAY_MS, then fades out.
 * Clicking it dismisses it early.
 *
 * Props:
 *   message  - { primary, secondary? } from generateWelcomeMessage()
 *   onDismiss - called when the bubble finishes (auto or manual)
 */
import { useState, useEffect } from 'react'
import '../styles/welcome-message.css'

const DISPLAY_MS  = 7000   // how long the bubble stays visible (7 seconds)
const FADE_OUT_MS = 600    // CSS fade-out duration (must match CSS)

function WelcomeMessage({ message, onDismiss }) {
  const [phase, setPhase] = useState('in')  // 'in' | 'visible' | 'out'

  useEffect(() => {
    setPhase('in')
  }, [message])

  useEffect(() => {
    if (!message) {
      onDismiss?.()
      return
    }

    // After display time, start fade-out
    const displayTimer = setTimeout(() => setPhase('out'), DISPLAY_MS)

    return () => clearTimeout(displayTimer)
  }, [message, onDismiss])

  // When fade-out finishes, notify parent
  useEffect(() => {
    if (phase !== 'out') return
    const t = setTimeout(() => onDismiss?.(), FADE_OUT_MS)
    return () => clearTimeout(t)
  }, [phase, onDismiss])

  if (!message) return null

  const handleClick = (e) => {
    e.stopPropagation()
    setPhase('out')
  }

  return (
    <div
      className={`welcome-bubble welcome-bubble--${phase}`}
      onClick={handleClick}
      title="click to dismiss"
    >
      <p className="welcome-bubble__primary">{message.primary}</p>
      {message.secondary && (
        <p className="welcome-bubble__secondary">{message.secondary}</p>
      )}
    </div>
  )
}

export default WelcomeMessage

