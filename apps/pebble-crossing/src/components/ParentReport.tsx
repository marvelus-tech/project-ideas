import { useState } from 'react'

import { CHILD_NAME_KEY, PARENT_REPORT_KEY } from '../content/level6'
import { setMicCheckOff } from '../lib/params'
import { confirmParentRead, formatParentSentence } from '../session/sessionStats'
import type { ParentReportData } from '../session/types'
import './ParentReport.css'

function loadReport(): ParentReportData | null {
  try {
    const raw = window.sessionStorage.getItem(PARENT_REPORT_KEY)
    return raw ? JSON.parse(raw) as ParentReportData : null
  } catch {
    return null
  }
}

export function ParentReportPage({ onBack }: { onBack: () => void }) {
  const [report, setReport] = useState<ParentReportData | null>(loadReport)
  const [name, setName] = useState(() => window.sessionStorage.getItem(CHILD_NAME_KEY) ?? 'Sam')
  const [micOff, setMicOff] = useState(() => window.sessionStorage.getItem('pebble-crossing-mic-off') === '1')
  const sentence = report ? formatParentSentence({ ...report, childName: name }) : `${name}: Finish a session on the child screen first. Pronunciation was not assessed.`

  function save(next: ParentReportData) {
    window.sessionStorage.setItem(PARENT_REPORT_KEY, JSON.stringify(next))
    setReport(next)
  }

  return (
    <main className="parent-page">
      <p className="eyebrow">Today at Pebble Crossing</p>
      <h1>Grown-up note</h1>
      <label>Child nickname
        <input value={name} onChange={(event) => {
          setName(event.target.value)
          window.sessionStorage.setItem(CHILD_NAME_KEY, event.target.value)
        }} />
      </label>
      <p className="report">{sentence}</p>
      <ul className="legend">
        <li>Bolt: independent sound choice.</li>
        <li>Rope wrap: you did that step together.</li>
        <li>Practice sign: the sentence was not checked as fluent reading.</li>
      </ul>
      <div className="choices">
        <button type="button" onClick={() => report && save(confirmParentRead({ ...report, childName: name }))}>I heard the full sentence</button>
        <button type="button" onClick={() => report && save({ ...report, childName: name, sentenceOutcome: 'not_yet_parent' })}>Not yet</button>
      </div>
      <details>
        <summary>Playtest controls</summary>
        <label className="check"><input type="checkbox" checked={micOff} onChange={(event) => { setMicOff(event.target.checked); setMicCheckOff(event.target.checked) }} /> Mic check off. This never verifies speech.</label>
      </details>
      <button type="button" className="back" onClick={onBack}>Back to the child session</button>
    </main>
  )
}