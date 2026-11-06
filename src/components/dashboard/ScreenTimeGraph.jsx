import React, { useState } from 'react'
import { formatDuration } from '../../services/dashboardService.js'

export function ScreenTimeGraph({
  weeklyStats = [],
  weeklyTotalSecs = 0,
  weeklyActiveSecs = 0,
  weeklyIdleSecs = 0,
  dailyAverageSecs = 0,
  todayTotalSecs = 0,
  hourlyStats = [],
  activeTotalSecs = 0,
  idleTotalSecs = 0,
}) {
  const [viewMode, setViewMode] = useState('week') // 'week' | 'today'
  const [hoveredDay, setHoveredDay] = useState(null)
  const [hoveredHour, setHoveredHour] = useState(null)

  // ── Weekly Calculations ──
  // Calculate max day total for proportional heights (minimum 6 hours for scale)
  const maxDaySecs = Math.max(
    21600, // 6h minimum baseline
    ...weeklyStats.map((d) => (d.total_secs || 0))
  )

  // Peak day of this week
  let peakDay = null
  let maxDayTotal = 0
  weeklyStats.forEach((d) => {
    if ((d.total_secs || 0) > maxDayTotal) {
      maxDayTotal = d.total_secs
      peakDay = d
    }
  })

  // ── Today Hourly Calculations ──
  const maxHourSecs = Math.max(
    3600,
    ...hourlyStats.map((h) => (h.active_secs || 0) + (h.idle_secs || 0))
  )

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
      {/* ── Card Header ── */}
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">{viewMode === 'week' ? '📅' : '📊'}</span>
          <div>
            <h3 className="card-title">
              {viewMode === 'week' ? 'Weekly Screen Time' : 'Today’s Hourly Timeline'}
            </h3>
            <p className="card-subtitle">
              {viewMode === 'week'
                ? 'Daily laptop screen time & previous records across this week'
                : '24-hour active vs. idle desktop distribution for today'}
            </p>
          </div>
        </div>

        <div className="graph-badges">
          {/* View Mode Toggle */}
          <div className="graph-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              ✦ Week (7 Days)
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'today' ? 'active' : ''}`}
              onClick={() => setViewMode('today')}
            >
              Today (24h)
            </button>
          </div>

          {/* Peak Badge */}
          {viewMode === 'week' && peakDay && peakDay.total_secs > 0 && (
            <span className="spooky-pill pill-purple">
              ★ Peak: {peakDay.day_name} ({formatDuration(peakDay.total_secs)})
            </span>
          )}

          {viewMode === 'today' && peakHour && peakHour.active_secs > 0 && (
            <span className="spooky-pill pill-purple">
              ★ Peak: {peakHour.label} ({formatDuration(peakHour.active_secs)})
            </span>
          )}

          {/* Legend */}
          <div className="legend-group">
            <span className="legend-item">
              <span className="legend-dot dot-active" /> Active
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-idle" /> Away / Idle
            </span>
          </div>
        </div>
      </div>

      {/* ── VIEW 1: WEEKLY SCREEN TIME (7 DAYS) ── */}
      {viewMode === 'week' && (
        <div className="weekly-graph-container">
          <div className="week-bars-track">
            {weeklyStats.map((day) => {
              const activeH = Math.min(100, (day.active_secs / maxDaySecs) * 100)
              const idleH = Math.min(100, (day.idle_secs / maxDaySecs) * 100)
              const isHovered = hoveredDay?.date === day.date
              const hasData = day.total_secs > 0

              return (
                <div
                  key={day.date}
                  className={`week-day-column ${day.is_today ? 'day-today' : ''} ${
                    day.is_past ? 'day-past' : ''
                  } ${day.is_future ? 'day-future' : ''} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day Total Badge at top of column */}
                  <div className="day-total-badge">
                    {hasData ? (
                      <span className="total-badge-text">{formatDuration(day.total_secs)}</span>
                    ) : day.is_future ? (
                      <span className="total-badge-placeholder">—</span>
                    ) : (
                      <span className="total-badge-placeholder">0m</span>
                    )}
                  </div>

                  {/* Tooltip on hover */}
                  {isHovered && hasData && (
                    <div className="week-bar-tooltip">
                      <div className="tooltip-header">
                        <span className="tooltip-title">{day.full_label}</span>
                        {day.is_today && <span className="tooltip-tag tag-today">TODAY</span>}
                        {day.is_past && <span className="tooltip-tag tag-past">PAST RECORD</span>}
                      </div>

                      <div className="tooltip-divider" />

                      <div className="tooltip-line highlight-line">
                        <span>Total Laptop Time:</span>
                        <strong>{formatDuration(day.total_secs)}</strong>
                      </div>

                      <div className="tooltip-line active-line">
                        <span>Active Usage:</span>
                        <strong>{formatDuration(day.active_secs)}</strong>
                      </div>

                      {day.idle_secs > 0 && (
                        <div className="tooltip-line idle-line">
                          <span>Away / Idle:</span>
                          <strong>{formatDuration(day.idle_secs)}</strong>
                        </div>
                      )}

                      {day.top_app && (
                        <div className="tooltip-top-app">
                          <span>Primary Focus:</span>
                          <strong>{day.top_app}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stacked Vertical Bar */}
                  <div className="week-bar-fill-wrapper">
                    {idleH > 0 && (
                      <div
                        className="bar-segment bar-segment-idle"
                        style={{ height: `${idleH}%` }}
                        title={`Idle: ${formatDuration(day.idle_secs)}`}
                      />
                    )}
                    {activeH > 0 ? (
                      <div
                        className="bar-segment bar-segment-active"
                        style={{ height: `${activeH}%` }}
                        title={`Active: ${formatDuration(day.active_secs)}`}
                      />
                    ) : (
                      <div className="bar-zero-indicator" />
                    )}
                  </div>

                  {/* Day Axis Label */}
                  <div className="day-axis-labels">
                    <span className="day-name">{day.day_name}</span>
                    <span className="day-number">{day.date_num}</span>
                    {day.is_today && <span className="today-dot" title="Today" />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Weekly Summary Footer Row */}
          <div className="graph-footer-summary">
            <div className="summary-stat">
              <span className="summary-label">This Week Total</span>
              <span className="summary-val text-neon-purple">
                {formatDuration(weeklyTotalSecs)}
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Daily Average</span>
              <span className="summary-val text-lavender">
                {formatDuration(dailyAverageSecs)} / day
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Today’s Total</span>
              <span className="summary-val text-glow">
                {formatDuration(todayTotalSecs || activeTotalSecs + idleTotalSecs)}
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Week Active Ratio</span>
              <span className="summary-val text-neon-purple">
                {weeklyTotalSecs > 0
                  ? `${Math.round((weeklyActiveSecs / weeklyTotalSecs) * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2: 24-HOUR HOURLY TIMELINE (TODAY) ── */}
      {viewMode === 'today' && (
        <div className="graph-container">
          <div className="bars-track">
            {hourlyStats.map((item) => {
              const activeH = Math.min(100, (item.active_secs / maxHourSecs) * 100)
              const idleH = Math.min(100, (item.idle_secs / maxHourSecs) * 100)
              const isHovered = hoveredHour === item.hour

              return (
                <div
                  key={item.hour}
                  className={`hour-column ${item.is_current_hour ? 'current-hour' : ''} ${
                    isHovered ? 'hovered' : ''
                  }`}
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

          {/* Today Summary */}
          <div className="graph-footer-summary">
            <div className="summary-stat">
              <span className="summary-label">Today Active Time</span>
              <span className="summary-val text-neon-purple">{formatDuration(activeTotalSecs)}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Today Idle / Away</span>
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
      )}
    </div>
  )
}
