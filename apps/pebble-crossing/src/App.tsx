import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { GameSession } from './components/GameSession'
import { ParentReportPage } from './components/ParentReport'
import { LandingPage } from './landing/LandingPage'
import { isParentEntry, parentHref } from './session/parentEntry'
import './App.css'

export default function App() {
  const [parent, setParent] = useState(() => isParentEntry(window.location.href))

  function openParent() {
    const href = parentHref(window.location.href)
    window.history.pushState({}, '', href)
    setParent(true)
  }

  function closeParent() {
    if (/\/parent\/?$/.test(window.location.pathname)) {
      window.location.assign(`${import.meta.env.BASE_URL}play`)
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('parent')
    url.hash = ''
    window.history.pushState({}, '', `${url.pathname}${url.search}`)
    setParent(false)
  }

  const playShell = parent ? (
    <ParentReportPage onBack={closeParent} />
  ) : (
    <GameSession onParent={openParent} suspended={false} />
  )

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={playShell} />
        <Route path="/parent" element={<ParentReportPage onBack={() => window.location.assign(import.meta.env.BASE_URL)} />} />
        <Route
          path="*"
          element={<Navigate to={parent ? '/play?parent=1#parent' : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}