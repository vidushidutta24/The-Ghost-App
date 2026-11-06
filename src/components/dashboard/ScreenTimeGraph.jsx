import React, { useState } from 'react'
import { formatDuration } from '../../services/dashboardService.js'

export function ScreenTimeGraph({ hourlyStats = [], activeTotalSecs = 0, idleTotalSecs = 0 }) {
  const [hoveredHour, setHoveredHour] = useState(null)

  // Find max hour duration for proportional bar heights (cap at 3600s = 1 hour)
  const maxSecs = Math.max(
    3600,
    ...hourlyStats.map((h) => (h.active_secs || 0) + (h.idle_secs || 0))
  )

  // Find peak hour
  let peakHour = null
  let maxActive = 0
  hourlyStats.forEach((h) => {
    if (h.active_secs > maxActive) {
      maxActive = h.active_secs
      peakHour = h
    }
  })

  return (
    <div className="dashboard-card screen-time-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">📊</span>
          <div>
            <h3 className="card-title">Daily Screen Time Timeline</h3>
            <p className="card-subtitle">24-hour active vs. idle desktop distribution</p>
          </div>
        </div>

        <div className="graph-badges">
          {peakHour && peakHour.active_secs > 0 && (
            <span className="spooky-pill pill-purple">
              ✦ Peak Focus: {peakHour.label} ({formatDuration(peakHour.active_secs)})
            </span>
          )}
          <div className="legend-group">
            <span className="legend-item">
              <span className="legend-dot dot-active" /> Active
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-idle" /> Idle
            </span>
          </div>
        </div>
      </div>

      {/* Hourly Bar Visualization */}
      <div className="graph-container">
        <div className="bars-track">
          {hourlyStats.map((item) => {
            const activeH = Math.min(100, (item.active_secs / maxSecs) * 100)
            const idleH = Math.min(100, (item.idle_secs / maxSecs) * 100)
            const isHovered = hoveredHour === item.hour

            return (
              <div
                key={item.hour}
                className={`hour-column ${item.is_current_hour ? 'current-hour' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredHour(item.hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="bar-tooltip">
                    <div className="tooltip-title">{item.label}</div>
                    <div className="tooltip-line active-line">
                      <span>Active:</span> <strong>{formatDuration(item.active_secs)}</strong>
                    </div>
                    {item.idle_secs > 0 && (
                      <div className="tooltip-line idle-line">
                        <span>Idle:</span> <strong>{formatDuration(item.idle_secs)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Stacked Bars */}
                <div className="bar-fill-wrapper">
                  {idleH > 0 && (
                    <div
                      className="bar-segment bar-segment-idle"
                      style={{ height: `${idleH}%` }}
                    />
                  )}
                  {activeH > 0 ? (
                    <div
                      className="bar-segment bar-segment-active"
                      style={{ height: `${activeH}%` }}
                    />
                  ) : (
                    <div className="bar-zero-indicator" />
                  )}
                </div>

                <span className="hour-axis-label">
                  {item.hour % 3 === 0 ? item.label.replace(' ', '') : '·'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="graph-footer-summary">
        <div className="summary-stat">
          <span className="summary-label">Total Active Screen Time</span>
          <span className="summary-val text-neon-purple">{formatDuration(activeTotalSecs)}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Total Away / Idle</span>
          <span className="summary-val text-lavender">{formatDuration(idleTotalSecs)}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Active Ratio</span>
          <span className="summary-val text-glow">
            {activeTotalSecs + idleTotalSecs > 0
              ? `${Math.round((activeTotalSecs / (activeTotalSecs + idleTotalSecs)) * 100)}%`
              : '100%'}
          </span>
        </div>
      </div>
    </div>
  )
}

