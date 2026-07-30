import { useState } from 'react'
import { DEFENSE_TIERS } from './rush.js'
import { duration, days, count, cost, finishesAt, ago } from './format.js'

const titleCase = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function Section({ label, note, children }) {
  return (
    <section className="c-section">
      <div className="c-label">
        {label}
        {note ? <span className="c-label-note">{note}</span> : null}
      </div>
      {children}
    </section>
  )
}

export function Verdict({ verdict }) {
  return (
    <div className={`c-verdict is-${verdict.tone}`}>
      <div className="c-verdict-head">{verdict.headline}</div>
      <p className="c-verdict-body">{verdict.body}</p>
    </div>
  )
}

export function Flags({ alerts, verdict }) {
  // The verdict already states one alert in full; repeating it directly
  // underneath is just noise.
  const shown = alerts.filter((a) => a !== verdict?.from)
  if (!shown.length) return null
  return (
    <Section label="Flags">
      <ul className="c-flags">
        {shown.map((a, i) => (
          <li key={i} className={`c-flag is-${a.level}`}>
            <span className="c-flag-dot" aria-hidden="true" />
            <div>
              <div className="c-flag-title">{a.title}</div>
              <div className="c-flag-body">{a.body}</div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Queue({ queue }) {
  const [all, setAll] = useState(false)
  if (!queue.length) {
    return (
      <Section label="Do next">
        <p className="c-empty">
          Nothing here is worth a builder. That is the signal to upgrade your Town Hall.
        </p>
      </Section>
    )
  }

  const shown = all ? queue : queue.slice(0, 12)

  return (
    <Section label="Do next" note={`${queue.length} in priority order`}>
      <ol className="c-queue">
        {shown.map((q, i) => {
          const newTier = i === 0 || shown[i - 1].tier.label !== q.tier.label
          return (
            <li key={`${q.kind}-${q.dataId}-${i}`} className="c-row">
              {newTier ? <div className="c-tier">{q.tier.label}</div> : null}
              <div className="c-row-main">
                <span className="c-row-n">{i + 1}</span>
                <span className="c-row-name">{q.entity.name}</span>
                <span className="c-row-move">
                  {q.kind === 'place' ? `place ${q.count > 1 ? `× ${q.count}` : ''}` : `${q.from} → ${q.to}`}
                </span>
                <span className="c-row-meta">{duration(q.secs)}</span>
                <span className="c-row-meta">{cost(q.cost, q.resource)}</span>
              </div>
              <div className="c-row-why">{q.why}</div>
            </li>
          )
        })}
      </ol>
      {queue.length > 12 ? (
        <button className="c-more" onClick={() => setAll((v) => !v)}>
          {all ? 'show less' : `show all ${queue.length}`}
        </button>
      ) : null}
    </Section>
  )
}

export function TownHall({ plan, maxTownHall }) {
  if (plan.isMax) {
    return (
      <Section label="Town Hall">
        <p className="c-empty">
          TH{plan.current} is the current max. From here it is heroes, equipment and core defenses —
          keep enough long timers unfinished to soak up every hammer you earn.
        </p>
      </Section>
    )
  }
  return (
    <Section
      label={`Town Hall ${plan.current} → ${plan.target}`}
      note={`${cost(plan.cost, plan.resource)} · ${duration(plan.secs)}`}
    >
      <div className={`c-gate ${plan.ready ? 'is-ready' : ''}`}>
        {plan.ready
          ? 'Ready. Every prerequisite the guide cares about is done.'
          : 'Not ready yet — finish these first.'}
      </div>
      <ul className="c-checks">
        {plan.checks.map((c, i) => (
          <li key={i} className={`c-check ${c.ok ? 'is-ok' : c.soft ? 'is-soft' : 'is-bad'}`}>
            <span className="c-check-mark">{c.ok ? '✓' : c.soft ? '·' : '✗'}</span>
            <span className="c-check-key">{c.key}</span>
            <span className="c-check-detail">{c.detail}</span>
            <span className="c-check-note">{c.note}</span>
          </li>
        ))}
      </ul>
      {plan.target === maxTownHall ? (
        <p className="c-fine">
          This is the one Town Hall worth booking — TH{maxTownHall - 1}→{maxTownHall} runs about as
          long as the TH{maxTownHall} upgrades a book would otherwise skip.
        </p>
      ) : (
        <p className="c-fine">
          Do not book this. Time it to finish on day 2 of CWL and spend the book on a 15d+ offensive
          upgrade instead.
        </p>
      )}
    </Section>
  )
}

export function Blocked({ blocked }) {
  if (!blocked.length) return null
  return (
    <Section label="Locked" note="upgrades that exist but are gated">
      <ul className="c-blocked">
        {blocked.map((b, i) => (
          <li key={i}>
            <div className="c-blocked-gate">
              {b.gate.label}
              <span className="c-blocked-count">
                unlocks {b.items.length} upgrade{b.items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="c-blocked-items">
              {b.items
                .slice(0, 10)
                .map((it) => `${it.entity.name} ${it.from}→${it.to}`)
                .join(' · ')}
              {b.items.length > 10 ? ` · +${b.items.length - 10} more` : ''}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Heroes({ heroes, primary }) {
  const unlocked = heroes.filter((h) => h.unlocked)
  const locked = heroes.filter((h) => !h.unlocked)
  return (
    <Section label="Heroes" note="Books of Heroes are only worth full value on 8d upgrades">
      <table className="c-table">
        <thead>
          <tr>
            <th>Hero</th>
            <th className="n">Lvl</th>
            <th className="n">Cap</th>
            <th>8d status</th>
            <th className="n">8d left</th>
            <th className="n">To max</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {unlocked.map((h) => (
            <tr key={h.dataId} className={h.dataId === primary?.dataId ? 'is-primary' : ''}>
              <td>
                {h.entity.name}
                {h.dataId === primary?.dataId ? <span className="c-pill">focus</span> : null}
              </td>
              <td className="n">{h.level}</td>
              <td className="n">{h.capped}</td>
              <td>{h.inEightRange ? 'in 8d range' : `${days(h.secsTo8d)} of upgrades away`}</td>
              <td className="n">{h.eightDayUpgradesLeft}</td>
              <td className="n">{days(h.secsToMax)}</td>
              <td>
                {h.upgrading ? (
                  <span className="c-live">upgrading · {duration(h.upgrading.timer)} left</span>
                ) : h.cappedBy?.fixable ? (
                  // Held by a building you can upgrade today, not by the Town Hall.
                  <span className="c-bad">
                    held by {h.cappedBy.entity.name} {h.cappedBy.level}
                  </span>
                ) : h.atCap ? (
                  <span className="c-bad">maxed for this TH</span>
                ) : h.next.blocked ? (
                  `needs ${h.next.gate.label}`
                ) : (
                  'asleep'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {locked.length ? (
        <p className="c-fine">Not unlocked yet: {locked.map((h) => h.entity.name).join(', ')}.</p>
      ) : null}
      <p className="c-fine">
        Keep one hero down 24/7 — the Archer Queen first, since her run to the 8d bracket is the
        longest in the game and you can lean on Warden and Champion meanwhile.
      </p>
    </Section>
  )
}

// Back-solved from the guide's own stated timelines: a full epic costs 480 starry
// ore, which the guide puts at ~42 days with an Event Pass and "nearly 3 months"
// without. These are estimates, not measured income.
const ORE_PRESETS = [
  { key: 'f2p', label: 'F2P', starry: 480 / 85 },
  { key: 'pass', label: 'Event Pass', starry: 480 / 42 },
]

export function Equipment({ equipment }) {
  const [preset, setPreset] = useState('pass')
  const rate = ORE_PRESETS.find((p) => p.key === preset)?.starry ?? 0
  const eta = rate > 0 ? equipment.totals.starry / rate : null

  return (
    <Section
      label="Equipment"
      note={`${equipment.done} of ${equipment.target} in the guide's starting eight are maxed`}
    >
      <table className="c-table">
        <thead>
          <tr>
            <th>Piece</th>
            <th className="n">Lvl</th>
            <th className="n">Shiny</th>
            <th className="n">Glowy</th>
            <th className="n">Starry</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          {equipment.rows.map((r, i) =>
            r.missingFromDataset ? (
              <tr key={i} className="is-unknown">
                <td className="c-name">{titleCase(r.slug)}</td>
                <td className="n">—</td>
                <td className="n" colSpan={3}>
                  not in the bundled game data yet
                </td>
                <td>{r.why}</td>
              </tr>
            ) : (
              <tr key={r.dataId} className={r.maxed ? 'is-done' : ''}>
                <td className="c-name">
                  {r.entity.name}
                  {!r.owned ? <span className="c-pill">not owned</span> : null}
                  {r.usedAlt ? <span className="c-pill">your pick</span> : null}
                </td>
                <td className="n">
                  {r.level}/{r.maxLevel}
                </td>
                <td className="n">{r.remaining.shiny ? count(r.remaining.shiny) : '—'}</td>
                <td className="n">{r.remaining.glowy ? count(r.remaining.glowy) : '—'}</td>
                <td className="n">{r.remaining.starry ? count(r.remaining.starry) : '—'}</td>
                <td className="c-why">{r.why}</td>
              </tr>
            )
          )}
        </tbody>
        <tfoot>
          <tr>
            <td>Remaining</td>
            <td className="n" />
            <td className="n">{count(equipment.totals.shiny)}</td>
            <td className="n">{count(equipment.totals.glowy)}</td>
            <td className="n">{count(equipment.totals.starry)}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div className="c-ore-eta">
        <span className="c-fine">Starry ore is the whole bottleneck. At</span>
        {ORE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`c-toggle ${preset === p.key ? 'is-on' : ''}`}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
        <span className="c-fine">
          income (≈{rate.toFixed(1)}/day), that is{' '}
          <strong>{eta ? `${Math.round(eta)} days` : '—'}</strong> of starry ore.
        </span>
      </div>
      <p className="c-fine">
        Common equipment costs <em>no</em> starry ore at all. When orange runs dry, push a common to
        max instead of stalling — that is the whole trick.
      </p>
    </Section>
  )
}

export function Lab({ lab }) {
  return (
    <Section
      label="Laboratory"
      note={`level ${lab.level} of ${lab.cap} · ${lab.busy ? 'researching' : 'idle'}`}
    >
      <p className={lab.researching.length ? 'c-fine c-lead' : 'c-bad c-lead'}>
        {lab.researching.length
          ? lab.researching
              .map((g) => `${g.entity.name} → ${g.maxLevel + 1}, ${duration(g.upgrading[0].timer)} left`)
              .join(' · ')
          : 'Nothing researching. The lab is the largest single bottleneck to a maxed account.'}
      </p>
      <table className="c-table">
        <thead>
          <tr>
            <th>Troop / spell</th>
            <th>Role</th>
            <th className="n">Lvl</th>
            <th className="n">Cap</th>
            <th>Next</th>
          </tr>
        </thead>
        <tbody>
          {lab.rows.map((r) => {
            // The player can be a level ahead of the bundled dataset after a
            // game update. Say so rather than claiming "maxed".
            const ahead = r.unlocked && r.level > r.cap
            return (
              <tr key={r.dataId}>
                <td className="c-name">{r.entity.name}</td>
                <td className="c-why">{r.tier}</td>
                <td className="n">{r.unlocked ? r.level : '—'}</td>
                <td className="n">{ahead ? r.level : r.cap}</td>
                <td>
                  {r.upgrading ? (
                    <span className="c-live">researching · {duration(r.upgrading.timer)}</span>
                  ) : ahead ? (
                    <span className="c-lag">past the bundled game data</span>
                  ) : r.next.maxed ? (
                    'maxed'
                  ) : r.next.blocked ? (
                    `needs ${r.next.gate.label}`
                  ) : (
                    `→ ${r.next.level.l} · ${duration(r.next.level.secs)} · ${cost(r.next.level.cost, r.next.level.res)}`
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="c-fine">
        Farming troops first — you will run hundreds of those attacks a month. Donation troops and
        the war comp get whatever is left over.
      </p>
    </Section>
  )
}

export function MagicItems({ magic }) {
  const line = (t) => `${t.entity.name} ${t.from}→${t.to} · ${duration(t.secs)}`
  return (
    <Section label="Magic items" note="the whole reason rushing beats maxing">
      <dl className="c-defs">
        <dt>Book of Heroes</dt>
        <dd>
          {magic.eightDayHero ? (
            <>
              Spend on <strong>{magic.eightDayHero.entity.name}</strong> — already in the 8d bracket,
              which is full value. {magic.eightDayHero.eightDayUpgradesLeft} 8d upgrades left.
            </>
          ) : magic.closestToEight ? (
            <>
              No hero in the 8d bracket yet, so every book is burning value.{' '}
              <strong>{magic.closestToEight.entity.name}</strong> is closest —{' '}
              {days(magic.closestToEight.secsTo8d)} of upgrades away.
            </>
          ) : (
            'No hero available to book.'
          )}
        </dd>

        <dt>Hammer of Building</dt>
        <dd>
          {magic.hammerTargets.length ? (
            <>Best targets (14d+): {magic.hammerTargets.map(line).join(' · ')}</>
          ) : (
            <>
              Nothing at 14d+ yet. Hold your CWL medals — a hammer on a short timer is most of its
              value thrown away.
            </>
          )}
        </dd>

        <dt>Book of Building</dt>
        <dd>
          {magic.bestBuilding ? (
            <>Longest upgrade you can start right now: {line(magic.bestBuilding)}.</>
          ) : (
            'Nothing available.'
          )}
        </dd>

        <dt>Hammer / Book of Fighting</dt>
        <dd>
          {magic.labTargets.length
            ? `Longest research available: ${magic.labTargets.map(line).join(' · ')}`
            : 'Nothing available.'}
        </dd>

        <dt className="is-warn">Hammer of Heroes</dt>
        <dd>
          Do not buy it. A building hammer buys more than twice the hours per medal, and you can
          afford more of them per month.
        </dd>
      </dl>
    </Section>
  )
}

export function Defenses({ village, plan }) {
  const [open, setOpen] = useState(false)
  const rows = []
  for (const [tier, ids] of Object.entries(DEFENSE_TIERS)) {
    for (const id of ids) {
      const g = village.groups.get(id)
      if (!g) continue
      rows.push({ tier, name: g.entity.name, min: g.minLevel, max: g.maxLevel, n: g.total })
    }
  }
  if (!rows.length) return null

  return (
    <Section label="Defenses" note="only worth builder time once offense is finished">
      <button className="c-more" onClick={() => setOpen((v) => !v)}>
        {open ? 'hide tier list' : 'show tier list'}
      </button>
      {open ? (
        <table className="c-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Building</th>
              <th className="n">Count</th>
              <th className="n">Levels</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <span className={`c-tierbadge is-${r.tier}`}>{r.tier}</span>
                </td>
                <td>{r.name}</td>
                <td className="n">{r.n}</td>
                <td className="n">{r.min === r.max ? r.min : `${r.min}–${r.max}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <p className="c-fine">
        Walls: {plan.walls.atMax} of {plan.walls.total} at level {plan.walls.max}. Never idle a
        builder for walls — dump spare loot into them whenever a builder frees up.
      </p>
    </Section>
  )
}

// Buildings, traps and heroes occupy a builder. Research occupies the lab and
// pets occupy the Pet House - neither costs builder time.
const WORKER = {
  building: 'builder',
  trap: 'builder',
  hero: 'builder',
  troop: 'lab',
  spell: 'lab',
  siege: 'lab',
  pet: 'pet house',
}

export function InProgress({ village }) {
  const items = []
  for (const g of village.groups.values()) {
    for (const inst of g.upgrading) {
      items.push({
        name: g.entity.name,
        worker: WORKER[g.kind] ?? g.kind,
        timer: inst.timer,
        from: inst.level,
      })
    }
  }
  if (!items.length) return null
  items.sort((a, b) => a.timer - b.timer)

  const { busy, total, idle } = village.builders
  return (
    <Section
      label="In progress"
      note={`${busy} of ${total} builders busy${idle ? ` · ${idle} idle` : ''}`}
    >
      <table className="c-table">
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="c-name">{it.name}</td>
              <td className="c-why">
                {it.from} → {it.from + 1}
              </td>
              <td className="c-why">{it.worker}</td>
              <td className="n">{duration(it.timer)}</td>
              <td className="c-why">{finishesAt(it.timer)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

/**
 * Paste a fresh export. Offered at the top and again at the bottom, since a
 * snapshot goes stale the moment anything finishes and the plan is long enough
 * that scrolling back up to a small link is a nuisance.
 */
export function NewExport({ onReset, takenAt }) {
  return (
    <div className="c-newexport">
      <button className="c-btn is-big" onClick={onReset}>
        paste a new export
      </button>
      <span className="c-fine">
        {takenAt
          ? `This plan is from a snapshot taken ${ago(takenAt)}. Re-export from the game for current timers.`
          : 'Re-export from the game whenever you want current timers.'}
      </span>
    </div>
  )
}

export function Meta({ village, plan, source }) {
  return (
    <div className="c-meta">
      <span className="c-meta-tag">{village.tag ?? 'unknown tag'}</span>
      <span>TH{village.townHallLevel}</span>
      <span>
        {village.builders.busy}/{village.builders.total} builders
      </span>
      {village.takenAt ? <span>snapshot {ago(village.takenAt)}</span> : null}
      {plan.datasetLag.length ? (
        <span className="c-lag" title={plan.datasetLag.map((d) => `${d.entity.name} ${d.owned} > ${d.known}`).join(', ')}>
          game data is behind on {plan.datasetLag.length}
        </span>
      ) : null}
      {village.unknown.length ? (
        <span className="c-lag">{village.unknown.length} unrecognised item{village.unknown.length > 1 ? 's' : ''}</span>
      ) : null}
      <span className="c-meta-src">{source}</span>
    </div>
  )
}
