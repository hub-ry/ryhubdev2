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
  NewExport,
} from './Sections.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import './clash.css'

const STORAGE_KEY = 'clash:export'

function Paste({ onSubmit, error }) {
  const [text, setText] = useState('')

  const readClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText()
      setText(t)
      onSubmit(t)
    } catch {
      // Clipboard permission denied - the textarea is the fallback.
    }
  }

  return (
    <div className="c-paste">
      <ol className="c-how">
        <li>In game, open Settings (the gear).</li>
        <li>
          Tap <em>More Settings</em>.
        </li>
        <li>
          Under <em>Data export</em>, tap <em>Copy</em>.
        </li>
        <li>Paste it here.</li>
      </ol>

      <textarea
        className="c-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          const t = e.clipboardData.getData('text')
          if (t) {
            e.preventDefault()
            setText(t)
            onSubmit(t)
          }
        }}
        placeholder={'{"tag":"#...","timestamp":...,"buildings":[...]}'}
        spellCheck="false"
        rows={6}
      />

      {error ? <p className="c-error">{error}</p> : null}

      <div className="c-actions">
        <button className="c-btn" onClick={() => onSubmit(text)} disabled={!text.trim()}>
          read my village
        </button>
        <button className="c-btn is-quiet" onClick={readClipboard}>
          paste from clipboard
        </button>
        <button className="c-btn is-quiet" onClick={() => onSubmit(JSON.stringify(sample))}>
          use a sample
        </button>
      </div>

      <p className="c-fine">
        Everything runs in this browser. The JSON is kept in local storage on this device and is
        never uploaded.
      </p>
    </div>
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

      <div className="c-wrap">
        <header className="c-head">
          <h1 className="c-title">clash</h1>
          <p className="c-sub">
            Paste your village export. Get the upgrade order a strategic rush actually calls for.
          </p>
        </header>

        {!plan || plan.fatal ? (
          <>
            {plan?.fatal ? <p className="c-error">{plan.fatal}</p> : null}
            <Paste onSubmit={submit} error={error} />
          </>
        ) : (
          <>
            <Meta village={plan.village} plan={plan} source={gamedata.source} />
            <NewExport onReset={reset} takenAt={plan.village.takenAt} />
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
            <NewExport onReset={reset} takenAt={plan.village.takenAt} />
          </>
        )}

        <footer className="c-foot">
          <p>
            Priorities follow CallMeTee&rsquo;s Strategic Rush Bible, v1.6.4. Game numbers from{' '}
            <code>{gamedata.source}</code>, generated {gamedata.generatedAt}. Not affiliated with
            Supercell.
          </p>
        </footer>
      </div>
    </div>
  )
}
