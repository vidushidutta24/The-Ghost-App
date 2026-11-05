import { useState, useCallback, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import Ghost from './components/Ghost.jsx'
import MoodSelector from './components/MoodSelector.jsx'
import ModeToggle from './components/ModeToggle.jsx'
import WelcomeMessage from './components/WelcomeMessage.jsx'
import { useGhostMood } from './hooks/useGhostMood.js'
import { useActivityState } from './services/activityMonitor.js'
import { useSessionContext } from './services/sessionManager.js'
import { deriveContext } from './services/contextMapper.js'
import { contextToMood } from './services/moodMapper.js'
import { generateWelcomeMessage, welcomeMood } from './services/welcomeMessages.js'
import './styles/app.css'

function App() {
  const [isDragging, setIsDragging]       = useState(false)
  const [mode, setMode]                   = useState('auto')     // 'auto' | 'debug'
  const [showWelcome, setShowWelcome]     = useState(true)       // cleared after bubble dismisses
  const { mood, setMood }                 = useGhostMood()
  const activity                          = useActivityState()
  const sessionCtx                        = useSessionContext()  // null until Rust responds

  // ── Show window on mount (Wayland flash-prevention) ──────────────────────
  useEffect(() => {
    invoke('show_ghost_window').catch(() => {})
  }, [])

  // ── Welcome scene: set mood from session context briefly ─────────────────
  // Once session context arrives, show the welcome expression until the bubble
  // is dismissed. After that, AUTO mode takes back over.
  useEffect(() => {
    if (!sessionCtx || !showWelcome) return
    const wm = welcomeMood(sessionCtx)
    setMood(wm)
  }, [sessionCtx, showWelcome, setMood])

  // ── AUTO mode: activity drives mood (after welcome is dismissed) ──────────
  useEffect(() => {
    if (mode !== 'auto') return
    if (showWelcome) return   // let the welcome scene hold the mood first
    const context = deriveContext(activity)
    setMood(contextToMood(context))
  }, [activity, mode, showWelcome, setMood])

  // ── Drag the window ───────────────────────────────────────────────────────
  const handleMouseDown = useCallback(async (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    try {
      await getCurrentWindow().startDragging()
    } catch {
      // no-op in browser dev mode
    }
    setIsDragging(false)
  }, [])

  const handleDismiss = useCallback(() => {
    setShowWelcome(false)
  }, [])

  const handleGreet = useCallback(() => {
    setShowWelcome(true)
  }, [])

  const welcomeMsg = showWelcome ? generateWelcomeMessage(sessionCtx) : null

  return (
    <div
      className={`ghost-container${isDragging ? ' dragging' : ''}`}
      onMouseDown={handleMouseDown}
      data-tauri-drag-region
    >
      {/* Speech bubble — absolutely positioned above the ghost */}
      {welcomeMsg && (
        <WelcomeMessage
          key={welcomeMsg.primary + (welcomeMsg.secondary || '')}
          message={welcomeMsg}
          onDismiss={handleDismiss}
        />
      )}

      <div onClick={handleGreet}>
        <Ghost mood={mood} />
      </div>

      {/* Control strip */}
      <div className="ghost-controls" onClick={(e) => e.stopPropagation()}>
        <ModeToggle
          mode={mode}
          onToggle={setMode}
          activityInfo={activity}
          onGreet={handleGreet}
        />
        {mode === 'debug' && (
          <MoodSelector mood={mood} setMood={setMood} />
        )}
      </div>
    </div>
  )
}

export default App
