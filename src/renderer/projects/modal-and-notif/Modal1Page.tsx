import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'

/* ─── Motion presets ─── */
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 }
const FAST = { type: 'spring' as const, stiffness: 500, damping: 35 }

/* ─── Progress steps ─── */
const PHASES = [
  { label: 'Memproses…', color: '#f0fdf4', accent: '#10b981' },
  { label: 'Selesai!', color: '#f0fdf4', accent: '#22c55e' },
]

export function Modal1Page() {
  const [showModal, setShowModal] = useState(false)
  const [phase, setPhase] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [closeRings, setCloseRings] = useState(false)
  const timerRefs = useRef<number[]>([])

  /* ── Motion values ── */
  const scale = useMotionValue(0)
  const cardRotate = useMotionValue(0)
  const cardOpacity = useMotionValue(1)
  const progress = useMotionValue(0)
  const progressWidth = useTransform(progress, (v) => `${v}%`)

  const currentPhase = PHASES[phase] || PHASES[0]
  const cardShadow = useTransform(
    scale,
    [0.96, 1],
    [`0 4px 24px ${currentPhase.accent}25`, `0 8px 32px ${currentPhase.accent}18`]
  )

  /* ── Cleanup timers ── */
  useEffect(() => {
    if (!showModal) {
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
      setPhase(0)
      setIsClosing(false)
      setCloseRings(false)
      scale.set(0)
      cardRotate.set(0)
      cardOpacity.set(1)
      progress.set(0)
    }
  }, [showModal, scale, cardRotate, cardOpacity, progress])

  /* ── Open modal ── */
  const openModal = useCallback(() => {
    setShowModal(true)
    setPhase(0)
    animate(scale, 1, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
    animate(progress, 100, { duration: 1.4, ease: [0.22, 1, 0.36, 1] })
    const id = window.setTimeout(() => setPhase(1), 1500)
    timerRefs.current.push(id)
  }, [scale, progress])

  /* ── Close animation ── */
  const closeModalAnim = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    animate(scale, [1, 1.12], { duration: 0.2, ease: [0.22, 1, 0.36, 1] })
    setTimeout(() => {
      setCloseRings(true)
      animate(cardRotate, 720, { duration: 0.9, ease: [0.4, 0, 0.2, 1] })
      animate(scale, 0, { duration: 0.9, ease: [0.4, 0, 0.2, 1] })
      animate(cardOpacity, 0, { duration: 0.7, ease: 'easeIn', delay: 0.2 })
      setTimeout(() => {
        setShowModal(false)
        setCloseRings(false)
        setIsClosing(false)
        cardRotate.set(0)
        cardOpacity.set(1)
        scale.set(0)
        progress.set(0)
        setPhase(0)
      }, 1200)
    }, 220)
  }, [isClosing, scale, cardRotate, cardOpacity, progress])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Modal 1
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Modal animasi process selesai.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Modal dengan progress bar → checkmark animasi → expanding rings saat close.
        </p>

        {/* ─── Trigger ─── */}
        <button
          onClick={openModal}
          className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.97]"
        >
          Simulasi proses selesai
        </button>
      </article>

      <aside className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Animations
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Progress bar, checkmark draw, expanding rings, sparkle particles.
        </p>
      </aside>

      {/* ─── Animated Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={isClosing ? undefined : closeModalAnim}
          >
            {/* Black wrapper — fit to card width, 400px height, centered */}
            <motion.div
              className="relative flex w-fit items-center justify-center rounded-2xl bg-black"
              style={{ height: 400 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Expanding rings on close ── */}
              <AnimatePresence>
                {closeRings && [0, 1, 2].map((i) => (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute left-1/2 top-1/2 rounded-full border-2 border-emerald-300"
                    initial={{ width: 80, height: 80, x: '-50%', y: '-50%', opacity: 0.6 }}
                    animate={{ width: 350 + i * 180, height: 350 + i * 180, x: '-50%', y: '-50%', opacity: 0 }}
                    transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                    exit={{ opacity: 0 }}
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
              </AnimatePresence>

              {/* ── Sparkle particles on close ── */}
              <AnimatePresence>
                {closeRings && Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2
                  const dist = 100 + Math.random() * 60
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
                        style={{ backgroundColor: currentPhase.accent }}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* ── Main Card ── */}
              <motion.div
                layout
                style={{ scale, rotate: cardRotate, opacity: cardOpacity, boxShadow: cardShadow }}
                className="relative flex w-[320px] flex-col items-center overflow-hidden rounded-3xl px-8 py-10 text-center"
                animate={{ backgroundColor: currentPhase.color }}
                transition={SPRING}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Accent border */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  animate={{ borderColor: currentPhase.accent + '50', borderWidth: '2px' }}
                  transition={FAST}
                  style={{ border: '2px solid', pointerEvents: 'none' }}
                />

                {/* Inner glow overlay */}
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  animate={{ opacity: [0, 0.18, 0.06] }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  key={`glow-${phase}`}
                  style={{ background: `radial-gradient(circle at center, ${currentPhase.accent}, transparent 65%)` }}
                />

                <AnimatePresence mode="wait">
                  {phase === 0 ? (
                    /* ── Phase 0: Progress bar ── */
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -12 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="flex w-full flex-col items-center gap-4"
                    >
                      {/* Animated loading icon */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                      >
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={currentPhase.accent}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      </motion.div>

                      <p
                        className="text-sm font-semibold animate-pulse"
                        style={{ color: currentPhase.accent }}
                      >
                        {currentPhase.label}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full overflow-hidden rounded-full bg-slate-200/60">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{
                            width: progressWidth,
                            background: `linear-gradient(to right, ${currentPhase.accent}, #4ade80)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    /* ── Phase 1: Done — Checkmark + Finish text ── */
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -12 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="flex w-full flex-col items-center gap-4"
                    >
                      {/* Bouncing checkmark */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ background: `linear-gradient(135deg, ${currentPhase.accent}, #4ade80)` }}
                      >
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.polyline
                            points="4 12 10 18 20 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                          />
                        </svg>
                      </motion.div>

                      {/* Finish text */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="mt-3 text-2xl font-bold tracking-tight"
                        style={{ color: currentPhase.accent }}
                      >
                        Finish
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
