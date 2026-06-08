import { animate } from '@motionone/dom'
import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import mapImg from '../../../../map.png'
import { BACKGROUND_LIST } from './backgrounds'
import { EditorToolbar } from './components/EditorToolbar'
import { CheckpointModal } from './components/CheckpointModal'
import { CheckpointActionMenu } from './components/CheckpointActionMenu'
import { LineActionMenu } from './components/LineActionMenu'
import { RouteLayer } from './components/RouteLayer'
import { ActorMarker } from './components/ActorMarker'
import { CheckpointLayer } from './components/CheckpointLayer'
import { PointPopup } from './components/PointPopup'
import { LineBodyPopup } from './components/LineBodyPopup'
import { ConnectAcceptPopup } from './components/ConnectAcceptPopup'
import { DataPanel } from './components/DataPanel'
import { MapDataPicker } from './components/MapDataPicker'
import { AVAILABLE_DATAS } from '../data'
import { ActorSettingsModal } from './components/ActorSettingsModal'
import { IconPicker } from './components/IconPicker'
import type { Checkpoint, Point, Line, MapPoint, WalkingPoint, ActorAssets } from './types'

const presetPoints: Point[] = [
  { x: 84, y: 63 },
  { x: 84, y: 69 },
  { x: 84, y: 83 },
  { x: 78, y: 90 },
  { x: 66, y: 95 },
  { x: 50, y: 97 },
  { x: 34, y: 90 },
  { x: 22, y: 80 },
  { x: 18, y: 72 },
  { x: 20, y: 62 },
  { x: 29, y: 50 },
  { x: 42, y: 40 },
  { x: 54, y: 34 },
  { x: 61, y: 26 },
  { x: 65, y: 20 },
]

// Preset segments between checkpoints (E→D, D→C, C→B, B→A)
const segED: Point[] = presetPoints.slice(2, 6)   // E(84,83)→D(50,97)
const segDC: Point[] = presetPoints.slice(5, 8)   // D(50,97)→C(22,80)
const segCB: Point[] = presetPoints.slice(7, 13)  // C(22,80)→B(54,34)
const segBA: Point[] = presetPoints.slice(12, 15) // B(54,34)→A(65,20)

const buildPath = (points: Point[], endIndex: number) => points.slice(0, endIndex + 1)

const initialLines: Line[] = [
  { id: 'preset-ed', points: [...segED] },
  { id: 'preset-dc', points: [...segDC] },
  { id: 'preset-cb', points: [...segCB] },
  { id: 'preset-ba', points: [...segBA] },
]

const initialCheckpoints: Checkpoint[] = [
  { id: 'cp-e', x: 84, y: 83, label: 'E', lineId: 'preset-ed', pointIndex: 0, path: buildPath(segED, 0) },
  { id: 'cp-d', x: 50, y: 97, label: 'D', lineId: 'preset-ed', pointIndex: 3, path: buildPath(segED, 3) },
  { id: 'cp-c', x: 22, y: 80, label: 'C', lineId: 'preset-dc', pointIndex: 2, path: buildPath(segDC, 2) },
  { id: 'cp-b', x: 54, y: 34, label: 'B', lineId: 'preset-cb', pointIndex: 5, path: buildPath(segCB, 5) },
  { id: 'cp-a', x: 65, y: 20, label: 'A', lineId: 'preset-ba', pointIndex: 2, path: buildPath(segBA, 2) },
]

export function MapCanvas() {
  const actorRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const activeAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const movementTokenRef = useRef(0)
  const isPrependingRef = useRef(false)
  const actorPosRef = useRef<Point>(
    initialLines.length > 0 ? initialLines[0].points[0] : presetPoints[0],
  )
  const pendingMovementRef = useRef<{
    remainingPath: Point[]
    target: Checkpoint | 'start'
    targetId: string
  } | null>(null)

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)

  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null)
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null)
  const [connectSourceType, setConnectSourceType] = useState<'mapPoint' | 'lineEndpoint' | 'checkpoint' | null>(null)
  const [connectSourceEndpoint, setConnectSourceEndpoint] = useState<'start' | 'end' | null>(null)
  const [pendingConnectTargetId, setPendingConnectTargetId] = useState<string | null>(null)
  const [selectedLineBodyId, setSelectedLineBodyId] = useState<string | null>(null)

  const [activeCheckpointId, setActiveCheckpointId] = useState<'start' | string>('start')
  const [isEditorEnabled, setIsEditorEnabled] = useState(false)
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false)
  const [pendingCheckpointPoint, setPendingCheckpointPoint] = useState<Point | null>(null)
  const [pendingCheckpointPath, setPendingCheckpointPath] = useState<Point[] | null>(null)
  const [pendingCheckpointLineId, setPendingCheckpointLineId] = useState<string | null>(null)
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null)
  const [checkpointLabel, setCheckpointLabel] = useState('')
  const [activeCheckpointMenu, setActiveCheckpointMenu] = useState<Checkpoint | null>(null)
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false)
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null)
  const [highlightedCheckpointId, setHighlightedCheckpointId] = useState<string | null>(null)
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null)
  const [pendingDrawConnectCp, setPendingDrawConnectCp] = useState<Checkpoint | null>(null)
  const [scrollAnchor, setScrollAnchor] = useState<Point | null>(null)
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 })
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  // ── hand/pan tool state ──
  const [isPanMode, setIsPanMode] = useState(false)
  const panDragRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // ── zoom state ──
  const [zoom, setZoom] = useState(1)
  const clampZoom = (z: number) => Math.min(3, Math.max(0.25, Math.round(z * 4) / 4))

  // ── fullscreen state ──
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── cosmetic picker state ──
  const [iconPickerCpId, setIconPickerCpId] = useState<string | null>(null)
  const [actorIcon, setActorIcon] = useState<string | undefined>()
  const [actorShape, setActorShape] = useState<'circle' | 'square' | 'rounded' | 'diamond' | 'none'>('circle')
  const [actorSize, setActorSize] = useState<number>(32)
  const [actorBorder, setActorBorder] = useState<'none' | 'thin' | 'normal' | 'thick'>('normal')
  const [actorAssets, setActorAssets] = useState<ActorAssets>({})
  const [actorSpeed, setActorSpeed] = useState<number>(1.0)
  const [actorState, setActorState] = useState<'idle' | 'walking' | 'stop' | 'finish'>('idle')
  const [isActorPickerOpen, setIsActorPickerOpen] = useState(false)

  // ── walking point state ──
  const [selectedWalkingPointId, setSelectedWalkingPointId] = useState<string | null>(null)
  const draggingWalkingPointRef = useRef<{ id: string; lineId: string } | null>(null)

  // ── background ──
  const defaultBg = BACKGROUND_LIST.length > 0 ? BACKGROUND_LIST[0].id : ''
  const [backgroundId, setBackgroundId] = useState(defaultBg)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const backgroundSrc = BACKGROUND_LIST.find((b) => b.id === backgroundId)?.src ?? mapImg
  const [canvasWidth, setCanvasWidth] = useState(2000)
  const [canvasHeight, setCanvasHeight] = useState(2000)

  // ── save/load dialog state ──
  const [isMapDataPickerOpen, setIsMapDataPickerOpen] = useState(false)

  // helper: convert canvas % coords to viewport pixel coords (accounting for scroll + zoom)
  const popupPixelPos = (xPct: number, yPct: number) => ({
    left: xPct * (canvasWidth / 100) * zoom - scrollPos.left,
    top: yPct * (canvasHeight / 100) * zoom - scrollPos.top,
  })

  // auto-scroll to anchor when set
  useEffect(() => {
    if (scrollAnchor && scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [scrollAnchor])

  // Ctrl+wheel zoom — must be passive:false to preventDefault
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom((z) => clampZoom(z - e.deltaY * 0.002))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Insert preset data programmatically — same pathway as dynamic data
  useEffect(() => {
    setLines(initialLines)
    setCheckpoints(initialCheckpoints)
    // Sync actorPosRef with the actual starting position
    const start = initialLines.length > 0 ? initialLines[0].points[0] : presetPoints[0]
    actorPosRef.current = start
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CENTRAL checkpoint tracker ──────────────────────────
  const [checkpointLog, setCheckpointLog] = useState<string[]>([])
  useEffect(() => {
    const entry = `[${new Date().toLocaleTimeString()}] CP:${checkpoints.length} [${checkpoints.map(c => c.label).join(',')}]`
    setCheckpointLog((prev) => [...prev.slice(-9), entry])
  }, [checkpoints])

  // ── keyboard SPACE trigger ──────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        // If paused at walking point, continue movement
        if (pendingMovementRef.current) {
          void continueMovement()
          return
        }
        if (!selectedCheckpointId) return
        const cp = checkpoints.find((c) => c.id === selectedCheckpointId)
        if (cp) {
          setSelectedCheckpointId(null)
          void moveActorTo(cp)
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selectedCheckpointId, checkpoints]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLine = lines.find((l) => l.id === selectedLineId) ?? null
  const selectedPoint = selectedLine && selectedPointIndex != null
    ? selectedLine.points[selectedPointIndex] ?? null
    : null
  const startPoint = lines.length > 0 ? lines[0].points[0] : presetPoints[0]

  const recalcCheckpointPaths = (lineId: string, currentLines: Line[], currentCheckpoints: Checkpoint[]): Checkpoint[] => {
    const line = currentLines.find((l) => l.id === lineId)
    if (!line) return currentCheckpoints
    return currentCheckpoints.map((cp) => {
      if (cp.lineId !== lineId) return cp
      const newPath = line.points.slice(0, cp.pointIndex + 1)
      return newPath.length > 0 ? { ...cp, path: newPath } : cp
    })
  }

  const getCheckpointById = (id: string) =>
    checkpoints.find((c) => c.id === id) ?? null

  // ── menu close ─────────────────────────────────────────

  // ── cosmetic handlers ──
  const onChangeIcon = (cpId: string, icon: string | null) => {
    setCheckpoints((prev) => prev.map((cp) => cp.id === cpId ? { ...cp, icon: icon ?? undefined } : cp))
  }
  const onChangeShape = (cpId: string, shape: 'circle' | 'square' | 'rounded' | 'diamond' | 'none') => {
    setCheckpoints((prev) => prev.map((cp) => cp.id === cpId ? { ...cp, shape } : cp))
  }
  const onChangeSize = (cpId: string, size: number) => {
    setCheckpoints((prev) => prev.map((cp) => cp.id === cpId ? { ...cp, size } : cp))
  }
  const onChangeBorder = (cpId: string, border: 'none' | 'thin' | 'normal' | 'thick') => {
    setCheckpoints((prev) => prev.map((cp) => cp.id === cpId ? { ...cp, border } : cp))
  }

  const onChangeLineStyle = (lineId: string, patch: { color?: string; lineStyle?: 'solid' | 'dashed' | 'dotted'; width?: number; opacity?: number; glow?: boolean }) => {
    setLines((prev) => prev.map((l) => l.id === lineId ? { ...l, ...patch } : l))
  }

  const closeEditorMenus = () => {
    setIconPickerCpId(null)
    setSelectedLineId(null)
    setSelectedPointIndex(null)
    setActiveCheckpointMenu(null)
    setSelectedMapPointId(null)
    setSelectedLineBodyId(null)
    setPendingConnectTargetId(null)
    setHighlightedLineId(null)
    setHighlightedCheckpointId(null)
    setIsCheckpointModalOpen(false)
    setPendingCheckpointPoint(null)
    setPendingCheckpointPath(null)
    setPendingCheckpointLineId(null)
    setEditingCheckpointId(null)
    setCheckpointLabel('')
    setSelectedWalkingPointId(null)
    setSelectedCheckpointId(null)
    pendingMovementRef.current = null
  }

  // ── walking point handlers ──────────────────────────────

  /** Project point P onto line segment AB, return t parameter (0-1) and closest point */
  const projectPointOnSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return { t: 0, x: ax, y: ay, dist: Math.hypot(px - ax, py - ay) }
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    const cx = ax + t * dx
    const cy = ay + t * dy
    return { t, x: cx, y: cy, dist: Math.hypot(px - cx, py - cy) }
  }

  /** Find the best position along a line for a new walking point (midpoint of longest segment) */
  const findBestInsertPosition = (line: Line): { x: number; y: number } => {
    if (line.points.length < 2) return { x: line.points[0]?.x ?? 50, y: line.points[0]?.y ?? 50 }
    let maxLen = 0
    let bestMid = { x: (line.points[0].x + line.points[1].x) / 2, y: (line.points[0].y + line.points[1].y) / 2 }
    for (let i = 0; i < line.points.length - 1; i++) {
      const a = line.points[i]
      const b = line.points[i + 1]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      if (len > maxLen) {
        maxLen = len
        bestMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      }
    }
    return bestMid
  }

  /** Resolve a walking point's position along its line (re-project onto line path) */
  const resolveWalkingPointPosition = (wp: WalkingPoint, line: Line): WalkingPoint => {
    if (line.points.length < 2) return wp
    // find closest segment
    let bestDist = Infinity
    let bestPos = { x: wp.x, y: wp.y }
    for (let i = 0; i < line.points.length - 1; i++) {
      const a = line.points[i]
      const b = line.points[i + 1]
      const result = projectPointOnSegment(wp.x, wp.y, a.x, a.y, b.x, b.y)
      if (result.dist < bestDist) {
        bestDist = result.dist
        bestPos = { x: result.x, y: result.y }
      }
    }
    return { ...wp, x: bestPos.x, y: bestPos.y }
  }

  const addWalkingPoint = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId)
    if (!line || line.points.length < 2) return
    const pos = findBestInsertPosition(line)
    const wp: WalkingPoint = { id: `wp-${Date.now()}`, lineId, x: pos.x, y: pos.y }
    setLines((prev) => prev.map((l) =>
      l.id === lineId
        ? { ...l, walkingPoints: [...(l.walkingPoints ?? []), wp] }
        : l,
    ))
    setSelectedWalkingPointId(wp.id)
  }

  const deleteWalkingPoint = (wpId: string) => {
    setLines((prev) => prev.map((l) => {
      if (!l.walkingPoints) return l
      const filtered = l.walkingPoints.filter((wp) => wp.id !== wpId)
      return filtered.length === 0
        ? { ...l, walkingPoints: undefined }
        : { ...l, walkingPoints: filtered }
    }))
    if (selectedWalkingPointId === wpId) setSelectedWalkingPointId(null)
  }

  const moveWalkingPoint = (wpId: string, x: number, y: number) => {
    setLines((prev) => prev.map((l) => {
      if (!l.walkingPoints) return l
      return {
        ...l,
        walkingPoints: l.walkingPoints.map((wp) =>
          wp.id === wpId ? resolveWalkingPointPosition({ ...wp, x, y }, l) : wp,
        ),
      }
    }))
  }

  /** Get walking point count for a specific line */
  const getWalkingPointCount = (lineId: string): number => {
    const line = lines.find((l) => l.id === lineId)
    return line?.walkingPoints?.length ?? 0
  }

  const toggleEditorEnabled = () => {
    setIsEditorEnabled((prev) => {
      const next = !prev
      if (!next) {
        closeEditorMenus()
        setActorState('idle')
        // move actor back to start when exiting edit mode
        const el = actorRef.current
        if (el) {
          const target = lines.length > 0 ? lines[0].points[0] : presetPoints[0]
          animate(el, { left: `${target.x}%`, top: `${target.y}%` }, { duration: 0.3, easing: 'ease-in-out' })
          actorPosRef.current = target
        }
      }
      return next
    })
  }

  // ── actor movement ─────────────────────────────────────

  /** Collect all walking point keys from all lines */
  const getWalkingPointKeys = (): Set<string> => {
    const wpKeys = new Set<string>()
    for (const line of lines) {
      if (line.walkingPoints) {
        for (const wp of line.walkingPoints) {
          wpKeys.add(ptKey(wp))
        }
      }
    }
    return wpKeys
  }

  const moveActorTo = async (target: Checkpoint | 'start') => {
    const el = actorRef.current
    if (!el) return

    // Clear any pending segmented movement
    pendingMovementRef.current = null

    const targetId = target === 'start' ? 'start' : target.id
    const targetPoint = target === 'start' ? startPoint : { x: target.x, y: target.y }

    if (actorPosRef.current.x === targetPoint.x && actorPosRef.current.y === targetPoint.y) {
      if (target !== 'start') setActorState(target.actorState ?? 'finish')
      else setActorState('idle')
      setActiveCheckpointId(targetId)
      return
    }

    setActorState('walking')
    const path = findPathToPoint(targetPoint)
    if (!path || path.length <= 1) {
      // no line path — direct jump
      movementTokenRef.current += 1
      const token = movementTokenRef.current
      activeAnimationRef.current?.cancel()
      const ctrl = animate(el, { left: `${targetPoint.x}%`, top: `${targetPoint.y}%` }, { duration: 0.25, easing: 'ease-in-out' })
      activeAnimationRef.current = ctrl
      try { await ctrl.finished } catch { return }
      actorPosRef.current = targetPoint
      if (movementTokenRef.current === token) {
        setActorState(target !== 'start' ? (target.actorState ?? 'finish') : 'idle')
        setActiveCheckpointId(targetId)
      }
      return
    }

    movementTokenRef.current += 1
    const token = movementTokenRef.current
    activeAnimationRef.current?.cancel()

    // Find first walking point in path (skip index 0 = start)
    const wpKeys = getWalkingPointKeys()
    let firstWpIdx = -1
    for (let i = 1; i < path.length; i++) {
      if (wpKeys.has(ptKey(path[i]))) {
        firstWpIdx = i
        break
      }
    }

    if (firstWpIdx === -1) {
      // No walking points — animate full path as before
      for (let i = 1; i < path.length; i++) {
        if (movementTokenRef.current !== token) return
        const ctrl = animate(el, { left: `${path[i].x}%`, top: `${path[i].y}%` }, { duration: 0.18 / actorSpeed, easing: 'ease-in-out' })
        activeAnimationRef.current = ctrl
        try { await ctrl.finished } catch { return }
      }
      actorPosRef.current = path[path.length - 1]
      if (movementTokenRef.current === token) {
        setActorState(target !== 'start' ? (target.actorState ?? 'finish') : 'idle')
        setActiveCheckpointId(targetId)
      }
    } else {
      // Animate to first walking point, then pause
      for (let i = 1; i <= firstWpIdx; i++) {
        if (movementTokenRef.current !== token) return
        const ctrl = animate(el, { left: `${path[i].x}%`, top: `${path[i].y}%` }, { duration: 0.18 / actorSpeed, easing: 'ease-in-out' })
        activeAnimationRef.current = ctrl
        try { await ctrl.finished } catch { return }
      }
      actorPosRef.current = path[firstWpIdx]
      if (movementTokenRef.current === token) {
        // Save remaining path for later
        pendingMovementRef.current = {
          remainingPath: path.slice(firstWpIdx),
          target,
          targetId,
        }
        setActorState('stop')
      }
    }
  }

  const continueMovement = async () => {
    const pending = pendingMovementRef.current
    if (!pending) return
    const el = actorRef.current
    if (!el) return

    const { remainingPath, target, targetId } = pending

    movementTokenRef.current += 1
    const token = movementTokenRef.current
    activeAnimationRef.current?.cancel()
    setActorState('walking')

    // Find next walking point in remaining path (skip index 0 = current pos)
    const wpKeys = getWalkingPointKeys()
    let nextWpIdx = -1
    for (let i = 1; i < remainingPath.length; i++) {
      if (wpKeys.has(ptKey(remainingPath[i]))) {
        nextWpIdx = i
        break
      }
    }

    if (nextWpIdx === -1) {
      // No more walking points — animate to final destination
      for (let i = 1; i < remainingPath.length; i++) {
        if (movementTokenRef.current !== token) return
        const ctrl = animate(el, { left: `${remainingPath[i].x}%`, top: `${remainingPath[i].y}%` }, { duration: 0.18 / actorSpeed, easing: 'ease-in-out' })
        activeAnimationRef.current = ctrl
        try { await ctrl.finished } catch { return }
      }
      actorPosRef.current = remainingPath[remainingPath.length - 1]
      pendingMovementRef.current = null
      if (movementTokenRef.current === token) {
        setActorState(target !== 'start' ? (target.actorState ?? 'finish') : 'idle')
        setActiveCheckpointId(targetId)
      }
    } else {
      // Animate to next walking point, then pause again
      for (let i = 1; i <= nextWpIdx; i++) {
        if (movementTokenRef.current !== token) return
        const ctrl = animate(el, { left: `${remainingPath[i].x}%`, top: `${remainingPath[i].y}%` }, { duration: 0.18 / actorSpeed, easing: 'ease-in-out' })
        activeAnimationRef.current = ctrl
        try { await ctrl.finished } catch { return }
      }
      actorPosRef.current = remainingPath[nextWpIdx]
      if (movementTokenRef.current === token) {
        pendingMovementRef.current = {
          remainingPath: remainingPath.slice(nextWpIdx),
          target,
          targetId,
        }
        setActorState('stop')
      }
    }
  }

  // ── point operations ───────────────────────────────────

  const addPointToLine = (lineId: string, point: Point) => {
    setLines((prev) => {
      const updated = prev.map((l) =>
        l.id === lineId ? { ...l, points: [...l.points, point] } : l,
      )
      setCheckpoints((cps) => recalcCheckpointPaths(lineId, updated, cps))
      return updated
    })
  }

  const prependPointToLine = (lineId: string, point: Point) => {
    setLines((prev) => {
      const updated = prev.map((l) =>
        l.id === lineId ? { ...l, points: [point, ...l.points] } : l,
      )
      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== lineId) return cp
          return { ...cp, pointIndex: cp.pointIndex + 1 }
        })
        return recalcCheckpointPaths(lineId, updated, shifted)
      })
      return updated
    })
  }

  const removePointFromLine = (lineId: string, pointIndex: number) => {
    setLines((prev) => {
      const line = prev.find((l) => l.id === lineId)
      if (!line) return prev
      const newPoints = line.points.filter((_, i) => i !== pointIndex)
      if (newPoints.length < 2) {
        const filtered = prev.filter((l) => l.id !== lineId)
        setCheckpoints((cps) => cps.map((cp) => (cp.lineId === lineId ? { ...cp, lineId: '' } : cp)))
        if (activeLineId === lineId) setActiveLineId(null)
        return filtered
      }
      const updated = prev.map((l) => (l.id === lineId ? { ...l, points: newPoints } : l))
      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== lineId) return cp
          if (cp.pointIndex < pointIndex) return cp
          if (cp.pointIndex === pointIndex) return { ...cp, pointIndex: Math.max(0, cp.pointIndex - 1) }
          return { ...cp, pointIndex: cp.pointIndex - 1 }
        })
        return recalcCheckpointPaths(lineId, updated, shifted)
      })
      return updated
    })
  }

  // ── hand/pan tool ──────────────────────────────────────

  const onPanMouseDown = (e: React.MouseEvent) => {
    if (!isPanMode) return
    e.preventDefault()
    const sc = scrollContainerRef.current
    if (!sc) return
    panDragRef.current = { startX: e.clientX, startY: e.clientY, scrollLeft: sc.scrollLeft, scrollTop: sc.scrollTop }
    const onMove = (ev: globalThis.MouseEvent) => {
      const d = panDragRef.current
      if (!d) return
      sc.scrollLeft = d.scrollLeft - (ev.clientX - d.startX)
      sc.scrollTop = d.scrollTop - (ev.clientY - d.startY)
    }
    const onUp = () => {
      panDragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── walking point drag ─────────────────────────────────

  const isDraggingWpRef = useRef(false)

  const onWalkingPointMouseDown = (e: React.MouseEvent, wp: WalkingPoint) => {
    if (!isEditorEnabled || isPanMode) return
    e.stopPropagation()
    e.preventDefault()
    draggingWalkingPointRef.current = { id: wp.id, lineId: wp.lineId }
    setSelectedWalkingPointId(wp.id)

    const canvas = canvasRef.current
    if (!canvas) return
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!draggingWalkingPointRef.current) return
      if (isDraggingWpRef.current == false) {
        isDraggingWpRef.current = true
      }
      const rect = canvas.getBoundingClientRect()
      const x = ((ev.clientX - rect.left) / rect.width) * 100
      const y = ((ev.clientY - rect.top) / rect.height) * 100
      moveWalkingPoint(draggingWalkingPointRef.current.id, x, y)
    }
    const onUp = () => {
      draggingWalkingPointRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── line draw / click ──────────────────────────────────

  /** Distance from point P to line segment AB (in % coords). Returns ~% distance. */
  const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(px - ax, py - ay)
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
  }

  /** Find the closest line to a click point. Returns lineId if within threshold. */
  const findLineAtPoint = (pt: Point, threshold = 2): string | null => {
    let closest: { id: string; dist: number } | null = null
    for (const line of lines) {
      if (line.points.length < 2) continue
      for (let i = 0; i < line.points.length - 1; i++) {
        const a = line.points[i]
        const b = line.points[i + 1]
        const d = distToSegment(pt.x, pt.y, a.x, a.y, b.x, b.y)
        if (d < threshold && (!closest || d < closest.dist)) {
          closest = { id: line.id, dist: d }
        }
      }
    }
    return closest?.id ?? null
  }

  const openLinePoint = (event: MouseEvent<HTMLDivElement>) => {
    if (isPanMode) return
    if (!isEditorEnabled || isCheckpointModalOpen) return
    if (isDraggingWpRef.current == true) {
      isDraggingWpRef.current = false
      return
    }
    isDraggingWpRef.current = false
    const rect = event.currentTarget.getBoundingClientRect()
    const point: Point = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    }

    // connect mode active — connect to target
    if (connectSourceId) {
      connectToMapPoint(point)
      return
    }

    // drawing line active — add point
    if (activeLineId) {
      if (isPrependingRef.current) {
        prependPointToLine(activeLineId, point)
      } else {
        addPointToLine(activeLineId, point)
      }
      return
    }

    // click on existing line body → open line body menu
    const hitLineId = findLineAtPoint(point)
    if (hitLineId) {
      openLineBody(hitLineId)
      return
    }

    // default: open checkpoint modal to create free checkpoint
    closeEditorMenus()
    setPendingCheckpointPoint(point)
    setPendingCheckpointPath([point])
    setPendingCheckpointLineId(null)
    setEditingCheckpointId(null)
    setCheckpointLabel(`CP${checkpoints.length + 1}`)
    setIsCheckpointModalOpen(true)
  }

  const finishDrawing = () => {
    if (!activeLineId) return
    const line = lines.find((l) => l.id === activeLineId)
    if (!line || line.points.length < 2) {
      // discard lines with < 2 points
      setLines((prev) => prev.filter((l) => l.id !== activeLineId))
      setActiveLineId(null)
      isPrependingRef.current = false
      return
    }
    const lastPt = line.points[line.points.length - 1]
    // open checkpoint modal to name the endpoint
    setPendingCheckpointPoint(lastPt)
    setPendingCheckpointPath([...line.points])
    setPendingCheckpointLineId(activeLineId)
    setEditingCheckpointId(null)
    setCheckpointLabel(`CP${checkpoints.length + 1}`)
    setIsCheckpointModalOpen(true)
    setActiveLineId(null)
    isPrependingRef.current = false
  }

  const acceptDrawConnect = () => {
    if (!activeLineId || !pendingDrawConnectCp) return
    const cp = pendingDrawConnectCp
    const cpPos = { x: cp.x, y: cp.y }
    const lid = activeLineId

    // Step 1: append checkpoint position to line, then register checkpoint
    // We do everything inside setLines to guarantee we have the correct final points
    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id !== lid) return l
        return { ...l, points: [...l.points, cpPos] }
      })
      const finalLine = updated.find((l) => l.id === lid)
      if (finalLine) {
        // Register target checkpoint + recalc siblings in one pass
        const fp = finalLine.points
        setCheckpoints((cps) =>
          cps.map((c) => {
            if (c.id === cp.id) {
              return { ...c, lineId: lid, pointIndex: fp.length - 1, path: [...fp] }
            }
            if (c.lineId === lid) {
              const newPath = fp.slice(0, c.pointIndex + 1)
              return newPath.length > 0 ? { ...c, path: newPath } : c
            }
            return c
          }),
        )
      }
      return updated
    })

    // Step 2: finish drawing
    setPendingDrawConnectCp(null)
    setActiveLineId(null)
    isPrependingRef.current = false
  }

  const dismissDrawConnect = () => {
    setPendingDrawConnectCp(null)
  }

  const startLineFrom = (point: Point) => {
    closeEditorMenus()
    isPrependingRef.current = false
    const newId = `line-${Date.now()}`
    setLines((prev) => [...prev, { id: newId, points: [point] }])
    setActiveLineId(newId)
  }

  // ── join lines ─────────────────────────────────────────

  const joinLines = (
    srcLineId: string, srcEp: 'start' | 'end',
    tgtLineId: string, tgtEp: 'start' | 'end',
  ) => {
    setLines((prev) => {
      const src = prev.find((l) => l.id === srcLineId)
      const tgt = prev.find((l) => l.id === tgtLineId)
      if (!src || !tgt || srcLineId === tgtLineId) return prev

      let combined: Point[]
      if (srcEp === 'start' && tgtEp === 'start') {
        combined = [...tgt.points.slice().reverse(), ...src.points.slice(1)]
      } else if (srcEp === 'start' && tgtEp === 'end') {
        combined = [...tgt.points, ...src.points.slice(1)]
      } else if (srcEp === 'end' && tgtEp === 'start') {
        combined = [...src.points, ...tgt.points.slice(1)]
      } else {
        combined = [...src.points, ...tgt.points.slice().reverse().slice(1)]
      }

      const updated = prev
        .filter((l) => l.id !== tgtLineId)
        .map((l) => (l.id === srcLineId ? { ...l, points: combined } : l))

      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== tgtLineId) return cp
          let offset: number
          if (srcEp === 'start' && tgtEp === 'start') offset = tgt.points.length - 1 - cp.pointIndex
          else if (srcEp === 'start' && tgtEp === 'end') offset = cp.pointIndex
          else if (srcEp === 'end' && tgtEp === 'start') offset = src.points.length - 1 + cp.pointIndex
          else offset = src.points.length - 1 + (tgt.points.length - 1 - cp.pointIndex)
          return { ...cp, lineId: srcLineId, pointIndex: offset }
        })
        return recalcCheckpointPaths(srcLineId, updated, shifted)
      })

      return updated
    })

    setActiveLineId(null)
    closeEditorMenus()
  }

  // ── delete line ────────────────────────────────────────

  const deleteLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    setCheckpoints((prev) => prev.map((cp) => (cp.lineId === lineId ? { ...cp, lineId: '' } : cp)))
    if (activeLineId === lineId) setActiveLineId(null)
    if (selectedLineId === lineId) setSelectedLineId(null)
    // clear selected walking point if it belonged to the deleted line
    setSelectedWalkingPointId(null)
    closeEditorMenus()
  }

  // ── endpoint click ─────────────────────────────────────

  const openEndpointMenu = (lineId: string, endpoint: 'start' | 'end') => {
    if (!isEditorEnabled) return
    if (connectSourceId) {
      finishConnectToEndpoint(lineId, endpoint)
      return
    }
    if (activeLineId) { joinLines(activeLineId, 'end', lineId, endpoint); return }
    // normal mode: show line action menu at this endpoint
    const line = lines.find((l) => l.id === lineId)
    if (!line) return
    const idx = endpoint === 'start' ? 0 : line.points.length - 1
    openLineMenu(lineId, idx)
  }

  // ── checkpoint modal ───────────────────────────────────

  const openCheckpointEditModal = (cp: Checkpoint) => {
    if (!isEditorEnabled) return
    setPendingCheckpointPoint(cp)
    setPendingCheckpointPath(cp.path)
    setEditingCheckpointId(cp.id)
    setCheckpointLabel(cp.label)
    setIsCheckpointModalOpen(true)
    setActiveCheckpointMenu(null)
    setSelectedLineId(null)
    setSelectedPointIndex(null)
  }

  const closeCheckpointModal = () => {
    setIsCheckpointModalOpen(false)
    setPendingCheckpointPoint(null)
    setPendingCheckpointPath(null)
    setPendingCheckpointLineId(null)
    setEditingCheckpointId(null)
    setCheckpointLabel('')
  }

  const saveCheckpoint = () => {
    if (!pendingCheckpointPoint) return
    const label = checkpointLabel.trim()

    // if editing a map point label OR creating free checkpoint (path length=1)
    if (!pendingCheckpointPath || pendingCheckpointPath.length === 1) {
      const mpId = mapPoints.find((mp) => mp.x === pendingCheckpointPoint.x && mp.y === pendingCheckpointPoint.y)?.id
      if (mpId && label) {
        // editing map point label
        setMapPoints((prev) => prev.map((mp) => mp.id === mpId ? { ...mp, label } : mp))
        closeCheckpointModal()
        return
      }
      if (!mpId && label && pendingCheckpointPath && pendingCheckpointPath.length === 1) {
        // creating free checkpoint at arbitrary point
        const id = `cp-${Date.now()}`
        setCheckpoints((prev) => [
          ...prev,
          { id, label: label || `CP${checkpoints.length + 1}`, x: pendingCheckpointPoint.x, y: pendingCheckpointPoint.y, lineId: '', pointIndex: 0, path: pendingCheckpointPath },
        ])
        setActiveCheckpointId(id)
        closeCheckpointModal()
        return
      }
      closeCheckpointModal()
      return
    }

    if (!pendingCheckpointPath) return
    const pointIndex = Math.max(0, pendingCheckpointPath.length - 1)
    const finalLabel = label || `CP${checkpoints.length + 1}`
    const lineId = editingCheckpointId
      ? getCheckpointById(editingCheckpointId)?.lineId ?? ''
      : pendingCheckpointLineId ?? ''

    if (editingCheckpointId) {
      setCheckpoints((prev) =>
        prev.map((cp) =>
          cp.id === editingCheckpointId
            ? { ...cp, label: finalLabel, x: pendingCheckpointPoint.x, y: pendingCheckpointPoint.y, lineId, pointIndex, path: pendingCheckpointPath }
            : cp,
        ),
      )
      setActiveCheckpointId(editingCheckpointId)
    } else {
      const id = `cp-${Date.now()}`
      setCheckpoints((prev) => [
        ...prev,
        { id, label: finalLabel, x: pendingCheckpointPoint.x, y: pendingCheckpointPoint.y, lineId, pointIndex, path: pendingCheckpointPath },
      ])
      setActiveCheckpointId(id)
    }
    closeCheckpointModal()
  }

  // ── checkpoint menu ────────────────────────────────────

  const openCheckpointMenu = (cp: Checkpoint) => {
    if (isPanMode) return
    if (!isEditorEnabled) return
    // Drawing line: allow connect to any free checkpoint or checkpoints on other lines
    if (activeLineId) {
      // Block only if this checkpoint is the source of the current line
      const lineCheckpoints = checkpoints.filter((c) => c.lineId === activeLineId)
      const isSource = lineCheckpoints.some((c) => c.x === cp.x && c.y === cp.y)
      if (isSource) {
        alert(`Checkpoint "${cp.label}" adalah titik awal jalur ini.`)
        return
      }
      setPendingDrawConnectCp(cp)
      return
    }
    // connect mode: show checkpoint menu with accept option
    if (connectSourceId) {
      if (connectSourceId === cp.id) return
      closeEditorMenus()
      setActiveCheckpointMenu(cp)
      return
    }
    setActiveCheckpointMenu(cp)
    setSelectedLineId(null)
    setSelectedPointIndex(null)
  }

  const closeCheckpointMenu = () => setActiveCheckpointMenu(null)

  const deleteCheckpoint = (id: string) => {
    const cp = checkpoints.find((c) => c.id === id)
    if (!cp) return

    // Scan: find ALL lines where this checkpoint participates
    // A checkpoint participates if:
    //   1) cp.lineId === line.id (explicit registration), OR
    //   2) cp is at an endpoint of the line (position match)
    const ownedLineIds = new Set<string>()
    lines.forEach((l) => {
      if (cp.lineId === l.id) {
        ownedLineIds.add(l.id)
        return
      }
      // fallback: check if cp position matches an endpoint of this line
      if (l.points.length >= 2) {
        const first = l.points[0]
        const last = l.points[l.points.length - 1]
        if ((first.x === cp.x && first.y === cp.y) || (last.x === cp.x && last.y === cp.y)) {
          ownedLineIds.add(l.id)
        }
      }
    })

    // Delete all owned lines + free checkpoints on those lines
    if (ownedLineIds.size > 0) {
      setLines((prev) => prev.filter((l) => !ownedLineIds.has(l.id)))
      setCheckpoints((prev) =>
        prev.map((c) =>
          c.id !== id && ownedLineIds.has(c.lineId) ? { ...c, lineId: '', path: [] } : c
        )
      )
    }

    // Delete the checkpoint itself
    setCheckpoints((prev) => prev.filter((c) => c.id !== id))

    if (activeCheckpointId === id) setActiveCheckpointId('start')
    if (editingCheckpointId === id) {
      setEditingCheckpointId(null)
      setPendingCheckpointPath(null)
      setPendingCheckpointPoint(null)
      setPendingCheckpointLineId(null)
      setCheckpointLabel('')
      setIsCheckpointModalOpen(false)
    }
    setActiveCheckpointMenu(null)
  }

  // ── line menu ──────────────────────────────────────────

  const openLineMenu = (lineId: string, pointIndex?: number) => {
    if (!isEditorEnabled) return
    if (activeLineId) {
      const line = lines.find((l) => l.id === lineId)
      if (line && pointIndex != null && pointIndex >= 0) {
        joinLines(activeLineId, 'end', lineId, pointIndex === 0 ? 'start' : 'end')
        return
      }
    }
    setSelectedLineId(lineId)
    setSelectedPointIndex(pointIndex ?? null)
    setActiveCheckpointMenu(null)
  }

  const closeLineMenu = () => {
    setSelectedLineId(null)
    setSelectedPointIndex(null)
  }

  const startLineFromSelected = () => {
    if (!selectedLine || selectedPointIndex == null) return
    const pt = selectedLine.points[selectedPointIndex]
    if (pt) startLineFrom(pt)
  }

  const addPointNearSelected = () => {
    if (!selectedLine || selectedPointIndex == null) return
    const curr = selectedLine.points[selectedPointIndex]
    if (!curr) return
    const nextPt = selectedLine.points[selectedPointIndex + 1]
    const mid: Point = nextPt
      ? { x: (curr.x + nextPt.x) / 2, y: (curr.y + nextPt.y) / 2 }
      : { x: curr.x + 2, y: curr.y + 2 }

    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id !== selectedLine.id) return l
        const pts = [...l.points]
        pts.splice(selectedPointIndex + 1, 0, mid)
        return { ...l, points: pts }
      })
      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== selectedLine.id) return cp
          if (cp.pointIndex > selectedPointIndex) return { ...cp, pointIndex: cp.pointIndex + 1 }
          return cp
        })
        return recalcCheckpointPaths(selectedLine.id, updated, shifted)
      })
      return updated
    })
  }

  const deleteSelectedLine = () => {
    if (selectedLineId) deleteLine(selectedLineId)
    closeEditorMenus()
  }

  const deleteSelectedPoint = () => {
    if (selectedLineId && selectedPointIndex != null) {
      removePointFromLine(selectedLineId, selectedPointIndex)
      closeEditorMenus()
    }
  }

  const createCheckpointAtSelected = () => {
    if (!selectedLine || selectedPointIndex == null) return
    const pt = selectedLine.points[selectedPointIndex]
    if (!pt) return
    const path = selectedLine.points.slice(0, selectedPointIndex + 1)
    const id = `cp-${Date.now()}`
    const label = `CP${checkpoints.length + 1}`
    setCheckpoints((prev) => [
      ...prev,
      { id, label, x: pt.x, y: pt.y, lineId: selectedLine.id, pointIndex: selectedPointIndex, path },
    ])
    closeEditorMenus()
  }

  // ── json export ────────────────────────────────────────

  // ── save/load JSON ──

  const handleSaveJson = (name: string) => {
    const data = {
      templateName: name,
      backgroundId,
      backgroundColor,
      checkpoints,
      lines,
      mapPoints,
      actor: { icon: actorIcon, shape: actorShape, size: actorSize, border: actorBorder, assets: actorAssets, speed: actorSpeed },
    }
    const json = JSON.stringify(data, null, 2)
    const safeName = name.trim().replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoadDataById = (id: string) => {
    const entry = AVAILABLE_DATAS.find((d) => d.id === id)
    if (!entry) return
    if (entry.backgroundId && BACKGROUND_LIST.some((b) => b.id === entry.backgroundId)) {
      setBackgroundId(entry.backgroundId)
    }
    if (entry.backgroundColor) setBackgroundColor(entry.backgroundColor)
    if (entry.checkpoints) setCheckpoints(entry.checkpoints)
    if (entry.lines) setLines(entry.lines)
    if (entry.mapPoints) setMapPoints(entry.mapPoints)
    if (entry.actor) {
      if (entry.actor.icon !== undefined) setActorIcon(entry.actor.icon)
      if (entry.actor.shape) setActorShape(entry.actor.shape)
      if (entry.actor.size) setActorSize(entry.actor.size)
      if (entry.actor.border) setActorBorder(entry.actor.border)
      if (entry.actor.assets) setActorAssets(entry.actor.assets)
      if (entry.actor.speed) setActorSpeed(entry.actor.speed)
    }
    // Reset actor position to start of newly loaded data
    const newStart = entry.lines && entry.lines.length > 0
      ? entry.lines[0].points[0]
      : presetPoints[0]
    actorPosRef.current = newStart
    const el = actorRef.current
    if (el) {
      animate(el, { left: `${newStart.x}%`, top: `${newStart.y}%` }, { duration: 0.3, easing: 'ease-in-out' })
    }
    setActorState('idle')
    setActiveCheckpointId('start')
    setSelectedCheckpointId(null)
    pendingMovementRef.current = null
  }

  // ── map point animation ───────────────────────────────

  const ptKey = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

  /** Find which segment a walking point belongs to and its parameter t ∈ [0,1] */
  const projectOnSegments = (wp: Point, segments: { a: Point; b: Point; idx: number }[]) => {
    let best = { idx: 0, t: 0, dist: Infinity }
    for (const seg of segments) {
      const dx = seg.b.x - seg.a.x
      const dy = seg.b.y - seg.a.y
      const lenSq = dx * dx + dy * dy
      let t = lenSq === 0 ? 0 : ((wp.x - seg.a.x) * dx + (wp.y - seg.a.y) * dy) / lenSq
      t = Math.max(0, Math.min(1, t))
      const px = seg.a.x + t * dx
      const py = seg.a.y + t * dy
      const dist = (wp.x - px) ** 2 + (wp.y - py) ** 2
      if (dist < best.dist) best = { idx: seg.idx, t, dist }
    }
    return best
  }

  const buildLineGraph = () => {
    const adj = new Map<string, string[]>()
    const addEdge = (a: string, b: string) => {
      if (a === b) return
      if (!adj.has(a)) adj.set(a, [])
      if (!adj.has(b)) adj.set(b, [])
      adj.get(a)!.push(b)
      adj.get(b)!.push(a)
    }
    for (const line of lines) {
      const pts = line.points
      if (pts.length < 2) continue

      // Build segments for projection
      const segments = pts.slice(0, -1).map((a, i) => ({ a, b: pts[i + 1], idx: i }))

      // Group walking points by segment index, sorted by t
      const wpBySegment = new Map<number, { wp: Point; t: number }[]>()
      if (line.walkingPoints && line.walkingPoints.length > 0) {
        for (const wp of line.walkingPoints) {
          const proj = projectOnSegments(wp, segments)
          const bucket = wpBySegment.get(proj.idx) ?? []
          bucket.push({ wp, t: proj.t })
          wpBySegment.set(proj.idx, bucket)
        }
        // Sort each bucket by t so walking points are in order along the segment
        for (const bucket of wpBySegment.values()) {
          bucket.sort((a, b) => a.t - b.t)
        }
      }

      // Build edges: vertex[i] → (sorted walking points on segment i) → vertex[i+1]
      for (let i = 0; i < pts.length - 1; i++) {
        const chain = wpBySegment.get(i) ?? []
        const prev = ptKey(pts[i])
        const next = ptKey(pts[i + 1])
        if (chain.length === 0) {
          // No walking points — direct edge
          addEdge(prev, next)
        } else {
          // vertex[i] → wp[0] → wp[1] → ... → vertex[i+1]
          let current = prev
          for (const { wp } of chain) {
            const wpk = ptKey(wp)
            addEdge(current, wpk)
            current = wpk
          }
          addEdge(current, next)
        }
      }
    }
    return adj
  }

  const findPathToPoint = (target: Point): Point[] | null => {
    const current = actorPosRef.current
    const startKey = ptKey(current)
    const targetKey = ptKey(target)
    if (startKey === targetKey) return null

    const adj = buildLineGraph()
    if (!adj.has(startKey) && !adj.has(targetKey)) return null

    // ensure start is in graph (add itself as isolated)
    if (!adj.has(startKey)) adj.set(startKey, [])

    // BFS
    const visited = new Set<string>()
    const parent = new Map<string, string | null>()
    const queue: string[] = [startKey]
    visited.add(startKey)
    parent.set(startKey, null)

    while (queue.length > 0) {
      const cur = queue.shift()!
      if (cur === targetKey) {
        // reconstruct path
        const path: string[] = []
        let node: string | null = targetKey
        while (node) {
          path.push(node)
          node = parent.get(node) ?? null
        }
        path.reverse()
        return path.map((s) => {
          const [x, y] = s.split(',').map(Number)
          return { x, y }
        })
      }
      for (const nb of adj.get(cur) ?? []) {
        if (!visited.has(nb)) {
          visited.add(nb)
          parent.set(nb, cur)
          queue.push(nb)
        }
      }
    }
    return null
  }

  const moveActorToPoint = async (target: Point) => {
    const el = actorRef.current
    if (!el) return

    // Clear any pending segmented movement
    pendingMovementRef.current = null

    setActorState('walking')
    const path = findPathToPoint(target)
    if (!path || path.length <= 1) {
      // no line path — direct jump
      movementTokenRef.current += 1
      const token = movementTokenRef.current
      activeAnimationRef.current?.cancel()
      const ctrl = animate(el, { left: `${target.x}%`, top: `${target.y}%` }, { duration: 0.25, easing: 'ease-in-out' })
      activeAnimationRef.current = ctrl
      try { await ctrl.finished } catch { return }
      actorPosRef.current = target
      if (movementTokenRef.current === token) {
        setActorState('idle')
        setActiveCheckpointId('start')
      }
      return
    }

    movementTokenRef.current += 1
    const token = movementTokenRef.current
    activeAnimationRef.current?.cancel()

    for (let i = 1; i < path.length; i++) {
      if (movementTokenRef.current !== token) return
      const ctrl = animate(el, { left: `${path[i].x}%`, top: `${path[i].y}%` }, { duration: 0.2 / actorSpeed, easing: 'ease-in-out' })
      activeAnimationRef.current = ctrl
      try { await ctrl.finished } catch { return }
    }

    actorPosRef.current = path[path.length - 1]
    if (movementTokenRef.current === token) {
      setActorState('idle')
      setActiveCheckpointId('start')
    }
  }

  // ── map point menu ─────────────────────────────────────

  const openMapPointMenu = (pointId: string) => {
    if (!isEditorEnabled) return
    // connect mode: show accept/close popup on target
    if (connectSourceId) {
      closeEditorMenus()
      setPendingConnectTargetId(pointId)
      return
    }
    closeEditorMenus()
    setSelectedMapPointId(pointId)
  }

  const closeMapPointMenu = () => {
    setSelectedMapPointId(null)
  }

  // ── connect mode ───────────────────────────────────────

  const startConnect = (sourceId: string, type: 'mapPoint' | 'lineEndpoint' | 'checkpoint', endpoint?: 'start' | 'end') => {
    setConnectSourceId(sourceId)
    setConnectSourceType(type)
    setConnectSourceEndpoint(endpoint ?? null)
    closeEditorMenus()
  }

  const cancelConnect = () => {
    setConnectSourceId(null)
    setConnectSourceType(null)
    setConnectSourceEndpoint(null)
    setPendingConnectTargetId(null)
    setActiveCheckpointMenu(null)
  }

  const acceptConnectTarget = () => {
    if (!pendingConnectTargetId) return
    finishConnectToMapPoint(pendingConnectTargetId)
    setPendingConnectTargetId(null)
  }

  const rejectConnectTarget = () => {
    setPendingConnectTargetId(null)
  }

  const finishConnectToCheckpoint = (targetCpId: string) => {
    if (!connectSourceId || !connectSourceType) return
    const target = checkpoints.find((cp) => cp.id === targetCpId)
    if (!target) return

    if (connectSourceType === 'checkpoint') {
      const src = checkpoints.find((cp) => cp.id === connectSourceId)
      if (!src) return
      const newId = `line-${Date.now()}`
      const points: Point[] = [{ x: src.x, y: src.y }, { x: target.x, y: target.y }]
      setLines((prev) => [...prev, { id: newId, points }])
      // register both checkpoints to the new line
      setCheckpoints((prev) =>
        prev.map((cp) => {
          if (cp.id === connectSourceId) return { ...cp, lineId: newId, pointIndex: 0, path: points.slice(0, 1) }
          if (cp.id === targetCpId) return { ...cp, lineId: newId, pointIndex: 1, path: points.slice(0, 2) }
          return cp
        }),
      )
    } else if (connectSourceType === 'mapPoint') {
      const src = mapPoints.find((mp) => mp.id === connectSourceId)
      if (!src) return
      const newId = `line-${Date.now()}`
      setLines((prev) => [...prev, { id: newId, points: [{ x: src.x, y: src.y }, { x: target.x, y: target.y }] }])
      // register target checkpoint to the new line
      const points: Point[] = [{ x: src.x, y: src.y }, { x: target.x, y: target.y }]
      setCheckpoints((prev) =>
        prev.map((cp) =>
          cp.id === targetCpId
            ? { ...cp, lineId: newId, pointIndex: 1, path: points.slice(0, 2) }
            : cp,
        ),
      )
    } else if (connectSourceType === 'lineEndpoint') {
      // extend line to include the target checkpoint, and register the checkpoint
      setLines((prev) => {
        const updated = prev.map((l) => {
          if (l.id !== connectSourceId) return l
          if (connectSourceEndpoint === 'start') {
            return { ...l, points: [{ x: target.x, y: target.y }, ...l.points] }
          } else {
            return { ...l, points: [...l.points, { x: target.x, y: target.y }] }
          }
        })
        const newLine = updated.find((l) => l.id === connectSourceId)
        setCheckpoints((cps) => {
          if (!newLine) return cps
          const newPointIndex = connectSourceEndpoint === 'start' ? 0 : newLine.points.length - 1
          const shifted = cps.map((cp) => {
            if (cp.id === targetCpId) return { ...cp, lineId: connectSourceId, pointIndex: newPointIndex, path: [...newLine.points.slice(0, newPointIndex + 1)] }
            if (cp.lineId !== connectSourceId) return cp
            if (connectSourceEndpoint === 'start') return { ...cp, pointIndex: cp.pointIndex + 1 }
            return cp
          })
          return recalcCheckpointPaths(connectSourceId, updated, shifted)
        })
        return updated
      })
    }

    cancelConnect()
  }

  const finishConnectToMapPoint = (targetPointId: string) => {
    if (!connectSourceId || !connectSourceType) return
    const target = mapPoints.find((mp) => mp.id === targetPointId)
    if (!target) return

    if (connectSourceType === 'mapPoint') {
      // MapPoint → MapPoint: create new line between them (points stay)
      const src = mapPoints.find((mp) => mp.id === connectSourceId)
      if (!src) return
      const newId = `line-${Date.now()}`
      setLines((prev) => [...prev, { id: newId, points: [{ x: src.x, y: src.y }, { x: target.x, y: target.y }] }])
    } else if (connectSourceType === 'lineEndpoint') {
      // line endpoint → MapPoint: append map point to line
      connectLineEndpointToPoint(connectSourceId, connectSourceEndpoint!, target)
    } else if (connectSourceType === 'checkpoint') {
      const src = checkpoints.find((cp) => cp.id === connectSourceId)
      if (!src) return
      const newId = `line-${Date.now()}`
      const points: Point[] = [{ x: src.x, y: src.y }, { x: target.x, y: target.y }]
      setLines((prev) => [...prev, { id: newId, points }])
      // register target map point as a checkpoint on the new line
      const cpId = `cp-${Date.now()}`
      const cpLabel = `CP${checkpoints.length + 1}`
      setCheckpoints((prev) => [
        ...prev,
        { id: cpId, label: cpLabel, x: target.x, y: target.y, lineId: newId, pointIndex: 1, path: points.slice(0, 2) },
      ])
    }

    cancelConnect()
  }

  const finishConnectToEndpoint = (lineId: string, endpoint: 'start' | 'end') => {
    if (!connectSourceId || !connectSourceType) return

    if (connectSourceType === 'mapPoint') {
      const src = mapPoints.find((mp) => mp.id === connectSourceId)
      if (!src) return
      connectMapPointToLineEndpoint(src, lineId, endpoint)
    } else if (connectSourceType === 'lineEndpoint') {
      // line endpoint → line endpoint: join lines
      joinLines(connectSourceId, connectSourceEndpoint!, lineId, endpoint)
    } else if (connectSourceType === 'checkpoint') {
      const src = checkpoints.find((cp) => cp.id === connectSourceId)
      if (!src) return
      const points: Point[] = [{ x: src.x, y: src.y }]
      setLines((prev) => {
        const updated = prev.map((l) => {
          if (l.id !== lineId) return l
          if (endpoint === 'start') {
            return { ...l, points: [points[0], ...l.points] }
          }
          return { ...l, points: [...l.points, points[0]] }
        })
        setCheckpoints((cps) => {
          const shifted = cps.map((cp) => {
            if (cp.lineId !== lineId) return cp
            if (endpoint === 'start') return { ...cp, pointIndex: cp.pointIndex + 1 }
            return cp
          })
          return recalcCheckpointPaths(lineId, updated, shifted)
        })
        return updated
      })
    }

    cancelConnect()
  }

  const connectToMapPoint = (point: Point) => {
    // clicked empty space while in connect mode — create map point and connect
    if (!connectSourceId || !connectSourceType) return
    const mpId = `mp-${Date.now()}`
    const label = `P${mapPoints.length + 1}`
    const newMp: MapPoint = { id: mpId, x: point.x, y: point.y, label }

    if (connectSourceType === 'mapPoint') {
      const src = mapPoints.find((mp) => mp.id === connectSourceId)
      if (src) {
        // keep both map points, create line between them
        setMapPoints((prev) => [...prev, newMp])
        const newId = `line-${Date.now()}`
        setLines((prev) => [...prev, { id: newId, points: [{ x: src.x, y: src.y }, { x: point.x, y: point.y }] }])
      }
    } else if (connectSourceType === 'lineEndpoint') {
      setMapPoints((prev) => [...prev, newMp])
      connectLineEndpointToPoint(connectSourceId, connectSourceEndpoint!, newMp)
    } else if (connectSourceType === 'checkpoint') {
      const src = checkpoints.find((cp) => cp.id === connectSourceId)
      if (src) {
        setMapPoints((prev) => [...prev, newMp])
        const newId = `line-${Date.now()}`
        setLines((prev) => [...prev, { id: newId, points: [{ x: src.x, y: src.y }, { x: point.x, y: point.y }] }])
      }
    }

    cancelConnect()
  }

  const connectLineEndpointToPoint = (lineId: string, endpoint: 'start' | 'end', mp: MapPoint) => {
    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id !== lineId) return l
        if (endpoint === 'start') {
          return { ...l, points: [{ x: mp.x, y: mp.y }, ...l.points] }
        } else {
          return { ...l, points: [...l.points, { x: mp.x, y: mp.y }] }
        }
      })
      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== lineId) return cp
          if (endpoint === 'start') return { ...cp, pointIndex: cp.pointIndex + 1 }
          return cp
        })
        return recalcCheckpointPaths(lineId, updated, shifted)
      })
      return updated
    })
  }

  const connectMapPointToLineEndpoint = (src: MapPoint, lineId: string, endpoint: 'start' | 'end') => {
    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id !== lineId) return l
        if (endpoint === 'start') {
          return { ...l, points: [{ x: src.x, y: src.y }, ...l.points] }
        } else {
          return { ...l, points: [...l.points, { x: src.x, y: src.y }] }
        }
      })
      setCheckpoints((cps) => {
        const shifted = cps.map((cp) => {
          if (cp.lineId !== lineId) return cp
          if (endpoint === 'start') return { ...cp, pointIndex: cp.pointIndex + 1 }
          return cp
        })
        return recalcCheckpointPaths(lineId, updated, shifted)
      })
      return updated
    })
  }

  // ── map point delete (cascade) ─────────────────────────

  const deleteMapPoint = (pointId: string) => {
    const mp = mapPoints.find((p) => p.id === pointId)
    if (!mp) return

    // find all lines that have this point as an endpoint
    const affectedLines = lines.filter((l) => {
      if (l.points.length === 0) return false
      const first = l.points[0]
      const last = l.points[l.points.length - 1]
      return (first.x === mp.x && first.y === mp.y) || (last.x === mp.x && last.y === mp.y)
    })

    // delete all affected lines
    for (const line of affectedLines) {
      deleteLine(line.id)
    }

    // remove the map point
    setMapPoints((prev) => prev.filter((p) => p.id !== pointId))
    closeEditorMenus()
  }

  // ── map point edit label ───────────────────────────────

  const openMapPointEdit = (mp: MapPoint) => {
    setPendingCheckpointPoint({ x: mp.x, y: mp.y })
    setPendingCheckpointPath([{ x: mp.x, y: mp.y }])
    setPendingCheckpointLineId(null)
    setEditingCheckpointId(null)
    setCheckpointLabel(mp.label)
    setIsCheckpointModalOpen(true)
    setSelectedMapPointId(null)
  }

  // ── line body click ────────────────────────────────────

  const getEndpointCheckpointStatus = (line: Line) => {
    if (line.points.length < 2) return { start: false, end: false }
    const startPt = line.points[0]
    const endPt = line.points[line.points.length - 1]
    const startHas = checkpoints.some(
      (cp) => cp.x === startPt.x && cp.y === startPt.y,
    )
    const endHas = checkpoints.some(
      (cp) => cp.x === endPt.x && cp.y === endPt.y,
    )
    return { start: startHas, end: endHas }
  }

  const openLineBody = (lineId: string) => {
    if (!isEditorEnabled) return
    if (connectSourceId) {
      // connect source to line — treat as connect to nearest endpoint
      const line = lines.find((l) => l.id === lineId)
      if (!line || line.points.length < 2) return
      // default to end endpoint
      finishConnectToEndpoint(lineId, 'end')
      return
    }
    closeEditorMenus()
    setSelectedLineBodyId(lineId)
  }

  const closeLineBody = () => setSelectedLineBodyId(null)

  const extendLine = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId)
    if (!line || line.points.length < 2) return
    const { start: startHasCp } = getEndpointCheckpointStatus(line)
    closeEditorMenus()
    // extend from the side that doesn't have a checkpoint
    isPrependingRef.current = !startHasCp
    setActiveLineId(lineId)
  }

  const deleteSelectedLineBody = () => {
    if (selectedLineBodyId) deleteLine(selectedLineBodyId)
    closeEditorMenus()
  }

  // ── data panel ────────────────────────────────────────

  const toggleDataPanel = () => setIsDataPanelOpen((prev) => !prev)

  const selectLineFromPanel = (lineId: string) => {
    openLineBody(lineId)
    setHighlightedLineId(lineId)
    setHighlightedCheckpointId(null)
    const line = lines.find((l) => l.id === lineId)
    if (line && line.points.length > 0) {
      const mid = line.points[Math.floor(line.points.length / 2)]
      setScrollAnchor({ x: mid.x, y: mid.y })
    }
  }

  const selectCheckpointFromPanel = (cp: Checkpoint) => {
    closeEditorMenus()
    setActiveCheckpointMenu(cp)
    setHighlightedCheckpointId(cp.id)
    setHighlightedLineId(null)
    setScrollAnchor({ x: cp.x, y: cp.y })
  }

  /** Select checkpoint for animation — DataPanel click only highlights + scrolls */
  const handleConfirmCheckpointAnim = (cp: Checkpoint) => {
    setSelectedCheckpointId(cp.id)
    setScrollAnchor({ x: cp.x, y: cp.y })
  }

  // ── render ─────────────────────────────────────────────

  return (
    <div
      id="map-editor"
      className="w-full rounded-xl border bg-white shadow-sm relative"
      style={isFullscreen
        ? { display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, zIndex: 9999, height: '100vh', borderRadius: 0, border: 'none' }
        : { display: 'flex', flexDirection: 'column', height: '85vh' }
      }
    >
      <EditorToolbar
        isEditorEnabled={isEditorEnabled}
        isDataPanelOpen={isDataPanelOpen}
        isPanMode={isPanMode}
        isFullscreen={isFullscreen}
        zoom={zoom}
        onToggleEditor={toggleEditorEnabled}
        onToggleDataPanel={toggleDataPanel}
        onTogglePanMode={() => setIsPanMode((p) => !p)}
        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
        onZoomIn={() => setZoom((z) => clampZoom(z + 0.25))}
        onZoomOut={() => setZoom((z) => clampZoom(z - 0.25))}
        onReset={() => { void moveActorTo('start') }}
        onSaveJson={() => setIsMapDataPickerOpen(true)}
        onOpenActorPicker={() => setIsActorPickerOpen(true)}

      />

      {/* viewport — flex:1 fills remaining height. position:relative for absolute child. min-height:0 allows flex shrink. */}
      <div id="map-viewport" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* absolute scroll container — inset:0 = fills viewport exactly, CANNOT expand */}
        <div id="map-scroll" ref={scrollContainerRef} style={{ position: 'absolute', inset: 0, overflow: 'auto', backgroundColor }} onScroll={(e) => {
          setScrollPos({ left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop })
        }}>
          <div
            id="map-canvas"
            ref={canvasRef}
            style={{ position: 'relative', display: 'inline-block', width: `${canvasWidth * zoom}px`, height: `${canvasHeight * zoom}px` }}
            className={isPanMode ? 'cursor-grab active:cursor-grabbing' : isEditorEnabled ? 'cursor-crosshair' : 'cursor-default'}
            onMouseDown={onPanMouseDown}
            onClick={openLinePoint}
          >
          <div style={{ position: 'relative', width: `${canvasWidth}px`, height: `${canvasHeight}px`, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          <img src={backgroundSrc} alt="Map background" className="block max-w-none" style={{ width: '100%', height: '100%' }} onLoad={(e) => { const img = e.currentTarget; setCanvasWidth(img.naturalWidth); setCanvasHeight(img.naturalHeight) }} />

          <RouteLayer
            lines={lines}
            activeLineId={activeLineId}
            selectedLineId={selectedLineId}
            highlightedLineId={highlightedLineId}
            isEditorEnabled={isEditorEnabled}
            selectedWalkingPointId={selectedWalkingPointId}
            onSelectWalkingPoint={(wp) => setSelectedWalkingPointId(wp.id)}
          />

          <ActorMarker
            ref={actorRef}
            point={isEditorEnabled ? { x: 95, y: 3 } : startPoint}
            icon={actorIcon}
            shape={actorShape}
            size={actorSize}
            border={actorBorder}
            actorState={actorState}
            actorAssets={actorAssets}
          />

          {/* scroll anchor (invisible, triggers scrollIntoView) */}
          {scrollAnchor ? (
            <div
              ref={scrollAnchorRef}
              className="pointer-events-none absolute h-0 w-0"
              style={{ left: `${scrollAnchor.x}%`, top: `${scrollAnchor.y}%` }}
            />
          ) : null}

          <CheckpointLayer
            checkpoints={checkpoints}
            activeCheckpointId={activeCheckpointId}
            isEditorEnabled={isEditorEnabled}
            highlightedCheckpointId={highlightedCheckpointId}
            selectedCheckpointId={selectedCheckpointId}
            onOpenCheckpointMenu={openCheckpointMenu}
            onSelectCheckpoint={(cp) => {
              if (isPanMode) return
              if (!isEditorEnabled) {
                void moveActorTo(cp)
              }
            }}
          />

          {/* map point markers */}
          {mapPoints.map((mp) => (
            <button
              key={mp.id}
              type="button"
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => {
                ev.stopPropagation()
                if (isEditorEnabled) {
                  openMapPointMenu(mp.id)
                } else {
                  void moveActorToPoint({ x: mp.x, y: mp.y })
                }
              }}
              className={`absolute z-50 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow transition ${
                isEditorEnabled
                  ? 'border-white bg-sky-600 hover:bg-sky-500 cursor-pointer'
                  : 'border-white bg-sky-600 hover:bg-sky-500 cursor-pointer'
              }`}
              style={{ left: `${mp.x}%`, top: `${mp.y}%` }}
              title={isEditorEnabled ? `Point ${mp.label}` : `Go to ${mp.label}`}
            >
              {mp.label}
            </button>
          ))}

          {/* walking point markers — visible only in editor mode */}
          {isEditorEnabled &&
            lines.map((line) =>
              (line.walkingPoints ?? []).map((wp) => {
                const isWpSelected = selectedWalkingPointId === wp.id
                return (
                  <div key={wp.id} className="absolute z-[55]" style={{ left: `${wp.x}%`, top: `${wp.y}%` }}>
                    <div
                      className="flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => {
                        if (!isEditorEnabled || isPanMode) return
                        e.stopPropagation()
                        e.preventDefault()
                        onWalkingPointMouseDown(e, wp)
                      }}
                      title="Drag to move walking point"
                    >
                      <div className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                        isWpSelected
                          ? 'border-amber-600 bg-amber-400 shadow-md shadow-amber-200'
                          : 'border-purple-500 bg-purple-300 border-dashed hover:bg-purple-400'
                      }`} />
                    </div>
                  </div>
                )
              })
            )}

          {/* endpoint buttons for all lines */}
          {isEditorEnabled &&
            lines.map((line) => {
              if (line.points.length === 0) return null
              const s = line.points[0]
              const e = line.points[line.points.length - 1]
              const isActive = line.id === activeLineId
              const isSel = line.id === selectedLineId
              const glow = isActive || isSel
              const epClass = `absolute z-40 h-8 w-8 rounded-full border-2 border-white shadow-xl transition hover:opacity-100 ${
                glow ? 'bg-emerald-600/95 opacity-95' : 'bg-slate-500/80 opacity-60'
              }`
              return (
                <div key={`eps-${line.id}`}>
                  <button
                    type="button"
                    onPointerDown={(ev) => ev.stopPropagation()}
                    onClick={(ev) => { ev.stopPropagation(); openEndpointMenu(line.id, 'start') }}
                    className={epClass}
                    style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
                    title="Line start"
                  />
                  {line.points.length > 1 && (
                    <button
                      type="button"
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={(ev) => { ev.stopPropagation(); openEndpointMenu(line.id, 'end') }}
                      className={epClass}
                      style={{ left: `${e.x}%`, top: `${e.y}%`, transform: 'translate(-50%, -50%)' }}
                      title="Line end"
                    />
                  )}
                </div>
              )
            })}

          </div>
        </div>
      </div>

      {/* ── POPUP OVERLAY — outside scroll, viewport-relative pixel positions ── */}
      <div id="popup-overlay" className="pointer-events-none absolute inset-0 z-50">
        {/* viewport indicators — fixed to overlay corners, not affected by canvas scroll */}
        <div id="active-indicator" className="pointer-events-none absolute right-3 top-14 z-30 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm backdrop-blur">
          Active: <span className="text-slate-800">{activeCheckpointId === 'start' ? 'Start' : activeCheckpointId}</span>
        </div>

        {checkpointLog.length > 0 ? (
          <div id="checkpoint-monitor" className="pointer-events-none absolute bottom-3 right-3 z-50 max-w-[200px] overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 px-3 py-2 text-[9px] text-slate-600 shadow-lg backdrop-blur">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />{lines.length}L</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />{checkpoints.length}CP</span>
            </div>
            {checkpointLog.slice(-3).map((entry, i) => (
              <div key={i} className="leading-relaxed opacity-70">{entry}</div>
            ))}
          </div>
        ) : null}

        {/* finish drawing & connect indicator — top-right of viewport */}
        {isEditorEnabled && activeLineId ? (
          <button
            type="button"
            id="finish-line-btn"
            onClick={(ev) => { ev.stopPropagation(); finishDrawing() }}
            className="pointer-events-auto absolute right-3 top-3 z-30 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow transition hover:bg-emerald-100"
          >
            Finish line
          </button>
        ) : null}

        {isEditorEnabled && connectSourceId ? (
          <div id="connect-indicator" className="pointer-events-auto absolute right-3 top-3 z-30 flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Connecting...
            <button
              type="button"
              onClick={(ev) => { ev.stopPropagation(); cancelConnect() }}
              className="ml-1 rounded-lg border border-blue-300 bg-white px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-100"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {/* connect accept popup */}
        {isEditorEnabled && pendingConnectTargetId ? (() => {
          const target = mapPoints.find((mp) => mp.id === pendingConnectTargetId)
          const source = connectSourceType === 'mapPoint'
            ? mapPoints.find((mp) => mp.id === connectSourceId)
            : null
          const sourceLabel = source?.label ?? 'endpoint'
          if (!target) return null
          const pos = popupPixelPos(target.x, target.y)
          return (
            <ConnectAcceptPopup
              sourceLabel={sourceLabel}
              targetLabel={target.label}
              onAccept={acceptConnectTarget}
              onClose={rejectConnectTarget}
              style={{
                position: 'absolute',
                pointerEvents: 'auto',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, calc(-100% - 0.75rem))',
              }}
            />
          )
        })() : null}

        {/* draw-connect accept popup — shown when clicking checkpoint during line draw */}
        {isEditorEnabled && activeLineId && pendingDrawConnectCp ? (() => {
          const cp = pendingDrawConnectCp
          const line = lines.find((l) => l.id === activeLineId)
          const sourceLabel = line?.points.length ? `titik ${line.points.length}` : 'titik awal'
          const pos = popupPixelPos(cp.x, cp.y)
          return (
            <ConnectAcceptPopup
              sourceLabel={sourceLabel}
              targetLabel={cp.label}
              onAccept={acceptDrawConnect}
              onClose={dismissDrawConnect}
              style={{
                position: 'absolute',
                pointerEvents: 'auto',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, calc(-100% - 0.75rem))',
              }}
            />
          )
        })() : null}

        {/* point popup */}
        {isEditorEnabled && selectedMapPointId ? (() => {
          const mp = mapPoints.find((p) => p.id === selectedMapPointId)
          if (!mp) return null
          const pos = popupPixelPos(mp.x, mp.y)
          return (
            <PointPopup
              mapPoint={mp}
              onConnect={(id) => startConnect(id, 'mapPoint')}
              onEditLabel={openMapPointEdit}
              onDelete={deleteMapPoint}
              onClose={closeMapPointMenu}
              style={{
                position: 'absolute',
                pointerEvents: 'auto',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, calc(-100% - 0.75rem))',
              }}
            />
          )
        })() : null}





        {/* checkpoint modal (dialog) */}
        <div style={{ pointerEvents: 'auto' }}>
          <CheckpointModal
            open={isCheckpointModalOpen}
            point={pendingCheckpointPoint}
            label={checkpointLabel}
            onChangeLabel={setCheckpointLabel}
            onCancel={closeCheckpointModal}
            onSave={saveCheckpoint}
          />
        </div>

      </div>
      </div>

      {/* line action modal — outside popup-overlay for proper click handling */}
      {isEditorEnabled && selectedLineId && selectedPoint ? (
          <LineActionMenu
            label="Line"
            lineStyle={(() => {
              const l = lines.find((x) => x.id === selectedLineId)
              return l ? { color: l.color, lineStyle: l.lineStyle, width: l.width, opacity: l.opacity, glow: l.glow } : undefined
            })()}
            onLineStyleChange={(patch) => onChangeLineStyle(selectedLineId, patch)}
            onStartLine={startLineFromSelected}
            onAddPoint={addPointNearSelected}
            onCheckpoint={createCheckpointAtSelected}
            onAddWalking={() => addWalkingPoint(selectedLineId)}
            walkingPointCount={getWalkingPointCount(selectedLineId)}
            walkingPoints={lines.find((l) => l.id === selectedLineId)?.walkingPoints}
            onDeleteWalkingPoint={deleteWalkingPoint}
            onDeletePoint={deleteSelectedPoint}
            onDelete={deleteSelectedLine}
            onClose={closeLineMenu}
          />
      ) : null}

      {/* checkpoint action modal — outside popup-overlay for proper click handling */}
      {isEditorEnabled && activeCheckpointMenu ? (
          <CheckpointActionMenu
            checkpoint={activeCheckpointMenu}
            onDelete={deleteCheckpoint}
            onEditLabel={openCheckpointEditModal}
            onChangeIcon={() => setIconPickerCpId(activeCheckpointMenu.id)}
            onConnect={(id) => startConnect(id, 'checkpoint')}
            onAcceptConnect={
              connectSourceId && connectSourceId !== activeCheckpointMenu.id
                ? () => finishConnectToCheckpoint(activeCheckpointMenu.id)
                : undefined
            }
            onNewLine={() => {
              const cp = activeCheckpointMenu
              closeEditorMenus()
              startLineFrom({ x: cp.x, y: cp.y })
            }}
            onClose={closeCheckpointMenu}
          />
      ) : null}

      {/* checkpoint icon picker modal — outside popup-overlay for proper click handling */}
      {isEditorEnabled && iconPickerCpId ? (() => {
        const cp = checkpoints.find((c) => c.id === iconPickerCpId)
        if (!cp) return null
        return (
          <IconPicker
            selectedIcon={cp.icon}
            selectedShape={cp.shape}
            selectedSize={cp.size}
            selectedBorder={cp.border}
            onSelectIcon={(icon) => onChangeIcon(iconPickerCpId, icon)}
            onSelectShape={(shape) => onChangeShape(iconPickerCpId, shape)}
            onSelectSize={(size) => onChangeSize(iconPickerCpId, size)}
            onSelectBorder={(border) => onChangeBorder(iconPickerCpId, border)}
            onClose={() => setIconPickerCpId(null)}
          />
        )
      })() : null}

      {/* actor + background settings modal — outside popup-overlay for proper click handling */}
      {isActorPickerOpen ? (
        <ActorSettingsModal
          actorIcon={actorIcon}
          actorShape={actorShape}
          actorSize={actorSize}
          actorBorder={actorBorder}
          actorAssets={actorAssets}
          actorSpeed={actorSpeed}
          onChangeSpeed={setActorSpeed}
          backgroundId={backgroundId}
          backgroundColor={backgroundColor}
          onChangeIcon={(icon) => setActorIcon(icon ?? undefined)}
          onChangeShape={setActorShape}
          onChangeSize={setActorSize}
          onChangeBorder={setActorBorder}
          onChangeAssets={(patch) => setActorAssets((prev) => ({ ...prev, ...patch }))}
          onChangeBackground={setBackgroundId}
          onChangeBackgroundColor={setBackgroundColor}
          onClose={() => setIsActorPickerOpen(false)}
        />
      ) : null}

      {/* line body modal — outside popup-overlay */}
      {isEditorEnabled && selectedLineBodyId ? (() => {
        const line = lines.find((l) => l.id === selectedLineBodyId)
        if (!line) return null
        const { start, end } = getEndpointCheckpointStatus(line)
        const canExtend = !start || !end
        const isDrawingLine = line.id === activeLineId
        return (
          <LineBodyPopup
            label="Line"
            lineStyle={line ? { color: line.color, lineStyle: line.lineStyle, width: line.width, opacity: line.opacity, glow: line.glow } : undefined}
            onLineStyleChange={(patch) => onChangeLineStyle(selectedLineBodyId, patch)}
            onExtend={canExtend ? () => extendLine(selectedLineBodyId) : undefined}
            onNewLine={isDrawingLine && canExtend ? () => {
              const lastPt = line.points[line.points.length - 1]
              closeLineBody()
              setActiveLineId(null)
              startLineFrom(lastPt)
            } : undefined}
            onAddWalking={() => addWalkingPoint(selectedLineBodyId)}
            walkingPoints={line.walkingPoints}
            onDeleteWalkingPoint={deleteWalkingPoint}
            onDelete={deleteSelectedLineBody}
            onClose={closeLineBody}
          />
        )
      })() : null}

      {/* DataPanel — outside scroll container so it stays fixed when scrolling */}
      {isDataPanelOpen ? (
        <DataPanel
          lines={lines}
          checkpoints={checkpoints}
          highlightedLineId={highlightedLineId}
          highlightedCheckpointId={highlightedCheckpointId}
          isEditorEnabled={isEditorEnabled}
          onSelectLine={selectLineFromPanel}
          onSelectCheckpoint={selectCheckpointFromPanel}
          onEditCheckpointLabel={openCheckpointEditModal}
          onChangeCheckpointIcon={(cpId) => setIconPickerCpId(cpId)}
          onDeleteCheckpoint={deleteCheckpoint}
          onConfirmCheckpointAnim={handleConfirmCheckpointAnim}
          selectedCheckpointId={selectedCheckpointId}
          actorState={actorState}
          onClose={() => setIsDataPanelOpen(false)}
        />
      ) : null}

      {/* Map Data Picker (Save + Load) */}
      {isMapDataPickerOpen ? (
        <MapDataPicker
          availableData={AVAILABLE_DATAS}
          onSave={handleSaveJson}
          onLoad={handleLoadDataById}
          onClose={() => setIsMapDataPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}

export default MapCanvas
