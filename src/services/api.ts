import { API_ENDPOINTS, API_URL } from '../config/api';

// Tipos
export interface LoginCredentials {
    correo: string;
    contraseña: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_info: {
        id: string;
        nombre: string;
        correo: string;
        rol: string;
        estado: string;
    };
}

export interface Usuario {
    id_usuario: number;
    nombre: string;
    correo: string;
    rol: string;
    estado: string;
}

export interface CreateUsuarioData {
    nombre: string;
    correo: string;
    contraseña: string;
    rol: string;
    estado: string;
    supervisor_id?: number; // ID del supervisor que crea el reponedor
}

export interface UpdateUsuarioData {
    nombre?: string;
    correo?: string;
    rol?: string;
    estado?: string;
}

export interface CreateReponedorData {
    nombre: string;
    correo: string;
    contraseña: string;
}

export interface MapaResponse {
    ubicaciones: Ubicacion[];
}

export interface Ubicacion {
    x: number;
    y: number;
    objeto: any;
    mueble: any;
    punto: any;
}

// Interfaces para tareas
export interface Tarea {
    id_tarea: number;
    fecha_creacion: string;
    estado: string;
    color_estado: string;
    reponedor: string | null;
    productos: {
        id_producto: number;
        nombre: string;
        cantidad: number;
        ubicacion: {
            id_punto: number;
            estanteria: string;
            nivel: number;
        };
    }[];
}

export interface CrearTareaData {
    id_reponedor: number;
    estado_id: number;
    puntos: {
        id_punto: number;
        cantidad: number;
    }[];
}

// Interfaces para reponedores
export interface Reponedor {
    id_usuario: number;
    nombre: string;
    correo: string;
    estado: string;
}

// Clase principal para manejar las llamadas a la API
export class ApiService {
    private static token: string | null = null;
    static getMapa: any;

    // Método para establecer el token
    static setToken(token: string): void {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Método para obtener el token
    static getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    // Método para limpiar el token (logout)
    static clearToken(): void {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
    }

    // Headers por defecto para las peticiones autenticadas
    private static getHeaders(includeAuth: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Método genérico para hacer peticiones
    private static async fetchApi<T>(
        endpoint: string,
        options: RequestInit = {},
        requiresAuth: boolean = true
    ): Promise<T> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            if (requiresAuth) {
                const token = this.getToken();
                if (!token) {
                    throw new Error('No hay token de autenticación');
                }
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Asegurarse de que el endpoint comienza con la URL base si no es una URL completa
            const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Si la respuesta está vacía, retornar null
            const text = await response.text();
            if (!text) {
                return null as T;
            }

            // Intentar parsear la respuesta como JSON
            try {
                return JSON.parse(text);
            } catch (e) {
                if (response.ok) {
                    // Si la respuesta fue exitosa pero no es JSON, retornar null
                    return null as T;
                }
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('Error en fetchApi:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error desconocido en la petición');
        }
    }

    // Método de login
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            const response = await this.fetchApi<LoginResponse>(
                API_ENDPOINTS.login,
                {
                    method: 'POST',
                    body: JSON.stringify(credentials),
                },
                false // No requiere autenticación
            );
            
            if (!response.access_token) {
                throw new Error('No se recibió el token de acceso');
            }

            // Guardar el token
            this.setToken(response.access_token);

            // Mapear el rol del backend al formato del frontend
            const rolMapping: { [key: string]: string } = {
                'Administrador': 'admin',
                'Supervisor': 'supervisor',
                'Reponedor': 'reponedor'
            };

            // Guardar información adicional del usuario
            const userRole = rolMapping[response.user_info.rol] || response.user_info.rol.toLowerCase();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', response.user_info.nombre);
            
            console.log('Login exitoso:', {
                token: response.access_token,
                role: userRole,
                name: response.user_info.nombre
            });
            
            return response;
        } catch (error) {
            console.error('Error en login:', error);
            this.clearToken(); // Limpiar token en caso de error
            throw error;
        }
    }

    // Método de logout
    static logout() {
        this.clearToken();
    }

    // Método para crear un usuario
    static async createUsuario(userData: CreateUsuarioData): Promise<Usuario> {
        try {
            // Si es un supervisor creando un reponedor, usar el endpoint específico
            if (localStorage.getItem('userRole') === 'supervisor' && userData.rol === 'Reponedor') {
                return await this.createReponedor({
                    nombre: userData.nombre,
                    correo: userData.correo,
                    contraseña: userData.contraseña
                });
            }

            // Para otros casos, usar el endpoint general
            const response = await this.fetchApi<{ mensaje: string; usuario: Usuario }>(
                API_ENDPOINTS.usuarios,
                {
                    method: 'POST',
                    body: JSON.stringify(userData),
                }
            );
            return response.usuario;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    // Método para obtener usuarios (modificado para supervisores)
    static async getUsuarios(): Promise<Usuario[]> {
        try {
            const userRole = localStorage.getItem('userRole');
            const endpoint = userRole === 'supervisor' 
                ? API_ENDPOINTS.supervisor_reponedores 
                : API_ENDPOINTS.usuarios;

            const response = await this.fetchApi<{ total: number; reponedores?: Usuario[]; usuarios?: Usuario[]; mensaje: string }>(
                endpoint as string
            );

            // Si es supervisor, la respuesta viene en 'reponedores'
            if (userRole === 'supervisor' && response.reponedores) {
                return response.reponedores.map(reponedor => ({
                    ...reponedor,
                    rol: 'Reponedor' // Asegurarnos de que el rol esté presente
                }));
            }
            
            // Si es admin, la respuesta viene en 'usuarios'
            return response.usuarios || [];
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    // Ejemplo de método para obtener productos
    static async getProductos() {
        return await this.fetchApi(API_ENDPOINTS.productos);
    }

    // Ejemplo de método para crear un producto
    static async createProducto(productoData: any) {
        return await this.fetchApi(API_ENDPOINTS.productos, {
            method: 'POST',
            body: JSON.stringify(productoData),
        });
    }

    // Método para actualizar un producto
    static async updateProducto(productoId: number, productoData: any) {
        return await this.fetchApi(`${API_ENDPOINTS.productos}/${productoId}`, {
            method: 'PUT',
            body: JSON.stringify(productoData),
        });
    }

    // Método para eliminar un producto
    static async deleteProducto(productoId: number) {
        return await this.fetchApi(`${API_ENDPOINTS.productos}/${productoId}`, {
            method: 'DELETE',
        });
    }

    // Método para actualizar un usuario
    static async updateUsuario(userId: number, userData: UpdateUsuarioData): Promise<Usuario> {
        try {
            // Asegurarnos de que el rol tenga el formato correcto
            const formattedUserData = {
                ...userData,
                rol: userData.rol === 'Supervisor' ? 'Supervisor' : 'Reponedor'
            };

            const response = await this.fetchApi<{ mensaje: string; usuario: Usuario }>(
                `${API_ENDPOINTS.usuarios}/${userId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(formattedUserData),
                }
            );

            // Asegurarnos de que la respuesta incluya el rol actualizado
            return {
                ...response.usuario,
                rol: response.usuario.rol || formattedUserData.rol // Usar el rol enviado si no viene en la respuesta
            };
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    // Método para eliminar un usuario
    static async deleteUsuario(userId: number): Promise<void> {
        try {
            const response = await this.fetchApi<{ mensaje: string }>(
                `${API_ENDPOINTS.usuarios}/${userId}`,
                {
                    method: 'DELETE'
                }
            );

            if (!response || response.mensaje.includes('error')) {
                throw new Error(response?.mensaje || 'Error al eliminar el usuario');
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al eliminar el usuario');
        }
    }

    // Perfil
    static async getProfile(): Promise<Usuario> {
        const response = await this.fetchApi<Usuario>(
            API_ENDPOINTS.profile,
            {
                method: 'GET'
            }
        );
        return response;
    }

    static async updateProfile(data: { nombre: string; correo: string }): Promise<Usuario> {
        const response = await this.fetchApi<Usuario>(
            API_ENDPOINTS.profile,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );
        return response;
    }

    // Perfil del Supervisor
    static async getSupervisorProfile(): Promise<Usuario> {
        const response = await this.fetchApi<Usuario>(
            `${API_ENDPOINTS.usuarios}/me`,
            {
                method: 'GET'
            }
        );
        return response;
    }

    static async updateSupervisorProfile(data: { nombre: string; correo: string }): Promise<Usuario> {
        const response = await this.fetchApi<Usuario>(
            `${API_ENDPOINTS.usuarios}/me`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );
        return response;
    }

    // Método específico para que supervisores creen reponedores
    static async createReponedor(reponedorData: CreateReponedorData): Promise<Usuario> {
        try {
            const response = await this.fetchApi<{ mensaje: string; usuario: Usuario }>(
                API_ENDPOINTS.supervisor_reponedores,
                {
                    method: 'POST',
                    body: JSON.stringify(reponedorData),
                }
            );
            return response.usuario;
        } catch (error) {
            console.error('Error al crear reponedor:', error);
            throw error;
        }
    }

    // Método público para obtener el mapa de reposición
    static async getMapaReposicion(idMapa?: number): Promise<any> {
        try {
            const response = await fetch(`${API_ENDPOINTS.mapa}/reposicion${idMapa ? `/${idMapa}` : ''}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener el mapa');
            }

            const data = await response.json();
            console.log('Respuesta del mapa:', data);

            // Para cada mueble, obtener sus puntos
            if (data.ubicaciones) {
                const ubicacionesConPuntos = await Promise.all(
                    data.ubicaciones.map(async (ubicacion: any) => {
                        if (ubicacion.mueble?.id_mueble) {
                            try {
                                const puntosData = await this.getMuebleConPuntos(ubicacion.mueble.id_mueble);
                                return {
                                    ...ubicacion,
                                    mueble: {
                                        ...ubicacion.mueble,
                                        puntos_reposicion: puntosData.puntos_reposicion || []
                                    }
                                };
                            } catch (error) {
                                console.error('Error al obtener puntos para mueble:', ubicacion.mueble.id_mueble);
                                return ubicacion;
                            }
                        }
                        return ubicacion;
                    })
                );
                data.ubicaciones = ubicacionesConPuntos;
            }

            return data;
        } catch (error) {
            console.error('Error en getMapaReposicion:', error);
            throw error;
        }
    }

    static async getMuebleConPuntos(idMueble: number): Promise<any> {
        const response = await fetch(`${API_ENDPOINTS.productos}/${idMueble}/puntos`, {
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los puntos del mueble');
        }

        return response.json();
    }

    static async asignarProductoAPunto(idProducto: number, idPunto: number, idUsuario: number): Promise<any> {
        return await this.fetchApi(
            `/puntos/${idPunto}/asignar-producto`,
            {
                method: 'PUT',
                body: JSON.stringify({ id_producto: idProducto, id_usuario: idUsuario })
            }
        );
    }

    static async desasignarProductoDePunto(idPunto: number): Promise<void> {
        if (!idPunto) {
            throw new Error('Se requiere un ID de punto válido para desasignar');
        }
        console.log('Desasignando producto del punto con ID:', idPunto);
        await this.fetchApi(`/puntos/${idPunto}/desasignar-producto`, {
            method: 'DELETE',
        });
    }

    // Métodos para tareas
    static async getTareasSupervisor(estado?: string): Promise<Tarea[]> {
        const url = estado 
            ? `${API_ENDPOINTS.tareas}/supervisor?estado=${estado}`
            : `${API_ENDPOINTS.tareas}/supervisor`;
        return await this.fetchApi<Tarea[]>(url);
    }

    static async getTareaById(idTarea: number): Promise<Tarea> {
        return await this.fetchApi<Tarea>(`${API_ENDPOINTS.tareas}/${idTarea}`);
    }

    static async crearTarea(data: CrearTareaData): Promise<any> {
        return await this.fetchApi(`${API_ENDPOINTS.tareas}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async actualizarEstadoTarea(idTarea: number, estado: string): Promise<void> {
        return await this.fetchApi(`${API_ENDPOINTS.tareas}/${idTarea}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado })
        });
    }

    static async actualizarCantidadProductoTareaPorPunto(idTarea: number, idPunto: number, cantidad: number): Promise<void> {
        await this.fetchApi(`/tareas/${idTarea}/detalle/${idPunto}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad }),
        });
    }

    static async asignarReponedor(idTarea: number, idReponedor: string): Promise<void> {
        return await this.fetchApi(`${API_ENDPOINTS.tareas}/${idTarea}/asignar-reponedor`, {
            method: 'PUT',
            body: JSON.stringify({ id_reponedor: parseInt(idReponedor) })
        });
    }

    static async actualizarReponedor(idTarea: number, idReponedor: string): Promise<void> {
        return await this.fetchApi(`${API_ENDPOINTS.tareas}/${idTarea}/reponedor`, {
            method: 'PUT',
            body: JSON.stringify({ id_reponedor: idReponedor })
        });
    }

    // Métodos para reponedores
    static async getReponedoresAsignados(): Promise<Reponedor[]> {
        const response = await this.fetchApi<{ total: number; reponedores: Reponedor[]; mensaje: string }>(
            `${API_ENDPOINTS.supervisor}/reponedores`
        );
        return response.reponedores;
    }

    static async getReponedoresDisponibles(): Promise<Reponedor[]> {
        const response = await this.fetchApi<{ total: number; reponedores: Reponedor[]; mensaje: string }>(
            `${API_ENDPOINTS.supervisor}/reponedores/disponibles`
        );
        return response.reponedores;
    }

    static async asignarReponedorASupervisor(reponedorId: number): Promise<any> {
        return await this.fetchApi(
            `${API_ENDPOINTS.supervisor}/reponedores/${reponedorId}/asignar`,
            { method: 'POST' }
        );
    }

    // Método para obtener las tareas asignadas al reponedor actual
    static async getTareasReponedor(): Promise<Tarea[]> {
        return await this.fetchApi<Tarea[]>(
            '/tareas/reponedor',
            { method: 'GET' }
        );
    }

    // Método para completar una tarea
    static async completarTarea(idTarea: number): Promise<{ mensaje: string; estado: string; fecha_completada: string }> {
        return await this.fetchApi<{ mensaje: string; estado: string; fecha_completada: string }>(
            `/tareas/${idTarea}/completar`,
            { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ confirmado: true })
            }
        );
    }

    // Método para obtener el mapa del reponedor
    static async getMapaReponedorVista(idMapa?: number): Promise<any> {
        try {
            const response = await fetch(`${API_ENDPOINTS.mapa}/reponedor/vista${idMapa ? `?id_mapa=${idMapa}` : ''}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener el mapa del reponedor');
            }

            const data = await response.json();
            console.log('Respuesta del mapa del reponedor:', data);

            return data;
        } catch (error) {
            console.error('Error en getMapaReponedorVista:', error);
            throw error;
        }
    }
}

// Utilidad para obtener la URL base de la API
function getApiUrl(path: string) {
  const base = import.meta.env.VITE_API_URL || '';
  if (base.endsWith('/') && path.startsWith('/')) {
    return base + path.slice(1);
  }
  if (!base.endsWith('/') && !path.startsWith('/')) {
    return base + '/' + path;
  }
  return base + path;
}

export async function getMapaReponedor(token: string, idMapa?: number) {
  const params = idMapa ? `?id_mapa=${idMapa}` : '';
  const response = await fetch(`${API_URL}/mapa/reponedor/vista${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('No se pudo obtener el mapa del reponedor');
  return await response.json();
}

export async function getMapaReponedorVista() {
  const url = getApiUrl('/mapa/reponedor/vista');
  console.log('Llamando a:', url);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    console.error('Respuesta no es JSON:', text);
    throw new Error('Respuesta no es JSON: ' + text);
  }
}

export async function getTareasReponedor() {
  const url = getApiUrl('/tareas/reponedor');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  if (!response.ok) throw new Error("No se pudo obtener las tareas");
  return await response.json();
}

export async function generarRutaOptimizada(idTarea: number, algoritmo: string) {
  const url = getApiUrl(`/tareas/${idTarea}/ruta-optimizada?algoritmo=${algoritmo}`);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  if (!response.ok) throw new Error("No se pudo generar la ruta");
  return await response.json();
}
