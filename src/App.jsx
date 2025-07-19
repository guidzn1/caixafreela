import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/login/LoginPage';
import { RegisterPage } from './pages/Register/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ProfilePage } from './pages/Profile/ProfilePage'; // 1. IMPORTE A NOVA PÁGINA
import { CofrinhosPage } from './pages/Cofrinhos/CofrinhosPage';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-center" toastOptions={{ /* ... */ }} />
      <Routes>
        <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/cadastro" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        {/* 2. ADICIONE A NOVA ROTA PROTEGIDAA */}
        <Route path="/perfil" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
         <Route path="/cofrinhos" element={user ? <CofrinhosPage /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;