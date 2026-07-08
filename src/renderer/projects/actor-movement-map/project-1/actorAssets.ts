// Auto-discover all actor sprite images in this folder
const actorModules = import.meta.glob<{ default: string }>(
  '../assets/actors/*.{gif,png,webp,jpg,jpeg,svg}',
  { eager: true },
)

export type ActorSprite = { id: string; label: string; src: string }

export const ACTOR_SPRITE_LIST: ActorSprite[] = Object.entries(actorModules)
  .map(([path, mod]) => {
    const filename = path.split('/').pop() ?? path
    const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    return { id: filename, label: name, src: mod.default }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

/** Resolve an asset ID to its image src. Returns undefined if not found. */
export function resolveActorAsset(assetId?: string): string | undefined {
  if (!assetId) return undefined
  return ACTOR_SPRITE_LIST.find((s) => s.id === assetId)?.src
}
