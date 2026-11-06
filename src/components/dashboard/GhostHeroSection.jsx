import React, { useState } from 'react'
import Ghost from '../Ghost.jsx'
import { formatDuration } from '../../services/dashboardService.js'

export function GhostHeroSection({
  mood = 'happy',
  currentApp = '',
  sessionDurationSecs = 0,
  activeSecs = 0,
  uptimeSecs = 0,
}) {
  const [ghostPoked, setGhostPoked] = useState(false)

  // Generate Ghost's spooky thought/commentary based on real stats
  const getGhostDialogue = () => {
    if (ghostPoked) {
      return 'heehee! tickles... i am always hovering nearby.'
    }
    if (currentApp) {
      return `observing you inside ${currentApp}... we've accomplished ${formatDuration(activeSecs)} of deep work today.`
    }
    if (sessionDurationSecs > 10800) {
      return `marathon session detected (${formatDuration(sessionDurationSecs)}). remember to blink and sip water, friend.`
    }
    return `welcome to the sanctuary. your laptop has been alive for ${formatDuration(uptimeSecs)}.`
  }

  const handleGhostClick = () => {
    setGhostPoked(true)
    setTimeout(() => setGhostPoked(false), 4000)
  }

  return (
    <div className="ghost-hero-chamber">
      {/* Background celestial moon and aura */}
      <div className="chamber-celestial-moon" />
      <div className="chamber-mist-fog" />

      {/* Floating Ghost Container */}
      <div className="ghost-chamber-center">
        <div className="ghost-interactive-avatar" onClick={handleGhostClick} title="Click to greet Ghost">
          <div className="ghost-glow-halo" />
          <Ghost mood={mood} />
        </div>

        {/* Companion Speech Bubble in Room */}
        <div className="chamber-speech-bubble">
          <span className="bubble-quote-glyph">❝</span>
          <p className="bubble-text">{getGhostDialogue()}</p>
          <div className="bubble-meta">
            <span className="ghost-name-tag">✦ DIGITAL GHOST</span>
            <span className="mood-badge-tag">Mood: {mood}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

