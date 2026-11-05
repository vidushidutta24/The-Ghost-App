import { useEffect } from 'react'
import { ALL_MOODS, MOOD_CONFIG } from '../constants/moods.js'
import '../styles/mood-selector.css'

/**
 * MoodSelector — debug overlay for testing Ghost emotion states.
 *
 * Shows a row of mood buttons. Active mood is highlighted.
 * Keyboard shortcuts: 1=neutral, 2=happy, 3=sad, 4=angry, 5=surprised, 6=sleepy
 *
 * This component must NOT have data-tauri-drag-region (clicks need to work).
 * Remove or gate behind a debug flag when shipping a production build.
 */
function MoodSelector({ mood, setMood }) {
  // Keyboard shortcuts: 1–5
  useEffect(() => {
    const handleKey = (e) => {
      const idx = parseInt(e.key, 10) - 1
      if (idx >= 0 && idx < ALL_MOODS.length) {
        setMood(ALL_MOODS[idx])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setMood])

  return (
    <div className="mood-selector" onClick={(e) => e.stopPropagation()}>
      {ALL_MOODS.map((m, idx) => {
        const cfg = MOOD_CONFIG[m]
        return (
          <button
            key={m}
            className={`mood-btn${mood === m ? ' mood-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setMood(m)
            }}
            title={`${cfg.label} (${idx + 1})`}
            aria-label={cfg.label}
          >
            <span className="mood-btn__emoji">{cfg.emoji}</span>
            <span className="mood-btn__label">{cfg.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default MoodSelector

