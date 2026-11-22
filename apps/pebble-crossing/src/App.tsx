import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { GameSession } from './components/GameSession'
import { ParentReportPage } from './components/ParentReport'
import { LandingPage } from './landing/LandingPage'
import { isParentEntry, parentHref } from './session/parentEntry'
import './App.css'

function LegacyPlayRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={`/pebble-crossing${search}${hash}`} replace />
}

export default function App() {
  const [parent, setParent] = useState(() => isParentEntry(window.location.href))

  function openParent() {
    const href = parentHref(window.location.href)
    window.history.pushState({}, '', href)
    setParent(true)
  }

  function closeParent() {
    if (/\/parent\/?$/.test(window.location.pathname)) {
      window.location.assign(`${import.meta.env.BASE_URL}pebble-crossing`)
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
        <Route path="/pebble-crossing" element={playShell} />
        <Route path="/play" element={<LegacyPlayRedirect />} />
        <Route path="/parent" element={<ParentReportPage onBack={() => window.location.assign(import.meta.env.BASE_URL)} />} />
        <Route
          path="*"
          element={<Navigate to={parent ? '/pebble-crossing?parent=1#parent' : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}