// Auto-discover all background images in this folder
const bgModules = import.meta.glob<{ default: string }>(
  '../assets/backgrounds/*.{jpg,jpeg,png,webp}',
  { eager: true },
)

export const BACKGROUND_LIST: { id: string; label: string; src: string }[] = Object.entries(bgModules)
  .map(([path, mod]) => {
    const filename = path.split('/').pop() ?? path
    const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    return { id: filename, label: name, src: mod.default }
  })
  .sort((a, b) => a.label.localeCompare(b.label))
