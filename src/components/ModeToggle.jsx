/**
 * ModeToggle — AUTO / DEBUG mode switcher shown above the mood selector.
 *
 * In AUTO mode: Ghost mood is driven by the activity monitor.
 * In DEBUG mode: MoodSelector is shown for manual overrides.
 */
import '../styles/mode-toggle.css'

function ModeToggle({ mode, onToggle, activityInfo, onGreet, onOpenDashboard }) {
  const isAuto = mode === 'auto'

  return (
    <div
      className="mode-toggle"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={`mode-btn ${isAuto ? 'mode-btn--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle('auto') }}
        title="Let the Ghost react to your desktop automatically"
      >
        AUTO
      </button>
      <button
        className={`mode-btn ${!isAuto ? 'mode-btn--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle('debug') }}
        title="Manually pick the Ghost's mood"
      >
        DEBUG
      </button>

      {/* Button to re-trigger Ghost greeting anytime */}
      <button
        className="mode-btn"
        onClick={(e) => { e.stopPropagation(); onGreet?.() }}
        title="Trigger greeting bubble"
      >
        💬
      </button>

      {/* Button to open the full spooky Dashboard */}
      <button
        className="mode-btn mode-btn--dashboard"
        onClick={(e) => { e.stopPropagation(); onOpenDashboard?.() }}
        title="Open Fullscreen Digital Ghost Dashboard"
      >
        ✦ DASHBOARD
      </button>

      {/* Activity info pill — only shown in AUTO mode */}
      {isAuto && activityInfo && (
        <span className="mode-toggle__info" title={activityInfo.application || ''}>
          {activityInfo.context}
          {activityInfo.idle_secs > 0 && ` · ${Math.round(activityInfo.idle_secs)}s idle`}
        </span>
      )}
    </div>
  )
}

export default ModeToggle

