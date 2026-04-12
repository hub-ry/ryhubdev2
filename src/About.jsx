import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import PsychBackground from './PsychBackground'
import './About.css'

// ─── Config ───────────────────────────────────────────────────────────────────
const OVERLAY_COLOR  = '#07070d'   // color the bg fades to
const OVERLAY_MAX    = 0.72        // max opacity of the fade layer (0–1)
const TRIGGER_RADIUS = 0.30        // fraction of screen half-width; mouse within this triggers fade
const TYPE_SPEED_MS  = 40          // ms per character
const TEXT_FADE_IN   = 0.82        // proximity at which text starts appearing (0–1)
const TYPE_START     = 0.90        // proximity at which typing begins
const RESET_AT       = 0.45        // proximity below which everything resets
// ─────────────────────────────────────────────────────────────────────────────

const LINE1 = 'Ryan Hubbart'
const LINE2 = 'CS @ Purdue  ·  Graphics & ML  ·  XR'

export default function About({ onClose }) {
  const [proximity, setProximity] = useState(0)
  const [typedLine1, setTypedLine1] = useState('')
  const [typedLine2, setTypedLine2] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const t1Ref = useRef(null)
  const t2Ref = useRef(null)
  const startedRef = useRef(false)

  // Mouse proximity to center
  useEffect(() => {
    const onMove = e => {
      const dx = e.clientX / window.innerWidth  - 0.5
      const dy = e.clientY / window.innerHeight - 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)
      setProximity(Math.max(0, Math.min(1, 1 - dist / TRIGGER_RADIUS)))
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Typing logic
  useEffect(() => {
    if (proximity >= TYPE_START && !startedRef.current) {
      startedRef.current = true
      setShowCursor(true)

      let i = 0
      t1Ref.current = setInterval(() => {
        i++
        setTypedLine1(LINE1.slice(0, i))
        if (i >= LINE1.length) {
          clearInterval(t1Ref.current)
          t1Ref.current = null
          let j = 0
          t2Ref.current = setInterval(() => {
            j++
            setTypedLine2(LINE2.slice(0, j))
            if (j >= LINE2.length) {
              clearInterval(t2Ref.current)
              t2Ref.current = null
            }
          }, TYPE_SPEED_MS)
        }
      }, TYPE_SPEED_MS)
    }

    if (proximity < RESET_AT) {
      clearInterval(t1Ref.current)
      clearInterval(t2Ref.current)
      t1Ref.current = null
      t2Ref.current = null
      startedRef.current = false
      setTypedLine1('')
      setTypedLine2('')
      setShowCursor(false)
    }
  }, [proximity])

  const textOpacity = Math.max(0, (proximity - TEXT_FADE_IN) / (1 - TEXT_FADE_IN))

  return (
    <motion.div
      className="about-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClose}
    >
      <PsychBackground />

      {/* Solid color fade layer */}
      <div
        className="about-color-fade"
        style={{ background: OVERLAY_COLOR, opacity: proximity * OVERLAY_MAX }}
      />

      {/* Text layer */}
      <div
        className="about-text-layer"
        style={{ opacity: textOpacity }}
        onClick={e => e.stopPropagation()}
      >
        <p className="about-eyebrow">About</p>
        <h1 className="about-name">
          {typedLine1}
          {showCursor && <span className="about-cursor" />}
        </h1>
        <p className="about-subtitle">{typedLine2}</p>
      </div>
    </motion.div>
  )
}
