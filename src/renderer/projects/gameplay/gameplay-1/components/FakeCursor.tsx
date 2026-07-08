// ─── Fake cursor — visual cursor yang bergerak saat replay ───
// Tampil di atas semua elemen, pointer-events: none agar tidak ganggu klik
// Style mengikuti cursor asli app: crosshair (+)

interface FakeCursorProps {
  x: number
  y: number
  visible: boolean
}

export function FakeCursor({ x, y, visible }: FakeCursorProps) {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-12px, -12px)',
        transition: 'left 16ms linear, top 16ms linear',
      }}
    >
      {/* Crosshair cursor — sesuai cursor-crosshair app */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Garis horizontal */}
        <line x1="0" y1="12" x2="24" y2="12" stroke="white" strokeWidth="1.5" />
        {/* Garis vertikal */}
        <line x1="12" y1="0" x2="12" y2="24" stroke="white" strokeWidth="1.5" />
        {/* Outline tipis untuk visibility di background terang/gelap */}
        <line x1="0" y1="12" x2="24" y2="12" stroke="black" strokeWidth="0.5" opacity="0.4" />
        <line x1="12" y1="0" x2="12" y2="24" stroke="black" strokeWidth="0.5" opacity="0.4" />
        {/* Titik tengah */}
        <circle cx="12" cy="12" r="1.5" fill="white" />
      </svg>
    </div>
  )
}