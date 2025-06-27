import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from './components/ProtectedRoute';
import { ReponedoresProvider } from './contexts/ReponedoresContext';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Products from './pages/Products';
import MapPage from './pages/MapPage';
import Reportes from './pages/Reportes';
import NotFound from './pages/NotFound';

// Supervisor Pages
import SupervisorDashboard from './pages/SupervisorDashboard';
import SupervisorProfile from './pages/SupervisorProfile';
import ReponedoresPage from './pages/ReponedoresPage';
import TareasPage from './pages/TareasPage';
import RutasPage from './pages/RutasPage';
import SupervisorMapPage from './pages/SupervisorMapPage';

// Reponedor Pages
import ReponedorDashboard from './pages/ReponedorDashboard';
import ReponedorProfile from './pages/ReponedorProfile';
import ReponedorTareas from './pages/ReponedorTareas';
import ReponedorMapPage from './pages/ReponedorMapPage';
import ReponedorAlertas from './pages/ReponedorAlertas';
import ReponedorSemanal from './pages/ReponedorSemanal';
import AdminTareasPage from './pages/AdminTareasPage';
import ReponedorRutaTarea from './pages/ReponedorRutaTarea';

import './App.css';

function App() {
  return (
    <ReponedoresProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rutas de Administrador */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MapPage />
              </ProtectedRoute>
            } />
            <Route path="/reportes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reportes />
              </ProtectedRoute>
            } />
            <Route path="/admin-tareas" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTareasPage />
              </ProtectedRoute>
            } />
            
            {/* Rutas de Supervisor */}
            <Route path="/supervisor-dashboard" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/supervisor-profile" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorProfile />
              </ProtectedRoute>
            } />
            <Route path="/reponedores" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <ReponedoresPage />
              </ProtectedRoute>
            } />
            <Route path="/tareas" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <TareasPage />
              </ProtectedRoute>
            } />
            <Route path="/rutas" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <RutasPage />
              </ProtectedRoute>
            } />
            <Route path="/supervisor-map" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorMapPage />
              </ProtectedRoute>
            } />
            
            {/* Rutas de Reponedor */}
            <Route path="/reponedor-dashboard" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-profile" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorProfile />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-tareas" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorTareas />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-map" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorMapPage />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-alertas" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorAlertas />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-semanal" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorSemanal />
              </ProtectedRoute>
            } />
            <Route path="/reponedor-ruta-tarea" element={
              <ProtectedRoute allowedRoles={['reponedor']}>
                <ReponedorRutaTarea />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </ReponedoresProvider>
  );
}

export default App;
