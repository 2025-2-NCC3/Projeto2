// src/layouts/AppLayout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import './AppLayout.css'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />   {/* <- aqui entra a página (Lista, Cadastrar etc.) */}
      </main>
    </div>
  )
}
