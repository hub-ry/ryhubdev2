import { useEffect, useMemo, useState } from 'react'
import { parseExport, ParseError } from './parseExport.js'
import { buildPlan } from './rush.js'
import gamedata from './gamedata.json' with { type: 'json' }
import sample from './sample.json' with { type: 'json' }
import {
  Verdict,
  Flags,
  Queue,
  TownHall,
  Blocked,
  Heroes,
  Equipment,
  Lab,
  MagicItems,
  Defenses,
  InProgress,
  Meta,
} from './Sections.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import './clash.css'

const STORAGE_KEY = 'clash:export'

function Paste({ onSubmit, error }) {
  const [text, setText] = useState('')
  return (
    <div className="s-paste">
      <textarea
        className="s-input"
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          const t = e.clipboardData.getData('text')
          if (t) {
            e.preventDefault()
            setText(t)
            onSubmit(t)
          }
        }}
        placeholder="paste your village export"
        spellCheck="false"
        rows={4}
      />
      {error ? <p className="s-error">{error}</p> : null}
      <p className="s-fine">
        Settings → More Settings → Data export → Copy.{' '}
        <button className="s-link" onClick={() => onSubmit(JSON.stringify(sample))}>
          try a sample
        </button>
      </p>
    </div>
  )
}

function Todo({ plan }) {
  const next = plan.queue.slice(0, 8)
  return (
    <>
      <p className="s-headline">{plan.verdict.headline}</p>
      {next.length ? (
        <ol className="s-list">
          {next.map((q, i) => (
            <li key={`${q.kind}-${q.dataId}-${i}`}>
              {q.entity.name}{' '}
              <span className="s-muted">
                {q.kind === 'place' ? `place${q.count > 1 ? ` × ${q.count}` : ''}` : `${q.from} → ${q.to}`}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  )
}

export default function Clash({ dark, setDark }) {
  const [raw, setRaw] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [error, setError] = useState(null)
  const [why, setWhy] = useState(false)

  useEffect(() => {
    document.title = 'ryhub.dev/clash'
  }, [])

  const plan = useMemo(() => {
    if (!raw) return null
    try {
      return buildPlan(parseExport(raw))
    } catch (e) {
      if (e instanceof ParseError) return { fatal: e.message }
      return { fatal: 'Could not read that export. It may be from a newer game version.' }
    }
  }, [raw])

  const submit = (text) => {
    if (!text?.trim()) return
    try {
      buildPlan(parseExport(text))
    } catch (e) {
      setError(e instanceof ParseError ? e.message : 'Could not read that export.')
      return
    }
    setError(null)
    setRaw(text)
    try {
      localStorage.setItem(STORAGE_KEY, text)
    } catch {
      // Private mode / quota - the plan still renders for this session.
    }
  }

  const reset = () => {
    setRaw('')
    setWhy(false)
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <div className="page clash">
      <a className="back-home" href="/">
        ← ryhub.dev
      </a>
      <ThemeToggle dark={dark} setDark={setDark} />

      <main className={why ? 'c-wrap' : 's-wrap'}>
        <h1 className="s-title">clash</h1>

        {!plan || plan.fatal ? (
          <>
            {plan?.fatal ? <p className="s-error">{plan.fatal}</p> : null}
            <Paste onSubmit={submit} error={error} />
          </>
        ) : why ? (
          <>
            <Meta village={plan.village} plan={plan} source={gamedata.source} />
            <Verdict verdict={plan.verdict} />
            <Flags alerts={plan.alerts} verdict={plan.verdict} />
            <Queue queue={plan.queue} />
            <TownHall plan={plan.townHallPlan} maxTownHall={plan.maxTownHall} />
            <InProgress village={plan.village} />
            <Blocked blocked={plan.blocked} />
            <Heroes heroes={plan.heroes.heroes} primary={plan.heroes.primary} />
            <Equipment equipment={plan.equipment} />
            <Lab lab={plan.lab} />
            <MagicItems magic={plan.magic} />
            <Defenses village={plan.village} plan={plan} />
            <p className="s-fine">
              Priorities follow CallMeTee&rsquo;s Strategic Rush Bible, v1.6.4. Game numbers from{' '}
              <code>{gamedata.source}</code>, generated {gamedata.generatedAt}. Not affiliated with
              Supercell.
            </p>
            <nav className="s-foot">
              <button className="s-link" onClick={() => setWhy(false)}>
                back
              </button>
            </nav>
          </>
        ) : (
          <>
            <Todo plan={plan} />
            <nav className="s-foot">
              <button className="s-link" onClick={() => setWhy(true)}>
                why
              </button>
              <button className="s-link" onClick={reset}>
                new export
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  )
}
