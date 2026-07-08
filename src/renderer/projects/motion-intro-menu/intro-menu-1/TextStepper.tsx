import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'

/* ── Step definitions with colors & icons ────────────────────── */
const STEPS = [
  {
    text: 'Petualangan Dimulai di Sini',
    color: '#f8fafc',
    accent: '#0ea5e9',
    icon: CompassIcon,
  },
  {
    text: 'Setiap perjalanan punya cerita',
    color: '#faf5ff',
    accent: '#8b5cf6',
    icon: BookIcon,
  },
  {
    text: 'Bantu kami tumbuh — Subscribe!',
    color: '#fef2f2',
    accent: '#ef4444',
    icon: BellIcon,
  },
  {
    text: 'Like & Comment juga ya',
    color: '#fdf2f8',
    accent: '#ec4899',
    icon: HeartIcon,
  },
  {
    text: 'Bersama Donis Outdoor',
    color: '#f5f3ff',
    accent: '#7c3aed',
    icon: HandshakeIcon,
  },
  {
    text: 'Kita Mulai!',
    color: '#f0fdf4',
    accent: '#16a34a',
    icon: PartyIcon,
  },
  {
    text: '',
    color: '#f0fdf4',
    accent: '#22c55e',
    icon: null as any,
    isClose: true,
  },
]

/* ── Snappy spring (matches tutorial feel) ───────────────────── */
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 }
const FAST = { type: 'spring' as const, stiffness: 500, damping: 35 }

export function TextStepper() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bgColor, setBgColor] = useState(() => {
    try {
      return localStorage.getItem('stepper-bg-color') || '#f8fafc'
    } catch { return '#f8fafc' }
  })
  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const Icon = step.icon

  const [isClosing, setIsClosing] = useState(false)
  const [closeRings, setCloseRings] = useState(false)

  /* ── Persist bg color ─────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem('stepper-bg-color', bgColor)
  }, [bgColor])

  /* ── Click sound on step change ───────────────────────── */
  const clickRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    clickRef.current = new Audio('/sound/click.mp3')
    clickRef.current.volume = 0.4
    clickRef.current.playbackRate = 1.8
  }, [])

  const playClick = useCallback(() => {
    if (clickRef.current) {
      clickRef.current.currentTime = 0
      clickRef.current.play().catch(() => {})
    }
  }, [])

  /* ── Win sound for close animation ────────────────────── */
  const winRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    winRef.current = new Audio('/sound/win.mp3')
    winRef.current.volume = 0.5
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  /* ── Scale pulse on step change ─────────────────────────── */
  const scale = useMotionValue(1)
  const cardRotate = useMotionValue(0)
  const cardOpacity = useMotionValue(1)

  useEffect(() => {
    if (isClosing) return
    animate(scale, [1, 0.93, 1], { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
  }, [currentStep, scale, isClosing])

  const cardShadow = useTransform(
    scale,
    [0.96, 1],
    [`0 4px 24px ${step.accent}25`, `0 8px 32px ${step.accent}18`]
  )

  const handleNext = () => {
    if (isClosing) return
    // Skip click if next step is close (win sound will play instead)
    const nextStep = STEPS[currentStep + 1]
    if (!nextStep || !(nextStep as any).isClose) {
      playClick()
    }
    if (isLastStep) {
      setCurrentStep(0)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  /* ── Close animation: pop → spin → shrink → vanish ────── */
  useEffect(() => {
    if (!(step as any).isClose) return
    setIsClosing(true)
    if (winRef.current) {
      winRef.current.currentTime = 0
      winRef.current.play().catch(() => {})
    }

    // Phase 1: pop up (200ms)
    animate(scale, [1, 1.12], {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    })

    setTimeout(() => {
      setCloseRings(true)
      // Phase 2: spin + shrink + fade (900ms)
      animate(cardRotate, 720, { duration: 0.9, ease: [0.4, 0, 0.2, 1] })
      animate(scale, 0, { duration: 0.9, ease: [0.4, 0, 0.2, 1] })
      animate(cardOpacity, 0, { duration: 0.7, ease: 'easeIn', delay: 0.2 })

      // Phase 3: cleanup rings only — stay at close step, card gone
      setTimeout(() => {
        setCloseRings(false)
        setIsClosing(false)
      }, 1300)
    }, 220)
  }, [currentStep, scale, cardRotate, cardOpacity, step])

  /* ── Fullscreen mode ───────────────────────────────────── */
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bgColor }}>
        {/* Top bar — hidden during close */}
        {!isClosing && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">
              Text Stepper
            </span>

            {/* BG Color picker */}
            <div className="flex items-center gap-1.5 ml-3">
              {([
                { color: '#f8fafc', label: 'Light' },
                { color: '#0f172a', label: 'Dark' },
                { color: '#00ff00', label: 'Green' },
                { color: '#ffffff', label: 'Putih' },
              ] as const).map((opt) => (
                <button
                  key={opt.color}
                  onClick={() => setBgColor(opt.color)}
                  className={`h-5 w-5 rounded-md border-2 transition hover:scale-110 ${
                    bgColor === opt.color ? 'border-teal-400' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Step nav buttons */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => {
                  playClick()
                  setCurrentStep((p) => Math.max(0, p - 1))
                }}
                disabled={currentStep === 0}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="px-1.5 text-[11px] font-medium text-slate-400">
                {currentStep + 1}/{STEPS.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (currentStep === STEPS.length - 1) {
                    // Reset: restore card & go back to step 1
                    playClick()
                    setIsClosing(false)
                    animate(scale, 1, { duration: 0 })
                    cardRotate.set(0)
                    cardOpacity.set(1)
                    setCurrentStep(0)
                  } else {
                    // Skip click if next step is close (win sound will play instead)
                    const nextStep = STEPS[currentStep + 1]
                    if (!nextStep || !(nextStep as any).isClose) {
                      playClick()
                    }
                    setCurrentStep((p) => Math.min(STEPS.length - 1, p + 1))
                  }
                }}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
              >
                {currentStep === STEPS.length - 1
                  ? '↻ Again'
                  : currentStep === STEPS.length - 2
                    ? '✓ Done'
                    : 'Next →'}
              </button>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              ✕ Close
            </button>
          </div>
        </div>
        )}

        {/* Card area — fills remaining space */}
        <div id="card-area" className="flex flex-1 items-center justify-center px-8">
          <div className="relative">
            {/* Expanding rings on close */}
            <AnimatePresence>
              {closeRings && [0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute left-1/2 top-1/2 rounded-full border-2 border-slate-300"
                  initial={{ width: 100, height: 100, x: '-50%', y: '-50%', opacity: 0.6 }}
                  animate={{ width: 400 + i * 200, height: 400 + i * 200, x: '-50%', y: '-50%', opacity: 0 }}
                  transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                  exit={{ opacity: 0 }}
                  style={{ pointerEvents: 'none' }}
                />
              ))}
            </AnimatePresence>

            {/* Sparkle particles on close */}
            <AnimatePresence>
              {closeRings && Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2
                const dist = 120 + Math.random() * 80
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute left-1/2 top-1/2"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                    exit={{ opacity: 0 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: step.accent }}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <motion.div
              layout
              onClick={handleNext}
              style={{ scale, rotate: cardRotate, opacity: cardOpacity, boxShadow: cardShadow }}
              className="relative inline-flex min-h-[160px] w-auto cursor-pointer items-center justify-center overflow-hidden rounded-3xl px-8 py-16"
              animate={{ backgroundColor: step.color }}
              transition={SPRING}
            >
              {/* Accent border */}
              <motion.div
                layout
                className="absolute inset-0 rounded-3xl"
                animate={{ borderColor: step.accent + '50', borderWidth: '2px' }}
                transition={FAST}
                style={{ border: '2px solid', pointerEvents: 'none' }}
              />

              {/* Inner glow overlay */}
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                animate={{ opacity: [0, 0.18, 0.06] }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                key={`glow-${currentStep}`}
                style={{ background: `radial-gradient(circle at center, ${step.accent}, transparent 65%)` }}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -12 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                  >
                    {Icon && <Icon color={step.accent} size={52} />}
                  </motion.div>
                  <p
                    className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    style={{ color: step.accent }}
                  >
                    {step.text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Progress bar — full width at bottom, fixed segments */}
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur px-4 py-3">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: i <= currentStep ? s.accent : '#e2e8f0' }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Inline mode (embedded in page) ────────────────────── */
  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* ── Main Card ─────────────────────────────────────────── */}
      <div className="relative w-full max-w-xl">
        {/* Fullscreen button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute -top-2 -right-2 z-10 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-600"
        >
          ⛶ Expand
        </button>
        <motion.div
          layout
          onClick={handleNext}
          style={{ scale, boxShadow: cardShadow }}
          className="relative flex min-h-[160px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-3xl px-8 py-12"
          animate={{ backgroundColor: step.color }}
          transition={SPRING}
        >
          {/* Accent border that follows the card resize */}
          <motion.div
            layout
            className="absolute inset-0 rounded-3xl"
            animate={{ borderColor: step.accent + '50', borderWidth: '2px' }}
            transition={FAST}
            style={{ border: '2px solid', pointerEvents: 'none' }}
          />

          {/* Inner glow overlay — bright flash */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            animate={{ opacity: [0, 0.18, 0.06] }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            key={`glow-${currentStep}`}
            style={{ background: `radial-gradient(circle at center, ${step.accent}, transparent 65%)` }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -12 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 text-center"
            >
              {/* Icon — bouncy with rotation wobble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 12 }}
              >
                {Icon && <Icon color={step.accent} size={52} />}
              </motion.div>

              {/* Text */}
              <p
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                style={{ color: step.accent }}
              >
                {step.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Progress bar (separate from card, full width) ────── */}
      <div className="w-full max-w-xl">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i <= currentStep ? s.accent : '#e2e8f0' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SVG Icon Components ─────────────────────────────────────── */

function CompassIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color + '30'} />
    </svg>
  )
}

function BookIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function BellIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" fill={color + '20'} />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function HeartIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color + '30'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function PartyIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 11.3 2 22l10.7-3.79" fill={color + '20'} />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
    </svg>
  )
}

function HandshakeIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" fill={color + '15'} />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 3v5" />
    </svg>
  )
}
