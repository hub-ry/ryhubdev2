import gamedata from './gamedata.json' with { type: 'json' }

const { entities, maxTownHall } = gamedata

export const MAX_TOWN_HALL = maxTownHall

// Groups in the export are either a single in-progress/special instance (no `cnt`)
// or a bucket of `cnt` identical buildings at that level.
const instanceCount = (e) => e.cnt ?? 1

const ENTITY_LISTS = [
  ['buildings', 'building'],
  ['traps', 'trap'],
  ['units', 'troop'],
  ['siege_machines', 'siege'],
  ['heroes', 'hero'],
  ['spells', 'spell'],
  ['pets', 'pet'],
  ['equipment', 'equipment'],
  ['helpers', 'helper'],
]

export class ParseError extends Error {}

/** Strips a leading BOM / stray wrapping quotes people paste from clipboards. */
function coerceJson(raw) {
  const text = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
  if (!text) throw new ParseError('Nothing pasted yet.')
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ParseError("That isn't valid JSON. Paste the whole clipboard, starting at `{`.")
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ParseError('Expected a JSON object from the in-game export.')
  }
  return parsed
}

/**
 * Turns the raw in-game export into a village model keyed by dataId.
 * Home village only - the `*2` keys are Builder Base and are ignored.
 */
export function parseExport(raw) {
  const src = coerceJson(raw)

  if (!Array.isArray(src.buildings) || !Array.isArray(src.heroes)) {
    throw new ParseError(
      'This JSON has no `buildings` list. Make sure you copied from Settings → More Settings → Data export.'
    )
  }

  const village = {
    tag: typeof src.tag === 'string' ? src.tag : null,
    takenAt: Number.isFinite(src.timestamp) ? new Date(src.timestamp * 1000) : null,
    groups: new Map(), // dataId -> { entity, kind, instances[], total }
    unknown: [],
  }

  for (const [key, kind] of ENTITY_LISTS) {
    const list = Array.isArray(src[key]) ? src[key] : []
    for (const e of list) {
      if (!e || !Number.isFinite(e.data)) continue
      const entity = entities[e.data]
      if (!entity) {
        village.unknown.push({ kind, dataId: e.data, level: e.lvl ?? null })
        continue
      }
      let g = village.groups.get(e.data)
      if (!g) {
        g = { dataId: e.data, entity, kind, instances: [], total: 0 }
        village.groups.set(e.data, g)
      }
      const n = instanceCount(e)
      g.total += n
      g.instances.push({
        level: e.lvl ?? 1,
        count: n,
        timer: Number.isFinite(e.timer) ? e.timer : null,
        weapon: Number.isFinite(e.weapon) ? e.weapon : null,
        gearUp: e.gear_up === 1,
      })
    }
  }

  for (const g of village.groups.values()) {
    g.instances.sort((a, b) => a.level - b.level)
    g.minLevel = g.instances.length ? g.instances[0].level : 0
    g.maxLevel = g.instances.length ? g.instances[g.instances.length - 1].level : 0
    g.upgrading = g.instances.filter((i) => i.timer != null)
  }

  const townHall = village.groups.get(1000001)
  if (!townHall) throw new ParseError('No Town Hall found in this export.')
  village.townHallLevel = townHall.instances[0].level
  village.gigaWeapon = townHall.instances[0].weapon
  village.isMaxTownHall = village.townHallLevel >= maxTownHall

  attachDerived(village)
  return village
}

/** Level of a single-instance building (Lab, Blacksmith, ...), or 0 if unbuilt. */
function levelOf(village, dataId) {
  const g = village.groups.get(dataId)
  return g ? g.maxLevel : 0
}

// Resolved from the dataset by slug rather than hardcoded, so a dataset refresh
// that renumbers or adds entities cannot silently break the planner.
const SLUGS = {
  townHall: 'town-hall',
  armyCamp: 'army-camp',
  barracks: 'barracks',
  darkBarracks: 'dark-barracks',
  laboratory: 'laboratory',
  spellFactory: 'spell-factory',
  darkSpellFactory: 'dark-spell-factory',
  blacksmith: 'blacksmith',
  heroHall: 'hero-hall',
  petHouse: 'pet-house',
  workshop: 'workshop',
  clanCastle: 'clan-castle',
  buildersHut: 'builders-hut',
  bobsHut: 'bobs-hut',
  helperHut: 'helper-hut',
  wall: 'wall',
  goldMine: 'gold-mine',
  elixirCollector: 'elixir-collector',
  goldStorage: 'gold-storage',
  elixirStorage: 'elixir-storage',
  darkDrill: 'dark-elixir-drill',
  darkStorage: 'dark-elixir-storage',
  cannon: 'cannon',
  archerTower: 'archer-tower',
  wizardTower: 'wizard-tower',
  mortar: 'mortar',
  airDefense: 'air-defense',
  airSweeper: 'air-sweeper',
  hiddenTesla: 'hidden-tesla',
  bombTower: 'bomb-tower',
  xbow: 'x-bow',
  infernoTower: 'inferno-tower',
  eagleArtillery: 'eagle-artillery',
  scattershot: 'scattershot',
  spellTower: 'spell-tower',
  monolith: 'monolith',
  firespitter: 'firespitter',
  multiGearTower: 'multi-gear-tower',
  multiArcherTower: 'multi-archer-tower',
  ricochetCannon: 'ricochet-cannon',
  superWizardTower: 'super-wizard-tower',
  revengeTower: 'revenge-tower',
  craftingStation: 'crafting-station',
  longshot: 'longshot',
  smasher: 'smasher',
  barbarianKing: 'barbarian-king',
  archerQueen: 'archer-queen',
  grandWarden: 'grand-warden',
  royalChampion: 'royal-champion',
  minionPrince: 'minion-prince',
  dragonDuke: 'dragon-duke',
  buildersApprentice: 'builders-apprentice',
  labAssistant: 'lab-assistant',
  alchemist: 'alchemist',
  prospector: 'prospector',
}

const idBySlug = {}
for (const [dataId, e] of Object.entries(entities)) idBySlug[e.id] = Number(dataId)

export const IDS = Object.fromEntries(
  Object.entries(SLUGS).map(([key, slug]) => [key, idBySlug[slug] ?? -1])
)

function attachDerived(village) {
  // Builders: one per Builder's Hut, plus B.O.B's Hut (the 6th builder).
  const huts = village.groups.get(IDS.buildersHut)?.total ?? 0
  const bob = village.groups.get(IDS.bobsHut) ? 1 : 0
  const total = huts + bob

  // A builder is occupied by any building, trap, wall or hero that has a timer.
  // Lab research and pet upgrades do not consume a builder.
  let busy = 0
  for (const g of village.groups.values()) {
    if (g.kind === 'building' || g.kind === 'trap' || g.kind === 'hero') {
      busy += g.upgrading.length
    }
  }
  village.builders = { total, busy, idle: Math.max(0, total - busy) }

  village.labLevel = levelOf(village, IDS.laboratory)
  village.heroHallLevel = levelOf(village, IDS.heroHall)
  village.blacksmithLevel = levelOf(village, IDS.blacksmith)
  village.petHouseLevel = levelOf(village, IDS.petHouse)
  village.barracksLevel = levelOf(village, IDS.barracks)
  village.spellFactoryLevel = levelOf(village, IDS.spellFactory)
  village.workshopLevel = levelOf(village, IDS.workshop)

  village.researching = []
  village.petUpgrading = []
  for (const g of village.groups.values()) {
    if ((g.kind === 'troop' || g.kind === 'spell' || g.kind === 'siege') && g.upgrading.length) {
      village.researching.push(g)
    }
    if (g.kind === 'pet' && g.upgrading.length) village.petUpgrading.push(g)
  }
  village.labBusy = village.researching.length > 0
}

export { entities }
