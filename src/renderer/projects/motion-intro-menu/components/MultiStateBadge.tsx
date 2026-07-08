import { useState, useRef } from 'react'
import { motion, AnimatePresence, useTime, useTransform } from 'motion/react'

type BadgeState = 'idle' | 'hero' | 'menu'

const STATES: Record<BadgeState, { label: string; bg: string; color: string }> = {
  idle: { label: 'Donis Outdoor', bg: 'bg-slate-900', color: 'text-white' },
  hero: { label: 'Vlog & Outdoor Content', bg: 'bg-gradient-to-r from-sky-600 to-cyan-500', color: 'text-white' },
  menu: { label: 'Pilih Project', bg: 'bg-white', color: 'text-slate-900' },
}

const MENU_ITEMS = [
  { label: 'Actor Movement Map', route: '/projects/actor-movement-map', accent: 'from-sky-500 to-cyan-400' },
  { label: 'Motion Intro', route: '/projects/motion-intro-menu', accent: 'from-amber-500 to-orange-400' },
  { label: 'Motion Close', route: '/projects/motion-close-page', accent: 'from-emerald-500 to-lime-400' },
]

function getNextState(state: BadgeState): BadgeState {
  const states: BadgeState[] = ['idle', 'hero', 'menu']
  const nextIndex = (states.indexOf(state) + 1) % states.length
  return states[nextIndex]
}

export function MultiStateBadge() {
  const [badgeState, setBadgeState] = useState<BadgeState>('idle')
  const badgeRef = useRef<HTMLDivElement>(null)

  // Continuous rotation for idle state
  const time = useTime()
  const rotate = useTransform(time, [0, 4000], [0, 360])

  const handleClick = () => {
    setBadgeState(getNextState(badgeState))
  }

  const handleMenuClick = (route: string) => {
    window.location.href = route
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Main Badge */}
      <motion.div
        ref={badgeRef}
        layout
        onClick={handleClick}
        className={`relative cursor-pointer overflow-hidden rounded-full ${STATES[badgeState].bg} ${STATES[badgeState].color} shadow-lg transition-colors`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Spinning ring for idle */}
        {badgeState === 'idle' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-white/30"
            style={{ rotate }}
          />
        )}

        <div className="relative px-8 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={badgeState}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold tracking-tight">
                {STATES[badgeState].label}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Menu Items (visible in menu state) */}
      <AnimatePresence>
        {badgeState === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            {MENU_ITEMS.map((item, index) => (
              <motion.button
                key={item.route}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuClick(item.route)
                }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${item.accent}`} />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">Masuk ke project →</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Indicator */}
      <motion.p
        key={badgeState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-slate-400"
      >
        {badgeState === 'idle' && 'Klik untuk mulai'}
        {badgeState === 'hero' && 'Klik lagi untuk melihat menu'}
        {badgeState === 'menu' && 'Pilih project yang ingin dibuka'}
      </motion.p>
    </div>
  )
}
