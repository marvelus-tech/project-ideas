import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { GameSession } from './components/GameSession'
import { ParentReportPage } from './components/ParentReport'
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
      window.location.assign(import.meta.env.BASE_URL)
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('parent')
    url.hash = ''
    window.history.pushState({}, '', `${url.pathname}${url.search}`)
    setParent(false)
  }

  const shell = parent
    ? <ParentReportPage onBack={closeParent} />
    : <GameSession onParent={openParent} suspended={false} />

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={shell} />
        <Route path="/parent" element={<ParentReportPage onBack={closeParent} />} />
        <Route path="*" element={<Navigate to={parent ? '/?parent=1#parent' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}