import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { PARENT_REPORT_KEY, CHILD_NAME_KEY } from '../content/level6'
import { setMicCheckOff } from '../lib/params'
import { formatParentSentence } from '../session/sessionStats'
import type { ParentReportData } from '../session/types'

import './ParentReport.css'

function loadReport(): ParentReportData | null {
  try {
    const raw = sessionStorage.getItem(PARENT_REPORT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ParentReportData
  } catch {
    return null
  }
}

export function ParentReportPage() {
  const [report, setReport] = useState<ParentReportData | null>(() => loadReport())
  const [childName, setChildName] = useState(
    () => sessionStorage.getItem(CHILD_NAME_KEY) ?? 'Sam',
  )
  const [micOff, setMicOff] = useState(
    () => sessionStorage.getItem('pebble-crossing-mic-off') === '1',
  )

  useEffect(() => {
    const id = window.setInterval(() => setReport(loadReport()), 1500)
    return () => window.clearInterval(id)
  }, [])

  const sentence = report
    ? formatParentSentence({ ...report, childName })
    : `${childName}: Complete a session on the child screen first.`

  return (
    <main className="parent-page">
      <h1>Parent report</h1>
      <p className="parent-note">
        RevEDU Pebble Crossing playtest. The child never sees this screen.
      </p>

      <label className="parent-field">
        Child nickname (for the one sentence)
        <input
          value={childName}
          onChange={(e) => {
            setChildName(e.target.value)
            sessionStorage.setItem(CHILD_NAME_KEY, e.target.value)
          }}
        />
      </label>

      <p className="parent-sentence" role="status">
        {sentence}
      </p>

      <label className="parent-mic-toggle">
        <input
          type="checkbox"
          checked={micOff}
          onChange={(e) => {
            setMicOff(e.target.checked)
            setMicCheckOff(e.target.checked)
          }}
        />
        Mic check off (forces practice sign and abstaining fluency line)
      </label>

      <p className="parent-links">
        <Link to="/">Back to child session</Link>
      </p>

      <p className="parent-template-help">
        Template: {'{Name}: {pattern} {result}. Math within {range}: {first-try} of {attempts} first try. Sentence: {outcome}.'}
      </p>
    </main>
  )
}