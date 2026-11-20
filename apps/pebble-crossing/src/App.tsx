import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { GameSession } from './components/GameSession'
import { ParentReportPage } from './components/ParentReport'
import './App.css'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<GameSession />} />
        <Route path="/parent" element={<ParentReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}