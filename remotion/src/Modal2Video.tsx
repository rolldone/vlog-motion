import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence } from 'remotion'

/* ─── Color palette ─── */
const ACCENT = '#22c55e'
const ACCENT_LIGHT = '#4ade80'

/* ─── Timing (in frames at 30fps) ─── */
const WRAPPER_IN_END = 5       // 0 → ~0.17s (wrapper slides in, empty)
const PHASE_0_START = 15       // 0.5s (loading content fades in)
const PHASE_0_END = 59         // ~2s (progress bar fills)
const PHASE_1_START = 62       // 2.1s (checkmark appears)
const FADE_OUT_START = 105     // 3.5s (start fading out)
const TOTAL_FRAMES = 120       // 4s total

export function Modal2Video() {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  /* ── Master slide in from left ── */
  const slideX = interpolate(
    frame,
    [0, 10],
    [-100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const masterOpacity = interpolate(
    frame,
    [0, 8, FADE_OUT_START, TOTAL_FRAMES - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  /* ── Phase 0: Progress bar (0 → 100%) ── */
  const progress = interpolate(
    frame,
    [PHASE_0_START, PHASE_0_END],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  /* ── Loading content fade in (after wrapper lands) ── */
  const loadingOpacity = interpolate(
    frame,
    [WRAPPER_IN_END, WRAPPER_IN_END + 8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const isPhase1 = frame >= PHASE_1_START

  /* ── Phase 1: Checkmark spring ── */
  const checkSpring = spring({
    frame: frame - PHASE_1_START,
    fps,
    config: { stiffness: 600, damping: 12 },
  })

  /* ── Phase 1: "Finish" text slide up ── */
  const finishOpacity = interpolate(
    frame,
    [PHASE_1_START + 9, PHASE_1_START + 18], // 0.3s delay then 0.3s in
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const finishY = interpolate(
    frame,
    [PHASE_1_START + 9, PHASE_1_START + 18],
    [12, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  /* ── Phase 0: Spinner rotation ── */
  const spinnerRotation = interpolate(
    frame,
    [PHASE_0_START, PHASE_0_END + 30],
    [0, 720],
    { extrapolateRight: 'extend' }
  )

  /* ── Wrapper: slide in from left (snappy) ── */
  const wrapperX = interpolate(
    frame,
    [0, 5],
    [-100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const wrapperOpacity = interpolate(
    frame,
    [0, 4],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent', // ← KEY: transparent background for alpha channel
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Mountain wrapper — full width, 300px height, flat ── */}
      <div
        style={{
          width: '100%',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: wrapperOpacity * masterOpacity * 0.8,
          transform: `translateX(${wrapperX}%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── SVG 3 mountains background ── */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 1920 300"
          preserveAspectRatio="none"
        >
          {/* Sky gradient */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#1a2744" />
            </linearGradient>
          </defs>
          <rect width="1920" height="300" fill="url(#sky)" />

          {/* Mountain 3 (back, darkest) */}
          <path
            d="M0 300 L200 80 L450 200 L700 40 L950 180 L1200 60 L1450 190 L1700 90 L1920 220 L1920 300 Z"
            fill="#0d1117"
          />
          {/* Mountain 2 (middle) */}
          <path
            d="M0 300 L300 120 L550 220 L800 90 L1050 230 L1300 100 L1550 210 L1920 130 L1920 300 Z"
            fill="#141d2b"
          />
          {/* Mountain 1 (front, lightest) */}
          <path
            d="M0 300 L150 170 L400 250 L650 140 L900 260 L1150 150 L1400 240 L1650 160 L1920 250 L1920 300 Z"
            fill="#1c2838"
          />
        </svg>
        {!isPhase1 ? (
          /* ═══ Phase 0: Progress bar ═══ */
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              opacity: loadingOpacity * interpolate(frame, [PHASE_0_END - 5, PHASE_0_END], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* Spinning loader icon */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: `rotate(${spinnerRotation}deg)` }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>

            {/* "Memproses…" text */}
            <p
              style={{
                color: ACCENT,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Memproses…
            </p>

            {/* Progress bar */}
            <div
              style={{
                width: 256,
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: 999,
                  background: `linear-gradient(to right, ${ACCENT}, ${ACCENT_LIGHT})`,
                }}
              />
            </div>
          </div>
        ) : (
          /* ═══ Phase 1: Checkmark + "Finish" ═══ */
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              opacity: interpolate(frame, [PHASE_1_START, PHASE_1_START + 9], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* Checkmark circle */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${checkSpring})`,
              }}
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
                <polyline
                  points="4 12 10 18 20 6"
                  strokeDasharray={24}
                  strokeDashoffset={interpolate(
                    frame,
                    [PHASE_1_START + 4, PHASE_1_START + 19],
                    [24, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )}
                />
              </svg>
            </div>

            {/* "Finish" text */}
            <p
              style={{
                color: ACCENT,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontFamily: 'system-ui, sans-serif',
                opacity: finishOpacity,
                transform: `translateY(${finishY}px)`,
              }}
            >
              Finish
            </p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
