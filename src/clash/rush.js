/**
 * The planner. Encodes CallMeTee's Strategic Rush Bible (v1.6.4, June 2026) as
 * rules over a parsed village.
 *
 * The two axioms everything else falls out of:
 *   Offense > Defense
 *   New building / new capability > upgrading an existing one
 *
 * Builder priority, pre-max-TH:
 *   1  closest hero to 8d upgrades (Archer Queen first)
 *   2  Army Camps, Clan Castle, Blacksmith, Hero Hall
 *   3  Lab, Barracks, Spell Factories
 *   4a Pet House (TH14+), resource buildings
 *   4b new buildings, barriers to upgrading the Town Hall
 *   5  a second hero
 */
import { IDS, MAX_TOWN_HALL, entities } from './parseExport.js'

const DAY = 86400
const EIGHT_DAYS = 8 * DAY

// ── generic level helpers ────────────────────────────────────────────────────

/** Supercharge levels are a separate, F-tier track - never part of the normal path. */
const normalLevels = (entity) => (entity.levels || []).filter((l) => !l.sc)

/**
 * Every gate a level can sit behind. Returns null when unlocked, else the
 * blocker so the UI can name it instead of silently hiding the upgrade.
 */
function gateFor(level, caps) {
  if (level.th != null && level.th > caps.townHall)
    return { kind: 'townHall', need: level.th, have: caps.townHall, label: `Town Hall ${level.th}` }
  if (level.hall != null && level.hall > caps.heroHall)
    return { kind: 'heroHall', need: level.hall, have: caps.heroHall, label: `Hero Hall ${level.hall}` }
  if (level.lab != null && level.lab > caps.lab)
    return { kind: 'lab', need: level.lab, have: caps.lab, label: `Laboratory ${level.lab}` }
  if (level.pet != null && level.pet > caps.petHouse)
    return { kind: 'petHouse', need: level.pet, have: caps.petHouse, label: `Pet House ${level.pet}` }
  if (level.smith != null && level.smith > caps.blacksmith)
    return { kind: 'blacksmith', need: level.smith, have: caps.blacksmith, label: `Blacksmith ${level.smith}` }
  return null
}

/** Highest level currently reachable given every gate. */
export function capLevel(entity, caps) {
  const levels = normalLevels(entity)
  let cap = 0
  for (const l of levels) {
    if (gateFor(l, caps)) break
    cap = l.l
  }
  return cap || (levels[0] ? levels[0].l : 0)
}

/** The next level up from `current`, plus whatever is blocking it. */
export function nextLevel(entity, current, caps) {
  const levels = normalLevels(entity)
  const target = levels.find((l) => l.l === current + 1)
  if (!target) return { maxed: true }
  const gate = gateFor(target, caps)
  return { maxed: false, level: target, gate, blocked: !!gate }
}

export function capsOf(village) {
  return {
    townHall: village.townHallLevel,
    heroHall: village.heroHallLevel,
    lab: village.labLevel,
    petHouse: village.petHouseLevel,
    blacksmith: village.blacksmithLevel,
  }
}

// ── merges ───────────────────────────────────────────────────────────────────
// The dataset records how many of a source building survive a Town Hall
// (`countAfterMerges`) but not what they merge into, so the pairings are stated
// here. Each entry is [sourceId, howManyConsumedPerMerge].

export const MERGES = [
  { target: IDS.ricochetCannon, sources: [[IDS.cannon, 2]] },
  { target: IDS.multiArcherTower, sources: [[IDS.archerTower, 2]] },
  { target: IDS.multiGearTower, sources: [[IDS.cannon, 1], [IDS.archerTower, 1]] },
  { target: IDS.superWizardTower, sources: [[IDS.wizardTower, 2]] },
]

const availAt = (entity, th) => {
  const a = entity?.avail?.[th]
  if (a == null) return null
  return Array.isArray(a) ? { count: a[0], after: a[1] } : { count: a, after: null }
}

const owned = (village, dataId) => village.groups.get(dataId)?.total ?? 0

/**
 * Merge progress for the current Town Hall: how many merged defenses are still
 * owed, and whether enough max-level source buildings exist to make them.
 */
export function mergePlan(village) {
  const th = village.townHallLevel
  const caps = capsOf(village)
  const out = []
  const consumed = new Map()

  for (const m of MERGES) {
    const targetEntity = entities[m.target]
    const avail = availAt(targetEntity, th)
    if (!avail || !avail.count) continue
    const have = owned(village, m.target)
    const remaining = Math.max(0, avail.count - have)

    const sources = m.sources.map(([id, per]) => {
      const entity = entities[id]
      const sourceMax = capLevel(entity, caps)
      const g = village.groups.get(id)
      const atMax = g
        ? g.instances.filter((i) => i.level >= sourceMax && i.timer == null)
            .reduce((n, i) => n + i.count, 0)
        : 0
      consumed.set(id, (consumed.get(id) ?? 0) + per * have)
      return { entity, per, need: per * remaining, atMax, sourceMax, have: owned(village, id) }
    })

    out.push({ entity: targetEntity, have, want: avail.count, remaining, sources })
  }
  return { merges: out, consumedBySource: consumed }
}

// ── buildings you have not placed yet ────────────────────────────────────────

// The Town Hall and Walls are not "placeable". B.O.B's Hut and the Helper Hut
// are not builder work either - they arrive with Builder Base / gem progression,
// so suggesting you "place" them is noise.
const PLACEMENT_SKIP = new Set([IDS.townHall, IDS.wall, IDS.bobsHut, IDS.helperHut])

/**
 * New buildings unlocked at this Town Hall that are not on the map yet.
 * "New building > upgrade existing" makes these some of the best value in the game.
 */
export function missingBuildings(village) {
  const th = village.townHallLevel
  const { consumedBySource } = mergePlan(village)
  const out = []

  for (const [idStr, entity] of Object.entries(entities)) {
    const dataId = Number(idStr)
    if (PLACEMENT_SKIP.has(dataId)) continue
    if (!entity.avail) continue
    const avail = availAt(entity, th)
    if (!avail || !avail.count) continue

    // Merge sources: some of the allowance has already been eaten by merges.
    const eaten = consumedBySource.get(dataId) ?? 0
    const expected = Math.max(0, avail.count - eaten)
    const have = owned(village, dataId)
    const missing = expected - have
    if (missing <= 0) continue

    const first = normalLevels(entity)[0]
    out.push({
      dataId,
      entity,
      isTrap: entity.cat === 'trap',
      missing,
      expected,
      have,
      cost: first?.cost ?? 0,
      resource: first?.res ?? 'gold',
      secs: first?.secs ?? 0,
    })
  }
  // Traps are cheap but sit near the bottom of the defensive tier list, so
  // buildings come first.
  return out.sort((a, b) => Number(a.isTrap) - Number(b.isTrap) || a.secs - b.secs)
}

// ── walls ────────────────────────────────────────────────────────────────────

export function wallStatus(village) {
  const entity = entities[IDS.wall]
  const caps = capsOf(village)
  const g = village.groups.get(IDS.wall)
  const max = capLevel(entity, caps)
  const total = g?.total ?? 0
  const atMax = g ? g.instances.filter((i) => i.level >= max).reduce((n, i) => n + i.count, 0) : 0
  const avail = availAt(entity, village.townHallLevel)
  return { entity, max, total, atMax, allowed: avail?.count ?? total, maxed: total > 0 && atMax >= total }
}

// ── heroes ───────────────────────────────────────────────────────────────────

export const HERO_ORDER = [
  IDS.archerQueen,
  IDS.grandWarden,
  IDS.royalChampion,
  IDS.minionPrince,
  IDS.dragonDuke,
  IDS.barbarianKing,
]

/**
 * Per-hero 8-day analysis. Books of Heroes are only worth full value on 8d
 * upgrades, so "how far am I from the 8d bracket" is the number that matters.
 */
export function heroPlan(village) {
  const caps = capsOf(village)
  const out = []

  for (const dataId of HERO_ORDER) {
    const entity = entities[dataId]
    if (!entity) continue
    const g = village.groups.get(dataId)
    const level = g ? g.maxLevel : 0
    const unlocked = !!g
    const levels = normalLevels(entity)
    const next = nextLevel(entity, level, caps)
    const upgrading = g?.upgrading?.[0] ?? null

    // Distance to the first 8-day upgrade, and how many 8d upgrades remain.
    const firstEight = levels.find((l) => (l.secs ?? 0) >= EIGHT_DAYS)
    const inEightRange = firstEight ? level >= firstEight.l - 1 : false
    let secsTo8d = 0
    if (firstEight && !inEightRange) {
      for (const l of levels) {
        if (l.l > level && l.l < firstEight.l) secsTo8d += l.secs ?? 0
      }
    }
    const eightDayUpgradesLeft = levels.filter((l) => l.l > level && (l.secs ?? 0) >= EIGHT_DAYS).length

    // Everything still owed to fully max the hero.
    let secsToMax = 0
    let costToMax = 0
    let resource = null
    for (const l of levels) {
      if (l.l <= level) continue
      secsToMax += l.secs ?? 0
      costToMax += l.cost ?? 0
      resource = l.res ?? resource
    }

    out.push({
      dataId,
      entity,
      unlocked,
      level,
      capped: capLevel(entity, caps),
      atCap: unlocked && level >= capLevel(entity, caps),
      maxLevel: levels[levels.length - 1]?.l ?? level,
      next,
      upgrading,
      inEightRange,
      firstEightLevel: firstEight?.l ?? null,
      secsTo8d,
      eightDayUpgradesLeft,
      secsToMax,
      costToMax,
      resource,
    })
  }

  // Guide: Archer Queen first, no real debate. After her, the hero closest to 8d.
  const usable = out.filter((h) => h.unlocked && !h.atCap && !h.next.blocked)
  const aq = usable.find((h) => h.dataId === IDS.archerQueen && !h.inEightRange)
  const closest = [...usable].sort((a, b) => {
    if (a.inEightRange !== b.inEightRange) return a.inEightRange ? -1 : 1
    return a.secsTo8d - b.secsTo8d
  })[0]
  const primary = aq ?? closest ?? null
  const secondary = usable.find((h) => h !== primary && h.dataId !== primary?.dataId) ?? null

  return { heroes: out, primary, secondary }
}

// ── equipment / ore ──────────────────────────────────────────────────────────

export const ORE = ['shiny', 'glowy', 'starry']
export const ORE_LABEL = { shiny: 'Shiny (blue)', glowy: 'Glowy (purple)', starry: 'Starry (orange)' }

/**
 * Guide's June 2026 shortlist: the first 8 pieces to max. Two epics, six commons.
 * Anything past these is explicitly lower priority for a rushed account.
 */
export const FOCUS_EQUIPMENT = [
  { id: 'action-figure', why: 'Epic. Used in essentially every current meta comp.' },
  { id: 'meteor-staff', why: 'Epic. Air attacks, which is where a rushed account lives.' },
  { id: 'eternal-tome', why: 'Meta-warping. Correct use makes or breaks the attack.' },
  { id: 'dark-orb', why: 'Meta-warping, and strong even on a low-level Minion Prince.' },
  { id: 'giant-arrow', why: 'Still insane in air hits. Level 9 is enough to kill sweepers.' },
  { id: 'healing-tome', why: 'Second Warden piece - pick this or Rage Gem, not both.', alt: 'rage-gem' },
  { id: 'fire-heart', why: 'Dragon Duke is absurd right now and barely needs hero levels.' },
  { id: 'electro-fangs', why: "Dragon Duke's other common. Also ridiculous." },
]

const equipmentByslug = {}
for (const [dataId, e] of Object.entries(entities)) {
  if (e.cat === 'hero-equipment') equipmentByslug[e.id] = { dataId: Number(dataId), entity: e }
}

export function equipmentPlan(village) {
  const caps = capsOf(village)
  const rows = []
  const totals = { shiny: 0, glowy: 0, starry: 0 }

  for (const focus of FOCUS_EQUIPMENT) {
    let hit = equipmentByslug[focus.id]
    let usedAlt = false
    // Healing Tome / Rage Gem is a pick-one; follow whichever is further along.
    if (focus.alt && equipmentByslug[focus.alt]) {
      const a = village.groups.get(hit?.dataId)?.maxLevel ?? 0
      const b = village.groups.get(equipmentByslug[focus.alt].dataId)?.maxLevel ?? 0
      if (b > a) {
        hit = equipmentByslug[focus.alt]
        usedAlt = true
      }
    }
    if (!hit) {
      rows.push({ missingFromDataset: true, slug: focus.id, why: focus.why })
      continue
    }

    const { dataId, entity } = hit
    const g = village.groups.get(dataId)
    const level = g ? g.maxLevel : 0
    const levels = normalLevels(entity)
    const maxLevel = levels[levels.length - 1]?.l ?? 0
    const remaining = { shiny: 0, glowy: 0, starry: 0 }
    for (const l of levels) {
      if (l.l <= level || !l.ore) continue
      remaining.shiny += l.ore[0]
      remaining.glowy += l.ore[1]
      remaining.starry += l.ore[2]
    }
    for (const k of ORE) totals[k] += remaining[k]

    const next = nextLevel(entity, level, caps)
    rows.push({
      dataId,
      entity,
      owned: !!g,
      level,
      maxLevel,
      maxed: level >= maxLevel,
      remaining,
      next,
      why: focus.why,
      usedAlt,
    })
  }

  const done = rows.filter((r) => r.maxed).length
  return { rows, totals, done, target: FOCUS_EQUIPMENT.length }
}

// ── lab ──────────────────────────────────────────────────────────────────────

// Guide's lab order: farming comp first (you will run hundreds of these attacks),
// then donation troops, then the war comp.
const LAB_FOCUS = [
  { id: 'barbarian', tier: 'Farming', why: 'Super Barb spam - the brainless farming comp.' },
  { id: 'goblin', tier: 'Farming', why: 'Sneaky Goblins for loot and blimp CCs.' },
  { id: 'lightning-spell', tier: 'Farming', why: 'Zap collectors, quit, repeat. Trivialises loot.' },
  { id: 'minion', tier: 'Farming', why: 'Super Minion spam, also a common donation.' },
  { id: 'valkyrie', tier: 'Farming', why: 'Brainless 1-stars with no heroes awake.' },
  { id: 'balloon', tier: 'Donations', why: 'Most common war donation request.' },
  { id: 'electro-titan', tier: 'Donations', why: 'Common ground CC request.' },
  { id: 'yeti', tier: 'Donations', why: 'Half of the Yeti-blimp donation.' },
  { id: 'dragon', tier: 'War', why: 'Mass Dragons is the efficient rushed war comp.' },
  { id: 'totem-spell', tier: 'War', why: 'The other half of mass Dragons.' },
]

const troopBySlug = {}
for (const [dataId, e] of Object.entries(entities)) {
  if (['troop', 'spell', 'siege-machine'].includes(e.cat)) troopBySlug[e.id] = { dataId: Number(dataId), entity: e }
}

export function labPlan(village) {
  const caps = capsOf(village)
  const rows = []
  for (const f of LAB_FOCUS) {
    const hit = troopBySlug[f.id]
    if (!hit) continue
    const g = village.groups.get(hit.dataId)
    const level = g ? g.maxLevel : 0
    const next = nextLevel(hit.entity, level, caps)
    rows.push({
      ...hit,
      tier: f.tier,
      why: f.why,
      unlocked: !!g,
      level,
      cap: capLevel(hit.entity, caps),
      next,
      upgrading: g?.upgrading?.[0] ?? null,
    })
  }

  // Is there anything at all left to research? An idle lab is wasted time.
  let anyAvailable = false
  for (const g of village.groups.values()) {
    if (!['troop', 'spell', 'siege'].includes(g.kind)) continue
    const n = nextLevel(g.entity, g.maxLevel, caps)
    if (!n.maxed && !n.blocked) {
      anyAvailable = true
      break
    }
  }

  const labEntity = entities[IDS.laboratory]
  return {
    rows,
    anyAvailable,
    level: village.labLevel,
    cap: capLevel(labEntity, caps),
    entity: labEntity,
    busy: village.labBusy,
    researching: village.researching,
  }
}

// ── the ranked upgrade queue ─────────────────────────────────────────────────

const TIERS = {
  hero: { rank: 1, label: 'Hero' },
  camps: { rank: 2, label: 'Camps / CC / Blacksmith / Hero Hall' },
  lab: { rank: 3, label: 'Lab / Barracks / Spell Factories' },
  pets: { rank: 4, label: 'Pet House / resources' },
  newBuild: { rank: 5, label: 'New buildings / TH blockers' },
  hero2: { rank: 6, label: 'Second hero' },
  defense: { rank: 7, label: 'Core defenses' },
}

const TIER2 = [IDS.armyCamp, IDS.clanCastle, IDS.blacksmith, IDS.heroHall]
const TIER3 = [IDS.laboratory, IDS.barracks, IDS.darkBarracks, IDS.spellFactory, IDS.darkSpellFactory]
const TIER4 = [
  IDS.petHouse,
  IDS.goldStorage,
  IDS.elixirStorage,
  IDS.darkStorage,
  IDS.goldMine,
  IDS.elixirCollector,
  IDS.darkDrill,
  IDS.workshop,
]

// Guide's defensive tier list. Only relevant once offense is finished.
export const DEFENSE_TIERS = {
  S: [IDS.monolith, IDS.eagleArtillery, IDS.clanCastle, IDS.revengeTower, IDS.spellTower],
  A: [IDS.scattershot, IDS.infernoTower, IDS.xbow, IDS.ricochetCannon, IDS.multiArcherTower],
  B: [IDS.airDefense, IDS.multiGearTower, IDS.wizardTower, IDS.bombTower, IDS.hiddenTesla, IDS.airSweeper, IDS.firespitter],
  C: [IDS.archerTower, IDS.cannon],
  F: [IDS.mortar, IDS.craftingStation],
}

function buildingCandidate(village, caps, dataId, tier, why) {
  const entity = entities[dataId]
  if (!entity) return null
  const g = village.groups.get(dataId)
  if (!g) return null // not placed - handled by missingBuildings()

  // Upgrade the lowest-level instance that is not already busy.
  const idle = g.instances.filter((i) => i.timer == null)
  if (!idle.length) return null
  const level = idle[0].level
  const n = nextLevel(entity, level, caps)
  if (n.maxed || n.blocked) return null

  return {
    kind: 'building',
    dataId,
    entity,
    tier,
    why,
    from: level,
    to: n.level.l,
    secs: n.level.secs ?? 0,
    cost: n.level.cost ?? 0,
    resource: n.level.res ?? 'gold',
    instances: g.total,
  }
}

/**
 * Upgrades that exist but are locked behind something. These are the most
 * informative rows on a well-rushed account: when the only thing standing
 * between you and every remaining upgrade is a Town Hall level, that *is* the
 * answer.
 */
export function blockedUpgrades(village) {
  const caps = capsOf(village)
  const out = []
  for (const g of village.groups.values()) {
    if (g.kind === 'trap' || g.kind === 'helper') continue
    const level = g.kind === 'building' ? g.minLevel : g.maxLevel
    const n = nextLevel(g.entity, level, caps)
    if (n.maxed || !n.blocked) continue
    out.push({ dataId: g.dataId, entity: g.entity, kind: g.kind, from: level, to: n.level.l, gate: n.gate })
  }
  // Group by what is blocking, biggest blocker first.
  const byGate = new Map()
  for (const b of out) {
    const key = b.gate.label
    if (!byGate.has(key)) byGate.set(key, { gate: b.gate, items: [] })
    byGate.get(key).items.push(b)
  }
  return [...byGate.values()].sort((a, b) => b.items.length - a.items.length)
}

/**
 * Entities where the village is at a higher level than the bundled dataset
 * knows about - i.e. Supercell shipped an update and the data needs a refresh.
 * Surfaced rather than silently treated as "maxed".
 */
export function datasetLag(village) {
  const out = []
  for (const g of village.groups.values()) {
    const levels = normalLevels(g.entity)
    const max = levels.length ? levels[levels.length - 1].l : 0
    if (g.maxLevel > max) out.push({ entity: g.entity, owned: g.maxLevel, known: max })
  }
  return out
}

/**
 * The ordered "do this next" list. Tier is the guide's priority; within a tier,
 * shorter upgrades come first so capability comes online sooner.
 */
export function upgradeQueue(village) {
  const caps = capsOf(village)
  const th = village.townHallLevel
  const heroes = heroPlan(village)
  const out = []

  const pushHero = (h, tier, why) => {
    if (!h || h.atCap || h.next.maxed || h.next.blocked || h.upgrading) return
    out.push({
      kind: 'hero',
      dataId: h.dataId,
      entity: h.entity,
      tier,
      why,
      from: h.level,
      to: h.next.level.l,
      secs: h.next.level.secs ?? 0,
      cost: h.next.level.cost ?? 0,
      resource: h.next.level.res ?? 'dark',
    })
  }

  pushHero(
    heroes.primary,
    TIERS.hero,
    heroes.primary?.inEightRange
      ? 'Already in the 8d bracket - keep her there and dump every Book of Heroes here.'
      : 'One hero down 24/7, no exceptions. This is the longest marathon in the game.'
  )

  for (const id of TIER2) {
    const c = buildingCandidate(
      village,
      caps,
      id,
      TIERS.camps,
      id === IDS.armyCamp || id === IDS.clanCastle
        ? 'More troops on every single attack. Balance assumes you have the full complement.'
        : id === IDS.blacksmith
          ? 'Stores more ore and unlocks higher equipment levels. Overflowing ore is unrecoverable.'
          : 'Gates your hero levels.'
    )
    if (c) out.push(c)
  }

  for (const id of TIER3) {
    const c = buildingCandidate(
      village,
      caps,
      id,
      TIERS.lab,
      id === IDS.laboratory
        ? 'Only worth it when it actually unlocks new levels you need.'
        : 'Worth it when it unlocks a troop or spell you are about to use.'
    )
    if (c) out.push(c)
  }

  for (const id of TIER4) {
    const c = buildingCandidate(
      village,
      caps,
      id,
      TIERS.pets,
      id === IDS.petHouse
        ? 'Bringing pets at all is a large net gain, even at level 1.'
        : 'Storage you can actually fill, so upgrades never stall on capacity.'
    )
    if (c) out.push(c)
  }

  for (const m of missingBuildings(village)) {
    out.push({
      kind: 'place',
      dataId: m.dataId,
      entity: m.entity,
      tier: TIERS.newBuild,
      why: `${m.missing} not placed yet. A new building beats upgrading an existing one, every time.`,
      count: m.missing,
      secs: m.secs,
      cost: m.cost,
      resource: m.resource,
    })
  }

  pushHero(heroes.secondary, TIERS.hero2, 'Two heroes can be down with no penalty to your offense.')

  // Once offense is done - and only then - the core defenses are worth builder time.
  if (village.isMaxTownHall) {
    for (const [tierName, ids] of Object.entries(DEFENSE_TIERS)) {
      if (tierName !== 'S' && tierName !== 'A') continue
      for (const id of ids) {
        const c = buildingCandidate(village, caps, id, TIERS.defense, `${tierName}-tier core defense.`)
        if (c) out.push(c)
      }
    }
  }

  out.sort((a, b) => a.tier.rank - b.tier.rank || a.secs - b.secs)
  return { queue: out, heroes, townHall: th }
}

// ── Town Hall readiness ──────────────────────────────────────────────────────

/**
 * The guide's checklist before hitting the Town Hall button: camps and CC done,
 * every new building placed, merge prerequisites met, Eagle maxed before TH17.
 */
export function townHallPlan(village) {
  const caps = capsOf(village)
  const th = village.townHallLevel
  const next = nextLevel(entities[IDS.townHall], th, { ...caps, townHall: 99 })
  const checks = []

  for (const id of [IDS.armyCamp, IDS.clanCastle]) {
    const entity = entities[id]
    const g = village.groups.get(id)
    const cap = capLevel(entity, caps)
    const atCap = g ? g.minLevel >= cap : false
    checks.push({
      key: entity.name,
      ok: atCap,
      detail: g ? `all at ${cap}` : 'not placed',
      have: g ? `${g.minLevel}` : '0',
      want: `${cap}`,
      note: 'Guide priority #2 - never skip these.',
    })
  }

  const missing = missingBuildings(village)
  const missingBuild = missing.filter((m) => !m.isTrap).reduce((n, m) => n + m.missing, 0)
  const missingTrap = missing.filter((m) => m.isTrap).reduce((n, m) => n + m.missing, 0)
  checks.push({
    key: 'New buildings placed',
    ok: missingBuild === 0,
    detail: missingBuild === 0 ? 'all placed' : `${missingBuild} still to place`,
    have: `${missingBuild}`,
    want: '0',
    note: 'Cheap, fast, and the single most efficient thing you can spend a builder on.',
  })
  if (missingTrap > 0) {
    checks.push({
      key: 'Traps placed',
      ok: false,
      detail: `${missingTrap} still to place`,
      have: `${missingTrap}`,
      want: '0',
      note: 'Low priority - traps are near the bottom of the defensive tier list. Do not hold the Town Hall for these.',
      soft: true,
    })
  }

  const { merges } = mergePlan(village)
  for (const m of merges) {
    if (!m.remaining) continue
    for (const s of m.sources) {
      checks.push({
        key: `${s.entity.name} at ${s.sourceMax} for ${m.entity.name}`,
        ok: s.atMax >= s.need,
        detail: `${s.atMax} of ${s.need} ready`,
        have: `${s.atMax}`,
        want: `${s.need}`,
        note: `${m.remaining} more ${m.entity.name} to build.`,
      })
    }
  }

  // Eagle has to be finished before it disappears at TH17. It is only a gate as
  // that deadline approaches - before then it is just a good overflow-book target.
  const eagle = entities[IDS.eagleArtillery]
  const eagleAvail = eagle?.avail?.[th]
  if (eagleAvail && th >= 15) {
    const g = village.groups.get(IDS.eagleArtillery)
    const cap = capLevel(eagle, caps)
    const lvl = g ? g.maxLevel : 0
    checks.push({
      key: 'Eagle Artillery maxed',
      ok: lvl >= cap,
      detail: g ? `level ${lvl} of ${cap}` : 'not built',
      have: `${lvl}`,
      want: `${cap}`,
      note: 'Must be maxed before TH17 - it is gone after that.',
    })
  }

  // TH17 has to leave with a Giga Artillery ready for TH18.
  if (th === MAX_TOWN_HALL - 1 && village.gigaWeapon != null) {
    checks.push({
      key: 'Giga weapon levelled',
      ok: village.gigaWeapon > 0,
      detail: `level ${village.gigaWeapon}`,
      have: `${village.gigaWeapon}`,
      want: '>0',
      note: 'Always be giga-ing. Nothing worse than finishing everything and forgetting it.',
    })
  }

  return {
    current: th,
    target: th + 1,
    isMax: village.isMaxTownHall,
    cost: next.maxed ? null : next.level.cost,
    resource: next.maxed ? null : next.level.res,
    secs: next.maxed ? null : next.level.secs,
    checks,
    ready: checks.every((c) => c.ok || c.soft),
  }
}

// ── alerts ───────────────────────────────────────────────────────────────────

/**
 * The guide's "if any of these is true, you have already waited too long" list,
 * plus the softer nudges.
 */
export function alerts(village, { workAvailable = true } = {}) {
  const out = []
  const th = village.townHallLevel
  const caps = capsOf(village)
  const heroes = heroPlan(village)
  const lab = labPlan(village)
  const walls = wallStatus(village)

  const add = (level, title, body) => out.push({ level, title, body })

  // The guide's trigger is an idle builder with *nothing worth building* - that
  // means the Town Hall should already be upgrading. An idle builder with work
  // still on the list is just an unstarted upgrade.
  if (village.builders.idle > 0) {
    const plural = village.builders.idle > 1 ? 's' : ''
    if (!workAvailable && !village.isMaxTownHall) {
      add(
        'critical',
        `${village.builders.idle} idle builder${plural} and nothing left to build`,
        'An idle builder is a deleted builder. If nothing here is worth a builder, you should have upgraded your Town Hall weeks ago.'
      )
    } else {
      add(
        'warn',
        `${village.builders.idle} idle builder${plural}`,
        'Start something. Builder time you do not spend is builder time you never get back.'
      )
    }
  }

  const maxedHeroes = heroes.heroes.filter((h) => h.unlocked && h.atCap)
  if (maxedHeroes.length && !village.isMaxTownHall) {
    const names = maxedHeroes.map((h) => h.entity.name)
    add(
      'critical',
      names.length === 1
        ? `${names[0]} is maxed for this Town Hall`
        : `${names.length} heroes are maxed for this Town Hall`,
      `${names.join(', ')} cannot go further until the Hero Hall does, and the Hero Hall is waiting on the Town Hall. A maxed hero below max TH is the guide's clearest sign you are moving too slowly.`
    )
  }

  if (!lab.anyAvailable && !village.isMaxTownHall) {
    add('critical', 'Lab has nothing left to research', 'Maxed lab below max TH is one of the guide\'s hard triggers. Upgrade the Town Hall.')
  } else if (!lab.busy) {
    add('warn', 'Lab is idle', 'Lab time is the biggest single bottleneck to a fully maxed account. Never leave it empty.')
  }

  if (walls.maxed && !village.isMaxTownHall) {
    add('warn', 'Walls are maxed for this Town Hall', 'You have run out of the one thing that soaks up spare loot. Upgrade.')
  }

  const smith = entities[IDS.blacksmith]
  const smithCap = capLevel(smith, caps)
  if (village.blacksmithLevel > 0 && village.blacksmithLevel < smithCap) {
    add(
      'warn',
      `Blacksmith is ${village.blacksmithLevel}, could be ${smithCap}`,
      'Blacksmith caps how much ore you can hold. Overflowing ore is the one resource you cannot get back.'
    )
  } else if (village.blacksmithLevel === 0) {
    add('warn', 'No Blacksmith', 'Until it is built you cannot store ore at all. Priority #1 after heroes.')
  }

  if (th < 11) {
    add('warn', `TH${th} - get to TH11`, 'Below TH11 you have no Warden, no super troops, and you cannot earn orange ore at a useful rate.')
  } else if (th < 16) {
    add('info', `TH${th} - TH16 is the first real stopping point`, 'TH16 is where regular-war ore income maxes out. Everything between here and there is dead weight.')
  } else if (th === 16 || th === 17) {
    add('info', `TH${th} - do not linger`, 'Magic item value at this TH is poor. TH18 is where hammers and books start paying properly.')
  }

  if (!village.groups.get(IDS.buildersApprentice)) {
    add('info', 'No Builder\'s Apprentice', 'Level 8 AB cuts 3-6 weeks off every hero\'s run to the 8d bracket. Best gem spend after builders.')
  } else {
    const ab = village.groups.get(IDS.buildersApprentice)
    const abMax = normalLevels(entities[IDS.buildersApprentice]).slice(-1)[0]?.l ?? 8
    if (ab.maxLevel < abMax) {
      add('info', `Builder's Apprentice is ${ab.maxLevel} of ${abMax}`, 'Max him early and keep him glued to whichever hero is upgrading.')
    }
  }

  return out
}

// ── magic items ──────────────────────────────────────────────────────────────

/**
 * Where the free magic items should land. The whole reason rushing beats maxing
 * is that a rusher spends every hammer on a 15d upgrade instead of a 2d one.
 */
export function magicItemPlan(village) {
  const caps = capsOf(village)
  const candidates = []

  for (const g of village.groups.values()) {
    if (g.kind !== 'building') continue
    if (g.dataId === IDS.townHall || g.dataId === IDS.wall) continue
    const idle = g.instances.filter((i) => i.timer == null)
    if (!idle.length) continue
    const n = nextLevel(g.entity, idle[0].level, caps)
    if (n.maxed || n.blocked) continue
    candidates.push({
      entity: g.entity,
      dataId: g.dataId,
      from: idle[0].level,
      to: n.level.l,
      secs: n.level.secs ?? 0,
      cost: n.level.cost ?? 0,
      resource: n.level.res ?? 'gold',
    })
  }
  candidates.sort((a, b) => b.secs - a.secs)

  const heroes = heroPlan(village)
  const eightDayHero = heroes.heroes.find((h) => h.unlocked && h.inEightRange && !h.atCap)

  const lab = []
  for (const g of village.groups.values()) {
    if (!['troop', 'spell', 'siege'].includes(g.kind)) continue
    const n = nextLevel(g.entity, g.maxLevel, caps)
    if (n.maxed || n.blocked) continue
    lab.push({ entity: g.entity, from: g.maxLevel, to: n.level.l, secs: n.level.secs ?? 0, cost: n.level.cost ?? 0, resource: n.level.res ?? 'elixir' })
  }
  lab.sort((a, b) => b.secs - a.secs)

  return {
    hammerTargets: candidates.filter((c) => c.secs >= 14 * DAY).slice(0, 6),
    bookTargets: candidates.slice(0, 6),
    labTargets: lab.slice(0, 5),
    bestBuilding: candidates[0] ?? null,
    eightDayHero: eightDayHero ?? null,
    // Whoever heroPlan already nominated - which honours the guide's
    // Archer-Queen-first rule rather than picking on raw distance alone.
    closestToEight: heroes.primary && !heroes.primary.inEightRange ? heroes.primary : null,
  }
}

// ── top-level ────────────────────────────────────────────────────────────────

/**
 * One sentence: the thing to actually go do. Everything below it on the page is
 * supporting evidence.
 */
function verdict(village, { alerts: list, queue, townHallPlan: thp, heroes }) {
  const hardTrigger = list.find((a) => a.level === 'critical')

  if (!village.isMaxTownHall && hardTrigger) {
    return {
      headline: `Upgrade to Town Hall ${thp.target}.`,
      body: `${hardTrigger.title}. The guide treats that as a hard trigger - you are past the point where staying here costs you nothing.`,
      tone: 'critical',
    }
  }
  if (!village.isMaxTownHall && thp.ready) {
    return {
      headline: `Upgrade to Town Hall ${thp.target}.`,
      body: 'Camps, Clan Castle and every new building are done. There is nothing left here worth a builder.',
      tone: 'critical',
    }
  }
  const first = queue[0]
  if (first) {
    const what =
      first.kind === 'place'
        ? `Place ${first.count > 1 ? `${first.count} ` : ''}${first.entity.name}`
        : `${first.entity.name} ${first.from} → ${first.to}`
    return {
      headline: `${what}.`,
      body: first.why,
      tone: 'normal',
    }
  }
  if (village.isMaxTownHall) {
    const h = heroes.primary
    return {
      headline: h ? `${h.entity.name} ${h.level} → ${h.level + 1}.` : 'Heroes, then core defenses.',
      body: 'At max Town Hall the game is hero levels and equipment. Run as many heroes at once as you can stand.',
      tone: 'normal',
    }
  }
  return { headline: `Upgrade to Town Hall ${thp.target}.`, body: 'Nothing else here is worth builder time.', tone: 'critical' }
}

export function buildPlan(village) {
  const q = upgradeQueue(village)
  const parts = {
    village,
    alerts: alerts(village, { workAvailable: q.queue.length > 0 }),
    ...q,
    townHallPlan: townHallPlan(village),
    equipment: equipmentPlan(village),
    lab: labPlan(village),
    magic: magicItemPlan(village),
    walls: wallStatus(village),
    merges: mergePlan(village).merges,
    blocked: blockedUpgrades(village),
    datasetLag: datasetLag(village),
    maxTownHall: MAX_TOWN_HALL,
  }
  return { ...parts, verdict: verdict(village, parts) }
}
