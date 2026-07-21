import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'

/* ─── Progress steps ─── */
const PHASES = [
  { label: 'Memproses…', color: '#f0fdf4', accent: '#10b981' },
  { label: 'Selesai!', color: '#f0fdf4', accent: '#22c55e' },
]

/* ─── Chroma key background colors (same as gameplay) ─── */
const CHROMA_COLORS = [
  { name: 'No Color', hex: null },
  { name: 'Transparent', hex: 'transparent' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#20201f' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Green', hex: '#00ff00' },
  { name: 'Blue', hex: '#0000ff' },
  { name: 'Red', hex: '#ff0000' },
  { name: 'Yellow', hex: '#ffff00' },
  { name: 'Magenta', hex: '#ff00ff' },
]

export function Modal2Page() {
  const [showModal, setShowModal] = useState(false)
  const [phase, setPhase] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [bgColor, setBgColor] = useState<string | null>(null)
  const timerRefs = useRef<number[]>([])

  /* ── Motion values ── */
  const progress = useMotionValue(0)
  const progressWidth = useTransform(progress, (v) => `${v}%`)

  const currentPhase = PHASES[phase] || PHASES[0]

  /* ── Cleanup timers ── */
  useEffect(() => {
    if (!showModal) {
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
      setPhase(0)
      setIsClosing(false)
      progress.set(0)
    }
  }, [showModal, progress])

  /* ── Open modal ── */
  const openModal = useCallback(() => {
    setShowModal(true)
    setPhase(0)
    animate(progress, 100, { duration: 1.4, ease: [0.22, 1, 0.36, 1] })
    const id = window.setTimeout(() => setPhase(1), 1500)
    timerRefs.current.push(id)
  }, [progress])

  /* ── Close animation ── */
  const closeModalAnim = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    // wrapper fade out handled by AnimatePresence exit
    setTimeout(() => {
      setShowModal(false)
      setIsClosing(false)
      progress.set(0)
      setPhase(0)
    }, 500)
  }, [isClosing, progress])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Modal 2
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Modal 2 — Coming soon
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder untuk modal kedua. Nanti akan diisi dengan gaya animasi yang berbeda dari Modal 1.
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
          Latar Fullscreen
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pilih warna latar sebelum trigger modal fullscreen.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHROMA_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setBgColor(c.hex)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${bgColor === c.hex ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span
                className={`h-8 w-8 rounded-lg ${c.hex === 'transparent' ? '' : 'border border-slate-300'}`}
                style={c.hex === 'transparent'
                  ? { backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0' }
                  : { backgroundColor: c.hex ?? '#000000' }
                }
              />
              <span className="text-[10px] font-medium text-slate-600">{c.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ─── Fullscreen Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white" style={{ backgroundColor: bgColor ?? '#000000' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={isClosing ? undefined : closeModalAnim}
          >
            {/* ── Black wrapper — full width, 300px height, flat ── */}
            <motion.div
              className="relative flex w-full items-center justify-center bg-black"
              style={{ height: 300 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Progress / Done content ── */}
              <AnimatePresence mode="wait">
              {phase === 0 ? (
                /* ── Phase 0: Progress bar ── */
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-5"
                >
                  {/* Animated loading icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                  >
                    <svg
                      width="56"
                      height="56"
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
                    className="text-base font-semibold animate-pulse"
                    style={{ color: currentPhase.accent }}
                  >
                    {currentPhase.label}
                  </p>

                  {/* Progress bar */}
                  <div className="w-64 overflow-hidden rounded-full bg-white/10">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-5"
                >
                  {/* Bouncing checkmark */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                    className="flex h-24 w-24 items-center justify-center rounded-full"
                    style={{ background: `linear-gradient(135deg, ${currentPhase.accent}, #4ade80)` }}
                  >
                    <svg
                      width="48"
                      height="48"
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
                    className="text-3xl font-bold tracking-tight"
                    style={{ color: currentPhase.accent }}
                  >
                    Finish
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
