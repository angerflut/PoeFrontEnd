import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getMapaReponedorVista, getTareasReponedor, generarRutaOptimizada } from "@/services/api";
import MapaInteractivo from "@/components/MapaInteractivo.tsx";

const ALGORITMOS = [
  { value: "vecino_mas_cercano", label: "Vecino más cercano" },
  { value: "fuerza_bruta", label: "Fuerza bruta" },
  { value: "genetico", label: "Genético" },
];

const COLORS = ["#1e90ff", "#e67e22", "#27ae60", "#8e44ad", "#e74c3c", "#f1c40f"];

const combinarColores = (colores: string[]) => {
  if (colores.length === 1) return colores[0];
  return `linear-gradient(135deg, ${colores.join(", ")})`;
};

const ReponedorRutaTarea = () => {
  const { toast } = useToast();
  const [mapa, setMapa] = useState<any>(null);
  const [tareas, setTareas] = useState<any[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<any>(null);
  const [algoritmo, setAlgoritmo] = useState<string>("vecino_mas_cercano");
  const [ruta, setRuta] = useState<any[]>([]);
  const [segmentosColores, setSegmentosColores] = useState<{[key: string]: string[]}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mapaData = await getMapaReponedorVista();
        const tareasData = await getTareasReponedor();
        console.log("Mapa recibido:", mapaData);
        console.log("Tareas recibidas:", tareasData);
        setMapa(mapaData.mapa);
        setTareas(tareasData);
      } catch (e) {
        console.error("Error cargando datos:", e);
        toast({ title: "Error", description: "No se pudo cargar el mapa o las tareas.", variant: "destructive" });
      }
    };
    fetchData();
  }, []);

  const handleGenerarRuta = async (tarea: any) => {
    try {
      const response = await generarRutaOptimizada(tarea.id_tarea, algoritmo);
      // Usar coordenadas_ruta en vez de ruta
      if (!response.coordenadas_ruta || !Array.isArray(response.coordenadas_ruta)) {
        throw new Error(response.detail || "La respuesta no contiene una ruta válida.");
      }
      setRuta(response.coordenadas_ruta);
      // Colorear las celdas de la ruta
      const coloresPorCelda: { [key: string]: string[] } = {};
      response.coordenadas_ruta.forEach((p: any, idx: number) => {
        const key = `${p.x},${p.y}`;
        if (!coloresPorCelda[key]) coloresPorCelda[key] = [];
        coloresPorCelda[key].push(COLORS[idx % COLORS.length]);
      });
      setSegmentosColores(coloresPorCelda);
      toast({ title: "Ruta generada", description: "La ruta optimizada se ha generado y mostrado en el mapa." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo generar la ruta.", variant: "destructive" });
    }
  };

  // Extraer muebles (solo celdas con mueble)
  const muebles = mapa?.ubicaciones ? mapa.ubicaciones.filter((u: any) => u.mueble).map((u: any) => ({ x: u.x, y: u.y })) : [];
  // Extraer destinos de la última ruta generada
  const destinos = tareaSeleccionada && tareaSeleccionada.puntos_reposicion
    ? tareaSeleccionada.puntos_reposicion.map((p: any) => ({ x: p.mueble.coordenadas.x, y: p.mueble.coordenadas.y }))
    : [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mapa */}
      <div className="flex-1 p-4">
        <MapaInteractivo
          mapa={mapa}
          puntosColoreados={segmentosColores}
          muebles={muebles}
          destinos={destinos}
        />
      </div>
      {/* Panel lateral */}
      <div className="w-[400px] border-l bg-card p-4 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tareas Asignadas</CardTitle>
          </CardHeader>
          <CardContent>
            {tareas.length === 0 ? (
              <div className="text-muted-foreground">No tienes tareas asignadas.</div>
            ) : (
              <div className="space-y-2">
                {tareas.map((tarea) => (
                  <div
                    key={tarea.id_tarea}
                    className={`p-2 rounded cursor-pointer ${tareaSeleccionada?.id_tarea === tarea.id_tarea ? "bg-primary/10" : ""}`}
                    onClick={() => setTareaSeleccionada(tarea)}
                  >
                    <div className="font-medium">{tarea.productos?.[0]?.nombre || "Producto"}</div>
                    <div className="text-xs text-muted-foreground">
                      {tarea.productos?.[0]?.ubicacion?.estanteria
                        ? `Estantería ${tarea.productos[0].ubicacion.estanteria}, Nivel ${tarea.productos[0].ubicacion.nivel}`
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Detalles y generación de ruta */}
        {tareaSeleccionada && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Tarea</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <div className="font-medium">{tareaSeleccionada.productos?.[0]?.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {tareaSeleccionada.productos?.[0]?.ubicacion
                    ? `Estantería ${tareaSeleccionada.productos[0].ubicacion.estanteria}, Nivel ${tareaSeleccionada.productos[0].ubicacion.nivel}`
                    : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cantidad: {tareaSeleccionada.productos?.[0]?.cantidad}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={algoritmo} onValueChange={setAlgoritmo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar algoritmo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALGORITMOS.map((alg) => (
                      <SelectItem key={alg.value} value={alg.value}>
                        {alg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleGenerarRuta(tareaSeleccionada)}
                  className="ml-2"
                >
                  Generar Ruta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReponedorRutaTarea;
