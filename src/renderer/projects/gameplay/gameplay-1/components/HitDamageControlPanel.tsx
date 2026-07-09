// ─── Hit damage settings panel — admin UI untuk konfigurasi VFX ───
// Toggles + parameter sliders untuk vignette & blood splatter

import { DEFAULT_HIT_SETTINGS, type HitDamageSettings } from './HitDamageOverlay'

interface HitDamageControlPanelProps {
  hitSettings: HitDamageSettings
  onSettingsChange: React.Dispatch<React.SetStateAction<HitDamageSettings>>
  onTestHit: () => void
}

export { DEFAULT_HIT_SETTINGS, type HitDamageSettings }

export function HitDamageControlPanel({
  hitSettings,
  onSettingsChange,
  onTestHit,
}: HitDamageControlPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Hit Damage</span>
          <button
            onClick={onTestHit}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100"
          >
            💥 Test
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Tekan <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-600">D</kbd> di fullscreen
        </p>
      </div>

      {/* Toggle effects */}
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
            hitSettings.vignette
              ? 'border-red-300 bg-red-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <input
            type="checkbox"
            checked={hitSettings.vignette}
            onChange={(e) => onSettingsChange((s) => ({ ...s, vignette: e.target.checked }))}
            className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500"
          />
          <div>
            <p className="text-xs font-semibold text-slate-900">Red Vignette</p>
            <p className="text-[10px] text-slate-400">Flash merah dari tepi</p>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
            hitSettings.bloodSplatter
              ? 'border-red-300 bg-red-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <input
            type="checkbox"
            checked={hitSettings.bloodSplatter}
            onChange={(e) => onSettingsChange((s) => ({ ...s, bloodSplatter: e.target.checked }))}
            className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500"
          />
          <div>
            <p className="text-xs font-semibold text-slate-900">Blood Splatter</p>
            <p className="text-[10px] text-slate-400">Bercak darah di layar</p>
          </div>
        </label>
      </div>

      {/* Blood splatter parameters */}
      {hitSettings.bloodSplatter && (
        <div className="mt-2 grid grid-cols-3 gap-3 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
          <div>
            <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
              <span>Bercak/hit</span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.splatterCount}</span>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={hitSettings.splatterCount}
              onChange={(e) => onSettingsChange((s) => ({ ...s, splatterCount: Number(e.target.value) }))}
              className="mt-1 w-full accent-red-600"
            />
            <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
              <span>1</span><span>20</span>
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
              <span>Durasi</span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{(hitSettings.splatterDuration / 1000).toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={hitSettings.splatterDuration}
              onChange={(e) => onSettingsChange((s) => ({ ...s, splatterDuration: Number(e.target.value) }))}
              className="mt-1 w-full accent-red-600"
            />
            <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
              <span>1s</span><span>10s</span>
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
              <span>Ukuran</span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.splatterSize.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={hitSettings.splatterSize}
              onChange={(e) => onSettingsChange((s) => ({ ...s, splatterSize: Number(e.target.value) }))}
              className="mt-1 w-full accent-red-600"
            />
            <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
              <span>0.5x</span><span>3.0x</span>
            </div>
          </div>
        </div>
      )}

      {/* Vignette parameters */}
      {hitSettings.vignette && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Warna:</span>
            <button
              onClick={() => onSettingsChange((s) => ({ ...s, vignetteColor: 'red' }))}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                hitSettings.vignetteColor === 'red'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-red-50'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Merah
            </button>
            <button
              onClick={() => onSettingsChange((s) => ({ ...s, vignetteColor: 'white' }))}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                hitSettings.vignetteColor === 'white'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-300" />
              Putih
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span>Intensitas</span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{Math.round(hitSettings.vignetteIntensity * 100)}%</span>
              </label>
              <input
                type="range"
                min={0.05}
                max={0.3}
                step={0.01}
                value={hitSettings.vignetteIntensity}
                onChange={(e) => onSettingsChange((s) => ({ ...s, vignetteIntensity: Number(e.target.value) }))}
                className="mt-1 w-full accent-red-600"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                <span>5%</span><span>30%</span>
              </div>
            </div>
            <div>
              <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span>Spread</span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{hitSettings.vignetteSpread}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={hitSettings.vignetteSpread}
                onChange={(e) => onSettingsChange((s) => ({ ...s, vignetteSpread: Number(e.target.value) }))}
                className="mt-1 w-full accent-red-600"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                <span>10%</span><span>60%</span>
              </div>
            </div>
            <div>
              <label className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span>Durasi</span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">{(hitSettings.vignetteDuration / 1000).toFixed(1)}s</span>
              </label>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={hitSettings.vignetteDuration}
                onChange={(e) => onSettingsChange((s) => ({ ...s, vignetteDuration: Number(e.target.value) }))}
                className="mt-1 w-full accent-red-600"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-slate-400">
                <span>1s</span><span>10s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
