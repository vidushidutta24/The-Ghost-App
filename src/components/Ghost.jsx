import neutralImg from '../assets/ghost/neutral.png'
import happyImg from '../assets/ghost/happy.png'
import sadImg from '../assets/ghost/sad.png'
import angryImg from '../assets/ghost/angry.png'
import surprisedImg from '../assets/ghost/surprised.png'
import sleepyImg from '../assets/ghost/sleepy.png'
import { MOOD_CONFIG, GHOST_MOODS } from '../constants/moods.js'
import '../styles/ghost.css'

/**
 * Ghost component — the main pixel-art character.
 *
 * Renders the correct emotion sprite based on the `mood` prop.
 * Animation class is derived from MOOD_CONFIG[mood].animation.
 *
 * To add new moods:
 *   1. Add entry to GHOST_MOODS and MOOD_CONFIG in constants/moods.js
 *   2. Add the emotion image to src/assets/ghost/
 *   3. Import it here and add to MOOD_IMAGES
 *   4. Add the animation keyframes to ghost.css
 */

const MOOD_IMAGES = {
  [GHOST_MOODS.NEUTRAL]:   neutralImg,
  [GHOST_MOODS.HAPPY]:     happyImg,
  [GHOST_MOODS.SAD]:       sadImg,
  [GHOST_MOODS.ANGRY]:     angryImg,
  [GHOST_MOODS.SURPRISED]: surprisedImg,
  [GHOST_MOODS.SLEEPY]:    sleepyImg,
}

function Ghost({ mood = GHOST_MOODS.NEUTRAL }) {
  const config = MOOD_CONFIG[mood] ?? MOOD_CONFIG[GHOST_MOODS.NEUTRAL]
  const image  = MOOD_IMAGES[mood]  ?? MOOD_IMAGES[GHOST_MOODS.NEUTRAL]

  return (
    <div className="ghost-wrapper" data-tauri-drag-region>
      <img
        src={image}
        alt={`Ghost — ${config.label}`}
        className={`ghost-img ghost-img--${config.animation}`}
        draggable={false}
        data-tauri-drag-region
      />
    </div>
  )
}

export default Ghost

