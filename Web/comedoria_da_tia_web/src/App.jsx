import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Telas
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';

// Exemplo de rota protegida (ajuste sua lógica de auth aqui)
function ProtectedRoute({ children }) {
  const isAuthenticated = false; // TODO: troque pela sua store/ctx (ex.: Zustand/Context/Supabase)
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <a href="/login">Ir para Login</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Carregando...</div>}>
        <Routes>
          {/* Redireciona raiz para Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Exemplo de rota interna protegida (substitua /app pelo seu dashboard) */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <div style={{ padding: 24 }}>
                  <h2>Área Logada</h2>
                  <p>Coloque suas rotas internas aqui (ex.: produtos, estoque...).</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
