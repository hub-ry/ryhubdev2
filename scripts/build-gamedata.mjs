/**
 * Regenerates src/clash/gamedata.json from the `clash-of-clans-data` npm package.
 *
 *   node scripts/build-gamedata.mjs [version]
 *
 * The package is ~86MB unpacked, so it is NOT a dependency. This script pulls the
 * tarball into a temp dir, keeps only the fields /clash needs, and writes a compact
 * JSON file that ships with the app. Re-run it when Supercell adds a Town Hall.
 */
import { mkdtemp, rm, readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/clash/gamedata.json')

// The dataset ships a couple of wrong / missing dataIds. Verified against a real
// in-game export: helper 93000002 is level-7-capped (Alchemist), 93000003 is the
// single-level Prospector, but the package tags prospector.json with 93000002.
const DATA_ID_OVERRIDES = { alchemist: 93000002, prospector: 93000003 }

const RESOURCE = {
  Gold: 'gold',
  Elixir: 'elixir',
  'Dark Elixir': 'dark',
  'Gold or Elixir': 'goldOrElixir',
  Gems: 'gems',
}

const secs = (t) =>
  t ? (t.days || 0) * 86400 + (t.hours || 0) * 3600 + (t.minutes || 0) * 60 + (t.seconds || 0) : 0

async function fetchPackage(version) {
  const meta = await (await fetch('https://registry.npmjs.org/clash-of-clans-data')).json()
  const v = version || meta['dist-tags'].latest
  const tarball = meta.versions[v].dist.tarball
  const dir = await mkdtemp(join(tmpdir(), 'cocdata-'))
  const tgz = join(dir, 'pkg.tgz')
  console.log(`  fetching clash-of-clans-data@${v}`)
  const res = await fetch(tarball)
  if (!res.ok) throw new Error(`tarball fetch failed: ${res.status}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tgz))
  // Only the JSON data is needed; skip the ~85MB of images.
  await run('tar', ['xzf', tgz, '-C', dir, 'package/data/home'])
  return { dir, root: join(dir, 'package/data/home'), version: v }
}

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.name.endsWith('.json')) out.push(p)
  }
  return out
}

/** Keeps only the level fields the planner reads. */
function compactLevel(lv, category) {
  const out = { l: lv.level }
  if (lv.townHallRequired != null) out.th = lv.townHallRequired
  if (lv.supercharge) out.sc = 1

  const cost = lv.buildCost ?? lv.upgradeCost ?? lv.researchCost
  const res = lv.buildCostResource ?? lv.upgradeCostResource ?? lv.researchCostResource
  if (cost != null) out.cost = cost
  if (res) out.res = RESOURCE[res] ?? res
  const time = secs(lv.buildTime ?? lv.upgradeTime ?? lv.researchTime)
  if (time) out.secs = time

  // Per-category unlock gates, so the planner can name the real bottleneck.
  if (lv.laboratoryRequired != null) out.lab = lv.laboratoryRequired
  if (lv.heroHallLevelRequired != null) out.hall = lv.heroHallLevelRequired
  if (lv.petHouseLevelRequired != null) out.pet = lv.petHouseLevelRequired
  if (lv.blacksmithLevelRequired != null) out.smith = lv.blacksmithLevelRequired
  if (lv.wallRings != null) out.rings = lv.wallRings

  if (category === 'hero-equipment') {
    out.ore = [lv.upgradeShinyOre || 0, lv.upgradeGlowingOre || 0, lv.upgradeStarryOre || 0]
  }
  if (category === 'town-hall') {
    out.maxBuildings = lv.maxBuildings
    out.maxTraps = lv.maxTraps
  }
  return out
}

async function main() {
  const { dir, root, version } = await fetchPackage(process.argv[2])
  try {
    const files = await walk(root)
    const entities = {}
    let skipped = 0

    for (const f of files) {
      const d = JSON.parse(await readFile(f, 'utf8'))
      if (!d || typeof d !== 'object' || !d.name) continue
      const dataId = DATA_ID_OVERRIDES[d.id] ?? d.dataId
      if (dataId == null) {
        skipped++
        continue
      }
      const e = {
        id: d.id,
        name: d.name,
        cat: d.category,
        levels: (d.levels || []).map((lv) => compactLevel(lv, d.category)),
      }
      if (d.availablePerTownHall) {
        e.avail = {}
        for (const a of d.availablePerTownHall) {
          e.avail[a.townHallLevel] = a.countAfterMerges != null
            ? [a.count, a.countAfterMerges]
            : a.count
        }
      }
      if (d.category === 'hero-equipment') {
        e.hero = d.hero
        e.rarity = d.rarity
      }
      if (d.barrackLevelRequired != null) e.barracks = d.barrackLevelRequired
      if (d.spellFactoryLevelRequired != null) e.factory = d.spellFactoryLevelRequired
      if (d.workshopLevelRequired != null) e.workshop = d.workshopLevelRequired
      if (d.housingSpace != null) e.space = d.housingSpace
      if (d.troopType) e.troopType = d.troopType
      if (d.spellType) e.spellType = d.spellType
      if (d.rarity) e.rarity = d.rarity
      entities[dataId] = e
    }

    const th = entities['1000001']
    const out = {
      source: `clash-of-clans-data@${version}`,
      generatedAt: new Date().toISOString().slice(0, 10),
      maxTownHall: Math.max(...th.levels.map((l) => l.l)),
      entities,
    }

    await mkdir(dirname(OUT), { recursive: true })
    await writeFile(OUT, JSON.stringify(out))
    const kb = (JSON.stringify(out).length / 1024).toFixed(0)
    console.log(
      `  wrote ${OUT} - ${Object.keys(entities).length} entities, max TH ${out.maxTownHall}, ${kb}KB` +
        (skipped ? ` (${skipped} files had no dataId)` : '')
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
