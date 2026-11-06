import React from 'react'
import { formatDuration, formatClockTime } from '../../services/dashboardService.js'

export function SessionStatsCards({
  sessionDurationSecs = 0,
  sessionStartSecs = 0,
  uptimeSecs = 0,
  activeSecs = 0,
  idleSecs = 0,
  currentApp = '',
  isIdle = false,
}) {
  const totalScreenTime = activeSecs + idleSecs
  const activePct = totalScreenTime > 0 ? Math.round((activeSecs / totalScreenTime) * 100) : 100
  const idlePct = 100 - activePct

  return (
    <div className="stats-cards-grid">
      {/* Card 1: Current Session */}
      <div className="dashboard-card stat-metric-card stat-card-session">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Current Session</span>
          <span className="live-status-pill">
            <span className="status-dot-pulse" /> Live
          </span>
        </div>

        <div className="stat-main-number text-neon-purple">
          {formatDuration(sessionDurationSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">🕰️</span>
          <span className="footer-text">
            Since {formatClockTime(sessionStartSecs) || 'Startup'}
          </span>
        </div>
      </div>

      {/* Card 2: Laptop Uptime */}
      <div className="dashboard-card stat-metric-card stat-card-uptime">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Laptop Uptime</span>
          <span className="spooky-pill pill-violet">Fedora Linux</span>
        </div>

        <div className="stat-main-number text-lavender">
          {formatDuration(uptimeSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">⚡</span>
          <span className="footer-text">
            Time since laptop powered on
          </span>
        </div>
      </div>

      {/* Card 3: Active Screen Time */}
      <div className="dashboard-card stat-metric-card stat-card-active">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Active Screen Time</span>
          <span className="spooky-pill pill-green">
            {activePct}% Engaged
          </span>
        </div>

        <div className="stat-main-number text-glow">
          {formatDuration(activeSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">🎯</span>
          <span className="footer-text">
            {isIdle ? 'Currently Idle' : currentApp ? `Working in ${currentApp}` : 'Active on desktop'}
          </span>
        </div>
      </div>

      {/* Card 4: Idle / Away Time */}
      <div className="dashboard-card stat-metric-card stat-card-idle">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Idle / Away Time</span>
          <span className="spooky-pill pill-dim">
            {idlePct}% Away
          </span>
        </div>

        <div className="stat-main-number text-dim-purple">
          {formatDuration(idleSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">🌙</span>
          <span className="footer-text">
            Screen idle or user away
          </span>
        </div>
      </div>
    </div>
  )
}

