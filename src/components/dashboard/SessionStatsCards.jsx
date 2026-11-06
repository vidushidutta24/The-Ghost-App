import React from 'react'
import { formatDuration, formatClockTime } from '../../services/dashboardService.js'

export function SessionStatsCards({
  sessionDurationSecs = 0,
  sessionStartSecs = 0,
  uptimeSecs = 0,
  activeSecs = 0,
  idleSecs = 0,
  weeklyTotalSecs = 0,
  dailyAverageSecs = 0,
  todayTotalSecs = 0,
  currentApp = '',
  isIdle = false,
}) {
  const effectiveTodayTotal = todayTotalSecs > 0 ? todayTotalSecs : activeSecs + idleSecs
  const activePct =
    effectiveTodayTotal > 0 ? Math.round((activeSecs / effectiveTodayTotal) * 100) : 100

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

      {/* Card 2: Today's Total Screen Time */}
      <div className="dashboard-card stat-metric-card stat-card-today-total">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Today’s Screen Time</span>
          <span className="spooky-pill pill-green">
            {activePct}% Engaged
          </span>
        </div>

        <div className="stat-main-number text-glow">
          {formatDuration(effectiveTodayTotal)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">🎯</span>
          <span className="footer-text">
            {formatDuration(activeSecs)} active · {formatDuration(idleSecs)} away
          </span>
        </div>
      </div>

      {/* Card 3: Weekly Total Screen Time */}
      <div className="dashboard-card stat-metric-card stat-card-weekly">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Weekly Screen Time</span>
          <span className="spooky-pill pill-violet">This Week</span>
        </div>

        <div className="stat-main-number text-lavender">
          {formatDuration(weeklyTotalSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">📅</span>
          <span className="footer-text">
            Avg: {formatDuration(dailyAverageSecs)} / day
          </span>
        </div>
      </div>

      {/* Card 4: Laptop Uptime */}
      <div className="dashboard-card stat-metric-card stat-card-uptime">
        <div className="stat-card-glow-edge" />
        <div className="stat-header">
          <span className="stat-label">Laptop Uptime</span>
          <span className="spooky-pill pill-dim">Fedora Linux</span>
        </div>

        <div className="stat-main-number text-dim-purple">
          {formatDuration(uptimeSecs)}
        </div>

        <div className="stat-footer">
          <span className="footer-clock-icon">⚡</span>
          <span className="footer-text">
            {isIdle ? 'Laptop idle' : currentApp ? `Active: ${currentApp}` : 'Powered on'}
          </span>
        </div>
      </div>
    </div>
  )
}
