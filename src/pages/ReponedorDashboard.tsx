import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { User, Map, Calendar, CheckCircle, AlertTriangle, LogOut, Route } from 'lucide-react';
import { ApiService, Tarea } from "@/services/api";

const ReponedorDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Reponedor';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Mis Tareas',
      description: 'Ver tareas asignadas y marcar como completadas',
      icon: CheckCircle,
      path: '/reponedor-tareas',
      color: 'bg-green-500'
    },
    {
      title: 'Mapa y Rutas',
      description: 'Ver rutas optimizadas y puntos de reposición',
      icon: Map,
      path: '/reponedor-map',
      color: 'bg-orange-500'
    },
    {
      title: 'Vista Semanal',
      description: 'Resumen de tareas por semana',
      icon: Calendar,
      path: '/reponedor-semanal',
      color: 'bg-purple-500'
    },
    {
      title: 'Alertas',
      description: 'Notificaciones y desvíos de ruta',
      icon: AlertTriangle,
      path: '/reponedor-alertas',
      color: 'bg-red-500'
    },
    {
      title: 'Ruta según tarea',
      description: 'Genera y visualiza rutas optimizadas para tus tareas',
      icon: Route,
      path: '/reponedor-ruta-tarea',
      color: 'bg-cyan-500'
    }
  ];

  // Estado para el resumen
  const [resumen, setResumen] = useState({
    tareasHoy: 0,
    completadas: 0,
    pendientes: 0,
    alertas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTareas = async () => {
      setLoading(true);
      setError(null);
      try {
        const tareasApi: Tarea[] = await ApiService.getTareasReponedor();
        // Resumen
        const hoy = new Date().toISOString().slice(0, 10);
        const tareasHoy = tareasApi.filter(t => t.fecha_creacion && t.fecha_creacion.startsWith(hoy));
        const completadas = tareasApi.filter(t => t.estado && t.estado.toLowerCase() === 'completada').length;
        const pendientes = tareasApi.filter(t => t.estado && t.estado.toLowerCase() !== 'completada').length;
        setResumen({
          tareasHoy: tareasHoy.length,
          completadas,
          pendientes,
          alertas: 0
        });
      } catch (err: any) {
        setError('No se pudieron cargar las tareas');
      } finally {
        setLoading(false);
      }
    };
    fetchTareas();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de Reponedor</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/reponedor-profile')}>
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Hola, {userName}</h2>
          <p className="text-muted-foreground">
            Gestiona tus tareas y rutas de reposición de manera eficiente
          </p>
        </div>
        {loading ? (
          <div className="mb-8">Cargando resumen...</div>
        ) : error ? (
          <div className="mb-8 text-red-600">{error}</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tareas Hoy</p>
                  <p className="text-2xl font-bold">{resumen.tareasHoy}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{resumen.completadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{resumen.pendientes}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-bold text-red-600">{resumen.alertas}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        )}
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Acceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ReponedorDashboard;
