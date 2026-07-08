import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export function CropOverlay({
  imageDataUrl,
  onCrop,
  onCancel,
}: {
  imageDataUrl: string
  onCrop: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const isDragging = useRef(false)
  const cropStartRef = useRef<{ x: number; y: number } | null>(null)
  const imgSizeRef = useRef({ w: 0, h: 0 })

  // Keep refs in sync
  useEffect(() => {
    imgSizeRef.current = imgSize
  }, [imgSize])

  // ─── Window-level drag handlers (so drag works even outside the image element) ───
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !cropStartRef.current || !imgRef.current) return
      const imgRect = imgRef.current.getBoundingClientRect()
      const cx = e.clientX - imgRect.left
      const cy = e.clientY - imgRect.top
      const { w, h } = imgSizeRef.current
      const clampedX = Math.max(0, Math.min(cx, w))
      const clampedY = Math.max(0, Math.min(cy, h))
      setCropRect({
        x: Math.min(cropStartRef.current.x, clampedX),
        y: Math.min(cropStartRef.current.y, clampedY),
        w: Math.abs(clampedX - cropStartRef.current.x),
        h: Math.abs(clampedY - cropStartRef.current.y),
      })
    }
    const onMouseUp = () => {
      isDragging.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ─── Image loaded → measure natural size ───
  const handleImgLoad = useCallback(() => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    setImgSize({ w: rect.width, h: rect.height })
    setImgLoaded(true)
  }, [])

  // ─── Mouse down → start crop ───
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return
    const imgRect = imgRef.current.getBoundingClientRect()
    const x = e.clientX - imgRect.left
    const y = e.clientY - imgRect.top
    cropStartRef.current = { x, y }
    setCropRect({ x, y, w: 0, h: 0 })
    isDragging.current = true
  }, [])

  // ─── Crop & return result ───
  const handleConfirmCrop = useCallback(() => {
    if (!cropRect || cropRect.w < 5 || cropRect.h < 5 || !imgRef.current) return
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = img.naturalWidth / imgSize.w
    const scaleY = img.naturalHeight / imgSize.h
    canvas.width = Math.round(cropRect.w * scaleX)
    canvas.height = Math.round(cropRect.h * scaleY)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      img,
      Math.round(cropRect.x * scaleX),
      Math.round(cropRect.y * scaleY),
      Math.round(cropRect.w * scaleX),
      Math.round(cropRect.h * scaleY),
      0,
      0,
      canvas.width,
      canvas.height,
    )
    onCrop(canvas.toDataURL('image/png'))
  }, [cropRect, imgSize, onCrop])

  // ─── Click outside image to cancel ───
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onCancel()
    },
    [onCancel],
  )

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] max-w-[90vw] flex-col gap-3 rounded-xl border border-white/15 bg-neutral-900 p-4 shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">
            {cropRect && cropRect.w > 5
              ? `Selection: ${Math.round(cropRect.w)}×${Math.round(cropRect.h)}`
              : 'Drag to select crop area'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmCrop}
              disabled={!cropRect || cropRect.w < 5}
              className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-orange-400 disabled:opacity-30"
            >
              ✂️ Crop & Copy
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/20 hover:text-white"
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Image container */}
        <div
          className="relative inline-block cursor-crosshair overflow-hidden rounded-lg"
          onMouseDown={handleMouseDown}
          style={{ maxHeight: '75vh' }}
        >
          <img
            ref={imgRef}
            src={imageDataUrl}
            onLoad={handleImgLoad}
            className="pointer-events-none block max-h-[75vh] select-none"
            alt="Screenshot to crop"
          />

          {/* Crop selection overlay */}
          {imgLoaded && cropRect && (cropRect.w > 0 || cropRect.h > 0) && (
            <div className="pointer-events-none absolute inset-0">
              {/* Dimmed areas */}
              <div
                className="absolute bg-black/50"
                style={{ top: 0, left: 0, right: 0, height: cropRect.y }}
              />
              <div
                className="absolute bg-black/50"
                style={{
                  top: cropRect.y,
                  left: 0,
                  width: cropRect.x,
                  height: cropRect.h,
                }}
              />
              <div
                className="absolute bg-black/50"
                style={{
                  top: cropRect.y,
                  left: cropRect.x + cropRect.w,
                  right: 0,
                  height: cropRect.h,
                }}
              />
              <div
                className="absolute bg-black/50"
                style={{ top: cropRect.y + cropRect.h, left: 0, right: 0, bottom: 0 }}
              />

              {/* Selection border */}
              <div
                className="absolute border-2 border-orange-400 ring-1 ring-orange-400/30"
                style={{
                  left: cropRect.x,
                  top: cropRect.y,
                  width: cropRect.w,
                  height: cropRect.h,
                }}
              >
                {/* Corner handles */}
                <div className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-orange-400" />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-400" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-orange-400" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-orange-400" />
              </div>

              {/* Size label */}
              <div
                className="absolute -top-7 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-xs text-white/80"
                style={{
                  left: Math.max(0, cropRect.x + cropRect.w / 2 - 30),
                }}
              >
                {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
