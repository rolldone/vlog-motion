import { useEffect, useState, useRef } from 'react'

// ─── Settings type ───
export type VignetteColor = 'red' | 'white'

export interface HitDamageSettings {
  vignette: boolean
  bloodSplatter: boolean
  splatterCount: number      // jumlah bercak per hit (1-20)
  splatterDuration: number   // durasi bekas dalam ms (1000-10000)
  splatterSize: number       // ukuran multiplier (0.5-3.0)
  vignetteIntensity: number  // intensitas per hit (0.05-0.3)
  vignetteSpread: number     // lebar spread dari tepi (10-60%)
  vignetteDuration: number   // durasi bekas dalam ms (1000-10000)
  vignetteColor: VignetteColor // 'red' = damage, 'white' = dehidrasi
}

export const DEFAULT_HIT_SETTINGS: HitDamageSettings = {
  vignette: true,
  bloodSplatter: true,
  splatterCount: 3,
  splatterDuration: 3000,
  splatterSize: 1.0,
  vignetteIntensity: 0.12,
  vignetteSpread: 30,
  vignetteDuration: 3000,
  vignetteColor: 'red',
}

interface HitDamageOverlayProps {
  /** Trigger key — increment to fire a new hit */
  trigger: number
  settings: HitDamageSettings
}

// ─── CSS keyframes injected once ───
const STYLE_ID = 'hit-damage-keyframes'
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes hit-vignette-appear {
      0%   { opacity: 0; }
      30%  { opacity: 1; }
      100% { opacity: 1; }
    }
    @keyframes hit-vignette-fade {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes hit-blood-appear {
      0%   { opacity: 0; transform: scale(0.3); }
      30%  { opacity: 0.85; transform: scale(1); }
      100% { opacity: 0.85; transform: scale(1); }
    }
    @keyframes hit-blood-fade {
      0%   { opacity: 0.85; }
      100% { opacity: 0; }
    }
    @keyframes hit-blood-drip {
      0%   { transform: translateY(0); opacity: 0.85; }
      50%  { transform: translateY(20px); opacity: 0.85; }
      100% { transform: translateY(40px); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

// ─── Blood splatter SVG shapes (organic blob paths) ───
const BLOOD_SPLATTERS: string[] = [
  // Splatter 1 — big blob with droplets
  'M50 15 C58 12 68 18 72 28 C80 25 88 32 85 42 C92 45 90 58 82 60 C88 68 82 80 72 78 C70 88 58 90 52 82 C45 88 35 85 35 75 C25 78 18 68 25 60 C15 55 18 42 28 42 C22 32 30 20 42 22 C44 18 47 16 50 15 Z M88 55 C91 53 94 56 92 59 C89 61 86 58 88 55 Z M20 30 C22 28 26 30 24 33 C21 35 18 32 20 30 Z M78 72 C80 70 83 72 81 75 C78 77 76 74 78 72 Z',
  // Splatter 2 — splash with spread droplets
  'M50 20 C60 18 70 25 68 35 C75 38 78 48 72 55 C78 62 72 72 62 70 C58 78 48 78 45 70 C35 72 28 65 32 55 C22 52 25 40 35 38 C30 28 38 20 50 20 Z M85 25 C88 22 92 25 90 28 C87 30 83 28 85 25 Z M15 50 C18 47 22 50 19 53 C16 55 13 52 15 50 Z M82 65 C85 63 88 66 85 68 C82 70 80 67 82 65 Z M25 75 C28 72 32 75 29 78 C26 80 22 77 25 75 Z',
  // Splatter 3 — irregular splat
  'M45 18 C55 15 65 22 62 32 C72 30 80 38 75 48 C82 52 78 62 68 60 C65 70 52 72 48 65 C40 72 30 68 32 58 C22 55 25 45 35 42 C28 32 35 22 45 18 Z M88 40 C91 38 94 41 91 44 C88 46 85 43 88 40 Z M12 60 C15 57 19 60 16 63 C13 65 10 62 12 60 Z M70 82 C73 80 76 83 73 85 C70 87 67 84 70 82 Z',
  // Splatter 4 — elongated smear
  'M30 30 C40 25 55 28 60 38 C70 35 78 42 75 52 C82 55 80 68 70 68 C72 78 60 82 52 76 C45 82 35 78 38 68 C28 70 22 60 28 52 C18 48 22 35 32 34 C25 28 28 22 30 30 Z M85 50 C88 48 91 51 88 54 C85 56 82 53 85 50 Z M15 70 C18 67 22 70 19 73 C16 75 12 72 15 70 Z',
  // Splatter 5 — small impact spray
  'M48 22 C56 20 64 26 62 34 C70 33 74 40 70 48 C76 50 74 60 66 60 C64 68 54 70 50 64 C44 70 36 68 38 60 C30 58 28 48 36 46 C32 38 38 28 46 30 C46 26 47 24 48 22 Z M80 35 C83 33 86 36 83 39 C80 41 78 38 80 35 Z M18 45 C21 42 25 45 22 48 C19 50 15 47 18 45 Z M75 72 C78 70 81 73 78 76 C75 78 72 75 75 72 Z M10 25 C13 22 17 25 14 28 C11 30 7 27 10 25 Z',
  // Splatter 6 — large gory splat
  'M40 15 C52 12 65 18 68 30 C78 28 85 38 80 48 C88 50 85 62 76 62 C80 72 72 82 62 78 C58 88 45 88 42 78 C32 82 22 75 28 65 C18 62 22 50 32 50 C25 40 32 28 42 30 C40 24 38 20 40 15 Z M90 60 C93 58 96 61 93 64 C90 66 87 63 90 60 Z M8 40 C11 37 15 40 12 43 C9 45 5 42 8 40 Z M85 80 C88 78 91 81 88 84 C85 86 82 83 85 80 Z M5 65 C8 62 12 65 9 68 C6 70 2 67 5 65 Z',
  // Splatter 7 — spray mist pattern
  'M50 25 C58 23 65 28 63 36 C70 35 75 42 70 50 C76 52 73 62 65 62 C62 70 52 72 48 66 C42 72 34 68 36 60 C28 58 26 48 34 46 C30 38 36 30 44 32 C44 28 47 26 50 25 Z M82 20 C85 18 88 21 85 24 C82 26 79 23 82 20 Z M15 30 C18 27 22 30 19 33 C16 35 12 32 15 30 Z M88 55 C91 53 94 56 91 59 C88 61 85 58 88 55 Z M20 75 C23 72 27 75 24 78 C21 80 17 77 20 75 Z M70 88 C73 86 76 89 73 92 C70 94 67 91 70 88 Z',
  // Splatter 8 — chunky gore
  'M35 20 C48 15 62 22 60 34 C72 32 80 42 74 54 C82 56 78 70 66 70 C70 80 58 86 48 80 C42 86 30 82 32 72 C20 74 14 62 24 54 C16 48 20 34 32 34 C28 26 30 22 35 20 Z M86 45 C89 43 92 46 89 49 C86 51 83 48 86 45 Z M10 55 C13 52 17 55 14 58 C11 60 7 57 10 55 Z M80 78 C83 76 86 79 83 82 C80 84 77 81 80 78 Z',
]

// ─── Blood splatter instance ───
interface BloodSplatterInstance {
  id: number
  x: number
  y: number
  shape: number
  rotation: number
  scale: number
  opacity: number     // random opacity per splatter (0.4-0.9)
  appearDelay: number  // random stagger for appear (ms)
  duration: number    // ms before fade starts
}

interface VignetteInstance {
  id: number
  intensity: number  // opacity per hit
  spread: number      // transparent center % (0-100)
  duration: number    // ms before fade starts
  color: VignetteColor
}

export function HitDamageOverlay({ trigger, settings }: HitDamageOverlayProps) {
  const [bloodSplatters, setBloodSplatters] = useState<BloodSplatterInstance[]>([])
  const [vignettes, setVignettes] = useState<VignetteInstance[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const splatterIdRef = useRef(0)
  const vignetteIdRef = useRef(0)

  useEffect(() => {
    injectKeyframes()
  }, [])

  useEffect(() => {
    if (trigger === 0) return // initial mount, skip

    // Clear previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    // Vignette — persistent overlay, stacks per hit, fades after duration
    if (settings.vignette) {
      const id = ++vignetteIdRef.current
      const intensity = Math.max(0.05, Math.min(0.3, settings.vignetteIntensity || 0.12))
      const spread = Math.max(10, Math.min(60, settings.vignetteSpread || 30))
      const duration = Math.max(1000, Math.min(10000, settings.vignetteDuration || 3000))
      const fadeTime = 500
      const vignette: VignetteInstance = { id, intensity, spread, duration, color: settings.vignetteColor || 'red' }
      setVignettes((prev) => [...prev, vignette])

      const t = setTimeout(() => {
        setVignettes((prev) => prev.filter((v) => v.id !== id))
      }, duration + fadeTime)
      timersRef.current.push(t)
    }

    // Blood splatter — stays for configured duration then fades out
    if (settings.bloodSplatter) {
      const count = Math.max(1, Math.min(20, settings.splatterCount || 3))
      const duration = Math.max(1000, Math.min(10000, settings.splatterDuration || 3000))
      const sizeMult = Math.max(0.5, Math.min(3.0, settings.splatterSize || 1.0))
      const fadeTime = 500
      const totalTime = duration + fadeTime

      const newSplatters: BloodSplatterInstance[] = []
      // Track placed positions to avoid stacking — minimum 18% distance
      const placed: { x: number; y: number }[] = []
      const minDist = 18 // minimum % distance between splatter centers
      const maxAttempts = 30 // try up to 30 times to find a non-overlapping spot

      for (let i = 0; i < count; i++) {
        const id = ++splatterIdRef.current
        let x = 0, y = 0
        let found = false
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          x = 8 + Math.random() * 84 // 8% - 92%
          y = 8 + Math.random() * 84 // 8% - 92%
          // Check distance to all previously placed splatters (including existing ones on screen)
          const tooClose = [...placed, ...bloodSplatters.map((s) => ({ x: s.x, y: s.y }))].some(
            (p) => Math.hypot(p.x - x, p.y - y) < minDist
          )
          if (!tooClose) { found = true; break }
        }
        // Kalau tidak ketemu spot bebas, pakai random tetap (lebih baik daripada skip)
        if (!found) { x = 8 + Math.random() * 84; y = 8 + Math.random() * 84 }
        placed.push({ x, y })

        const shape = Math.floor(Math.random() * BLOOD_SPLATTERS.length)
        const rotation = Math.random() * 360
        const scale = (0.4 + Math.random() * 1.0) * sizeMult // 0.4x - 1.4x * sizeMult (more variation)
        const opacity = 0.45 + Math.random() * 0.45 // 0.45 - 0.90
        const appearDelay = Math.random() * 200 // 0-200ms stagger
        newSplatters.push({ id, x, y, shape, rotation, scale, opacity, appearDelay, duration })
      }
      setBloodSplatters((prev) => [...prev, ...newSplatters])

      // Remove each splatter after duration + fade
      for (const s of newSplatters) {
        const t = setTimeout(() => {
          setBloodSplatters((prev) => prev.filter((p) => p.id !== s.id))
        }, totalTime)
        timersRef.current.push(t)
      }
    }

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [trigger, settings])

  return (
    <>
      {/* Vignette — persistent, stacks per hit, red or white */}
      {vignettes.map((v) => {
        const rgb = v.color === 'white' ? '255,255,255' : '220,38,38'
        return (
        <div
          key={v.id}
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99998,
            background: `radial-gradient(ellipse at center, transparent ${v.spread}%, rgba(${rgb},${v.intensity}) 100%)`,
            animation: `hit-vignette-appear 0.3s ease-out forwards, hit-vignette-fade 0.5s ease-in ${v.duration}ms forwards`,
          }}
        />
        )
      })}

      {/* Blood splatter — membekas lalu fade out */}
      {bloodSplatters.map((s) => {
        const fadeDelay = `${s.duration}ms`
        const appearDelay = `${s.appearDelay}ms`
        // Random droplet positions per splatter for more variety
        const dripX = 30 + Math.random() * 40
        // Bake opacity into fill alpha — avoids double-opacity bug
        const fillMain = `rgba(127,7,7,${0.9 * s.opacity})`
        const fillDrop = `rgba(127,7,7,${0.75 * s.opacity})`
        const fillDropLight = `rgba(127,7,7,${0.65 * s.opacity})`
        const fillDrip = `rgba(127,7,7,${0.85 * s.opacity})`
        return (
        <div
          key={s.id}
          style={{
            position: 'fixed',
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
            pointerEvents: 'none',
            zIndex: 99996,
            width: '200px',
            height: '200px',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            {/* Main splatter blob — fill-mode: both agar opacity 0 selama appearDelay */}
            <path
              d={BLOOD_SPLATTERS[s.shape]}
              fill={fillMain}
              style={{
                animation: `hit-blood-appear 0.3s ease-out ${appearDelay} both, hit-blood-fade 0.5s ease-in ${fadeDelay} both`,
              }}
            />
            {/* Smaller droplets around main splatter */}
            <circle cx="15" cy="25" r="3" fill={fillDrop}
              style={{ animation: `hit-blood-appear 0.4s ease-out ${appearDelay} both, hit-blood-fade 0.5s ease-in ${fadeDelay} both` }} />
            <circle cx="88" cy="40" r="2.5" fill={fillDrop}
              style={{ animation: `hit-blood-appear 0.4s ease-out ${appearDelay} both, hit-blood-fade 0.5s ease-in ${fadeDelay} both` }} />
            <circle cx="20" cy="80" r="2" fill={fillDropLight}
              style={{ animation: `hit-blood-appear 0.4s ease-out ${appearDelay} both, hit-blood-fade 0.5s ease-in ${fadeDelay} both` }} />
            <circle cx="82" cy="78" r="3.5" fill={fillDrop}
              style={{ animation: `hit-blood-appear 0.4s ease-out ${appearDelay} both, hit-blood-fade 0.5s ease-in ${fadeDelay} both` }} />
            {/* Drip — small drop that slides down */}
            <ellipse cx={dripX} cy="95" rx="2.5" ry="4" fill={fillDrip}
              style={{ animation: `hit-blood-drip 1s ease-in ${appearDelay} both` }} />
          </svg>
        </div>
        )
      })}
    </>
  )
}