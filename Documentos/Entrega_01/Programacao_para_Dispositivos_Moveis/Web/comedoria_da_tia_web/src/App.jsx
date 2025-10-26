// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useNotifier } from './components/Notifier/useNotifier'

// pages
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import ProductNew from './pages/Products/ProductNew'
import ProductsList from './pages/Products/ProductsList'
import Promotion from './pages/Products/Promotion'
import Relatorios from './pages/Relatorios/Relatorios'

// layout + guards
import AppLayout from './layouts/layouts'
import RequireAuth from './Routes/RequireAuth'
import RequireAdmin from './Routes/RequireAdmin' // ← Novo import
import Home from './pages/Alunos/Home'
import OffersAlunos from './pages/Alunos/OffersAlunos'

function App() {
  const { NotifierHost } = useNotifier()

  return (
    <Router>
      <NotifierHost />
      <Routes>
        {/* públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/inscreva-se" element={<Signup />} />
        <Route path="/esqueceu-a-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-a-senha" element={<ResetPassword />} />

        {/* autenticadas (qualquer usuário logado) */}
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="alunos/home" replace />} />
            
            {/* Rotas para alunos (todos os usuários logados) */}
            <Route path="alunos/home" element={<Home/>}/>
            <Route path="alunos/ofertas" element={<OffersAlunos/>} />

            {/* Rotas administrativas (apenas admin) */}
            <Route element={<RequireAdmin />}>
              <Route path="produtos" element={<ProductsList />} />
              <Route path="produtos/novo" element={<ProductNew />} />
              <Route path="produtos/promocao" element={<Promotion />} />
              <Route path="/app/relatorios" element={<Relatorios/>} />
            </Route>
          </Route>
        </Route>

        {/* raiz */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Página não encontrada</div>} />
      </Routes>
    </Router>
  )
}

export default App