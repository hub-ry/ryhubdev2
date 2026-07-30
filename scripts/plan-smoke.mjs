/**
 * Regression check for the /clash planner.
 *
 *   node scripts/plan-smoke.mjs
 *
 * Asserts the guide's rules still hold against two fixtures: a real TH17 export
 * (offense finished, so the answer is "upgrade") and a rushed TH12 (plenty of
 * work left, so the answer is "start the list").
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseExport } from '../src/clash/parseExport.js'
import { buildPlan } from '../src/clash/rush.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (p) => buildPlan(parseExport(readFileSync(join(ROOT, p), 'utf8')))

let failures = 0
const check = (name, cond, detail = '') => {
  if (cond) {
    console.log(`  ok   ${name}`)
  } else {
    failures++
    console.log(`  FAIL ${name}${detail ? ` - ${detail}` : ''}`)
  }
}

console.log('TH17, offense finished (src/clash/sample.json)')
{
  const p = load('src/clash/sample.json')
  const v = p.village

  check('reads Town Hall 17', v.townHallLevel === 17, `got ${v.townHallLevel}`)
  // 5 Builder's Huts + B.O.B's Hut, and every one of them has a timer.
  check('counts 6 builders, all busy', v.builders.total === 6 && v.builders.busy === 6, JSON.stringify(v.builders))
  // Lab research and pet upgrades must not be mistaken for builder work.
  check('lab and pet work excluded from builders', v.builders.idle === 0)
  check('verdict is to upgrade the Town Hall', /Town Hall 18/.test(p.verdict.headline), p.verdict.headline)
  check('maxed heroes collapse into one flag', p.alerts.filter((a) => /maxed for this Town Hall/.test(a.title)).length === 1)
  check('Town Hall is ready', p.townHallPlan.ready === true)
  // At TH17 every cannon and archer tower has been merged away.
  check('no phantom "place a Cannon" suggestions', !p.queue.some((q) => q.kind === 'place' && q.entity.id === 'cannon'))
  check('reports the Town Hall gate on locked upgrades', p.blocked.some((b) => /Town Hall 18/.test(b.gate.label)))
  check('detects dataset lag rather than hiding it', p.datasetLag.length > 0)
  check('a full epic needs 480 starry ore', p.equipment.rows.find((r) => r.entity?.id === 'action-figure')?.remaining.starry <= 480)
}

console.log('\nTH12, rushed with work left (scripts/fixtures/rushed-th12.json)')
{
  const p = load('scripts/fixtures/rushed-th12.json')
  const v = p.village

  check('reads Town Hall 12', v.townHallLevel === 12)
  check('counts 4 builders, 3 idle', v.builders.total === 4 && v.builders.idle === 3, JSON.stringify(v.builders))
  // Idle builders only mean "upgrade the TH" when there is nothing left to build.
  check('idle builders with work left are a warning, not critical', !p.alerts.some((a) => a.level === 'critical'))
  check('verdict starts the queue rather than the Town Hall', /Army Camp/.test(p.verdict.headline), p.verdict.headline)
  check('Town Hall is not ready', p.townHallPlan.ready === false)
  check('Army Camps rank above the lab', p.queue.findIndex((q) => q.entity.id === 'army-camp') < p.queue.findIndex((q) => q.entity.id === 'laboratory'))
  check('traps do not block the Town Hall', p.townHallPlan.checks.find((c) => c.key === 'Traps placed')?.soft === true)
  // The guide is unambiguous: Archer Queen first, even when another hero is nominally closer.
  check('Book of Heroes advice names the Archer Queen', p.magic.closestToEight?.entity.id === 'archer-queen', p.magic.closestToEight?.entity.name)
  check('Eagle is not a TH12 gate', !p.townHallPlan.checks.some((c) => /Eagle/.test(c.key)))
}

console.log('\nMalformed input')
{
  const cases = [
    ['empty string', ''],
    ['not JSON', 'hello'],
    ['a JSON array', '[]'],
    ['object with no buildings', '{"tag":"#X"}'],
  ]
  for (const [name, input] of cases) {
    let threw = false
    try {
      parseExport(input)
    } catch {
      threw = true
    }
    check(`rejects ${name}`, threw)
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
