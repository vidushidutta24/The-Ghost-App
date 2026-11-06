import { useState, useCallback, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import Ghost from './components/Ghost.jsx'
import MoodSelector from './components/MoodSelector.jsx'
import ModeToggle from './components/ModeToggle.jsx'
import WelcomeMessage from './components/WelcomeMessage.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
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
  const [inWindowDashboard, setInWindowDashboard] = useState(false)
  const [isDashboardWindow, setIsDashboardWindow] = useState(false)
  const [isPinned, setIsPinned]           = useState(false)      // always-on-top toggle
  const { mood, setMood }                 = useGhostMood()
  const activity                          = useActivityState()
  const sessionCtx                        = useSessionContext()  // null until Rust responds

  // ── Detect if this window is the dedicated Dashboard window or floating Ghost ──
  useEffect(() => {
    try {
      const win = getCurrentWindow()
      if (win && win.label === 'dashboard') {
        setIsDashboardWindow(true)
      } else if (win && win.label === 'ghost') {
        invoke('show_ghost_window').catch(() => {})
      }
    } catch {
      // In browser preview
    }

    const handleHash = () => {
      if (window.location.hash === '#dashboard') {
        setInWindowDashboard(true)
      } else {
        setInWindowDashboard(false)
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // ── Welcome scene: set mood from session context briefly ─────────────────
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

  // ── Drag the window (floating ghost only) ─────────────────────────────────
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

  const handleTogglePin = useCallback(async () => {
    const next = !isPinned
    setIsPinned(next)
    try {
      await invoke('set_ghost_always_on_top', { alwaysOnTop: next })
    } catch (e) {
      console.warn('Failed to toggle always-on-top:', e)
    }
  }, [isPinned])

  // ── Open Dashboard: opens dedicated maximized window in Tauri, or toggles in browser ──
  const handleOpenDashboard = useCallback(async () => {
    try {
      await invoke('open_dashboard')
    } catch {
      // Fallback for browser preview
      setInWindowDashboard(true)
      window.location.hash = '#dashboard'
    }
  }, [])

  const handleCloseDashboard = useCallback(async () => {
    try {
      await invoke('close_dashboard')
    } catch {}
    setInWindowDashboard(false)
    window.location.hash = ''
  }, [])

  // ── Render Dashboard if in dashboard window or toggled ──
  if (isDashboardWindow || inWindowDashboard) {
    return <Dashboard onClose={handleCloseDashboard} />
  }

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
          onOpenDashboard={handleOpenDashboard}
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
        />
        {mode === 'debug' && (
          <MoodSelector mood={mood} setMood={setMood} />
        )}
      </div>
    </div>
  )
}

export default App
