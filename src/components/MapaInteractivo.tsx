import React from "react";

// Props: mapa (estructura del mapa), puntosColoreados: { [key: string]: string[] }, muebles: array de ubicaciones, destinos: array de puntos destino
const MapaInteractivo = ({
  mapa,
  puntosColoreados,
  muebles = [],
  destinos = [],
}: {
  mapa: any;
  puntosColoreados: { [key: string]: string[] };
  muebles?: any[];
  destinos?: { x: number; y: number }[];
}) => {
  if (!mapa) return <div>Cargando mapa...</div>;

  const filas = mapa.alto;
  const columnas = mapa.ancho;

  // Crear un set de coordenadas de muebles para acceso rápido
  const mueblesSet = new Set(muebles.map((u: any) => `${u.x},${u.y}`));
  // Crear un set de coordenadas de destinos
  const destinosSet = new Set(destinos.map((d: any) => `${d.x},${d.y}`));

  return (
    <div className="relative" style={{ width: columnas * 32, height: filas * 32 }}>
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${filas}, 32px)`,
          gridTemplateColumns: `repeat(${columnas}, 32px)`,
          gap: 2,
        }}
      >
        {Array.from({ length: filas * columnas }).map((_, idx) => {
          const y = Math.floor(idx / columnas);
          const x = idx % columnas;
          const key = `${x},${y}`;
          const colores = puntosColoreados[key] || [];
          let style: React.CSSProperties = colores.length
            ? { background: colores.length === 1 ? colores[0] : `linear-gradient(135deg, ${colores.join(", ")})` }
            : { background: "#f3f3f3" };

          // Si es mueble, fondo negro total
          if (mueblesSet.has(key)) {
            style = { ...style, background: "#000" };
          }
          // Si es destino, borde rojo grueso
          if (destinosSet.has(key)) {
            style = { ...style, border: "2px solid #e74c3c" };
          } else {
            style = { ...style, border: "1px solid #ccc" };
          }

          return (
            <div
              key={key}
              style={{
                ...style,
                width: 32,
                height: 32,
                borderRadius: 4,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: destinosSet.has(key) ? 22 : undefined,
                color: destinosSet.has(key) ? "#fff" : undefined,
              }}
              title={`(${x}, ${y})`}
            >
              {destinosSet.has(key) ? "X" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapaInteractivo;
