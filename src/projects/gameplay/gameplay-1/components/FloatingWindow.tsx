import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

type FloatingWindowProps = {
  title: string
  url?: string
  onClose: () => void
  children?: React.ReactNode
}

export function FloatingWindow({ title, url, onClose, children }: FloatingWindowProps) {
  const [pos, setPos] = useState({ x: Math.round(window.innerWidth * 0.1), y: 60 })
  const [size, setSize] = useState({ w: Math.round(window.innerWidth * 0.8), h: Math.round(window.innerHeight * 0.8) })
  const dragging = useRef(false)
  const resizing = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // ─── Drag ───
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        setSize({
          w: Math.max(400, resizeStart.current.w + dx),
          h: Math.max(300, resizeStart.current.h + dy),
        })
      }
    }
    const handleUp = () => {
      dragging.current = false
      resizing.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  // ─── Resize ───
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
  }, [size])

  return createPortal(
    <div
      className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-white/20 bg-slate-900 shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar — draggable */}
      <div
        onMouseDown={handleDragStart}
        className="flex cursor-grab items-center justify-between bg-slate-800 px-3 py-2 active:cursor-grabbing"
      >
        <span className="text-xs font-semibold text-white/70">{title}</span>
        <button
          onClick={onClose}
          className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60 transition hover:bg-red-500/80 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Content — iframe atau children */}
      {children ? (
        <div className="flex-1" style={{ minHeight: 0 }}>
          {children}
        </div>
      ) : (
        <iframe
          src={url}
          className="flex-1"
          style={{ minHeight: 0, background: 'white' }}
          title={title}
        />
      )}

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
      />
    </div>,
    document.body,
  )
}
