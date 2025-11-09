import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { MapPin, Activity, Users, Route, Plus, Trash2, Save, X } from 'lucide-react';
import LocationPicker from './LocationPicker';

interface UbicacionActividad {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'Reunión' | 'Actividad' | 'Excursión' | 'Campamento';
  lat: number;
  lng: number;
  direccion?: string;
  fecha?: string;
  responsable?: string;
}

interface PuntoReunion {
  id: string;
  nombre: string;
  grupo: string;
  rama: string;
  lat: number;
  lng: number;
  direccion?: string;
  horarios: string;
  contacto?: string;
}

interface RutaExcursion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'Excursión' | 'Campamento' | 'Caminata';
  puntos: Array<{
    lat: number;
    lng: number;
    nombre: string;
    orden: number;
  }>;
  distancia?: string;
  duracion?: string;
  dificultad?: 'Fácil' | 'Moderada' | 'Difícil';
}

const Maps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'actividades' | 'reuniones' | 'rutas'>('actividades');
  const [showForm, setShowForm] = useState(false);
  
  // Estados para cada funcionalidad
  const [actividades, setActividades] = useState<UbicacionActividad[]>([]);
  const [puntosReunion, setPuntosReunion] = useState<PuntoReunion[]>([]);
  const [rutas, setRutas] = useState<RutaExcursion[]>([]);
  
  // Estados para formularios
  const [nuevaActividad, setNuevaActividad] = useState<Partial<UbicacionActividad>>({
    tipo: 'Actividad'
  });
  const [nuevoPunto, setNuevoPunto] = useState<Partial<PuntoReunion>>({});
  const [nuevaRuta, setNuevaRuta] = useState<Partial<RutaExcursion>>({
    tipo: 'Excursión',
    puntos: [],
    dificultad: 'Fácil'
  });

  // Cargar datos del localStorage
  useEffect(() => {
    const actividadesGuardadas = localStorage.getItem('scoutActividades');
    const puntosGuardados = localStorage.getItem('scoutPuntosReunion');
    const rutasGuardadas = localStorage.getItem('scoutRutas');
    
    if (actividadesGuardadas) setActividades(JSON.parse(actividadesGuardadas));
    if (puntosGuardados) setPuntosReunion(JSON.parse(puntosGuardados));
    if (rutasGuardadas) setRutas(JSON.parse(rutasGuardadas));
  }, []);

  // Guardar en localStorage
  const guardarActividades = (nuevasActividades: UbicacionActividad[]) => {
    setActividades(nuevasActividades);
    localStorage.setItem('scoutActividades', JSON.stringify(nuevasActividades));
  };

  const guardarPuntosReunion = (nuevosPuntos: PuntoReunion[]) => {
    setPuntosReunion(nuevosPuntos);
    localStorage.setItem('scoutPuntosReunion', JSON.stringify(nuevosPuntos));
  };

  const guardarRutas = (nuevasRutas: RutaExcursion[]) => {
    setRutas(nuevasRutas);
    localStorage.setItem('scoutRutas', JSON.stringify(nuevasRutas));
  };

  // Funciones para manejar actividades
  const agregarActividad = () => {
    if (nuevaActividad.nombre && nuevaActividad.lat && nuevaActividad.lng) {
      const actividad: UbicacionActividad = {
        id: Date.now().toString(),
        nombre: nuevaActividad.nombre || '',
        descripcion: nuevaActividad.descripcion || '',
        tipo: nuevaActividad.tipo || 'Actividad',
        lat: nuevaActividad.lat,
        lng: nuevaActividad.lng,
        direccion: nuevaActividad.direccion,
        fecha: nuevaActividad.fecha,
        responsable: nuevaActividad.responsable
      };
      
      guardarActividades([...actividades, actividad]);
      setNuevaActividad({ tipo: 'Actividad' });
      setShowForm(false);
    }
  };

  // Funciones para manejar puntos de reunión
  const agregarPuntoReunion = () => {
    if (nuevoPunto.nombre && nuevoPunto.lat && nuevoPunto.lng) {
      const punto: PuntoReunion = {
        id: Date.now().toString(),
        nombre: nuevoPunto.nombre || '',
        grupo: nuevoPunto.grupo || '',
        rama: nuevoPunto.rama || '',
        lat: nuevoPunto.lat,
        lng: nuevoPunto.lng,
        direccion: nuevoPunto.direccion,
        horarios: nuevoPunto.horarios || '',
        contacto: nuevoPunto.contacto
      };
      
      guardarPuntosReunion([...puntosReunion, punto]);
      setNuevoPunto({});
      setShowForm(false);
    }
  };

  // Funciones para manejar rutas
  const agregarPuntoARuta = (lat: number, lng: number, direccion?: string) => {
    const nuevoPuntoRuta = {
      lat,
      lng,
      nombre: direccion || `Punto ${(nuevaRuta.puntos?.length || 0) + 1}`,
      orden: (nuevaRuta.puntos?.length || 0) + 1
    };
    
    setNuevaRuta({
      ...nuevaRuta,
      puntos: [...(nuevaRuta.puntos || []), nuevoPuntoRuta]
    });
  };

  const agregarRuta = () => {
    if (nuevaRuta.nombre && nuevaRuta.puntos && nuevaRuta.puntos.length >= 2) {
      const ruta: RutaExcursion = {
        id: Date.now().toString(),
        nombre: nuevaRuta.nombre || '',
        descripcion: nuevaRuta.descripcion || '',
        tipo: nuevaRuta.tipo || 'Excursión',
        puntos: nuevaRuta.puntos,
        distancia: nuevaRuta.distancia,
        duracion: nuevaRuta.duracion,
        dificultad: nuevaRuta.dificultad || 'Fácil'
      };
      
      guardarRutas([...rutas, ruta]);
      setNuevaRuta({ tipo: 'Excursión', puntos: [], dificultad: 'Fácil' });
      setShowForm(false);
    }
  };

  // Función para eliminar elementos
  const eliminarElemento = (id: string, tipo: 'actividad' | 'punto' | 'ruta') => {
    switch (tipo) {
      case 'actividad':
        guardarActividades(actividades.filter(a => a.id !== id));
        break;
      case 'punto':
        guardarPuntosReunion(puntosReunion.filter(p => p.id !== id));
        break;
      case 'ruta':
        guardarRutas(rutas.filter(r => r.id !== id));
        break;
    }
  };

  const renderFormularioActividad = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Nueva Ubicación de Actividad</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
          <input
            type="text"
            value={nuevaActividad.nombre || ''}
            onChange={(e) => setNuevaActividad({ ...nuevaActividad, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Reunión de Manada"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            value={nuevaActividad.tipo}
            onChange={(e) => setNuevaActividad({ ...nuevaActividad, tipo: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Reunión">Reunión</option>
            <option value="Actividad">Actividad</option>
            <option value="Excursión">Excursión</option>
            <option value="Campamento">Campamento</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
          <input
            type="date"
            value={nuevaActividad.fecha || ''}
            onChange={(e) => setNuevaActividad({ ...nuevaActividad, fecha: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
          <input
            type="text"
            value={nuevaActividad.responsable || ''}
            onChange={(e) => setNuevaActividad({ ...nuevaActividad, responsable: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dirigente responsable"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
        <textarea
          value={nuevaActividad.descripcion || ''}
          onChange={(e) => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Descripción de la actividad"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar ubicación *</label>
        <LocationPicker
          onLocationSelect={(lat, lng, address) => {
            setNuevaActividad({ ...nuevaActividad, lat, lng, direccion: address });
          }}
          height="250px"
        />
        {nuevaActividad.direccion && (
          <p className="mt-2 text-sm text-gray-600">📍 {nuevaActividad.direccion}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={agregarActividad}
          disabled={!nuevaActividad.nombre || !nuevaActividad.lat}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar</span>
        </button>
      </div>
    </div>
  );

  const renderFormularioPuntoReunion = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Nuevo Punto de Reunión</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Local *</label>
          <input
            type="text"
            value={nuevoPunto.nombre || ''}
            onChange={(e) => setNuevoPunto({ ...nuevoPunto, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Local Scout San Martín"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupo Scout</label>
          <input
            type="text"
            value={nuevoPunto.grupo || ''}
            onChange={(e) => setNuevoPunto({ ...nuevoPunto, grupo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Grupo Scout Lima 12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rama</label>
          <select
            value={nuevoPunto.rama || ''}
            onChange={(e) => setNuevoPunto({ ...nuevoPunto, rama: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar rama</option>
            <option value="Manada">Manada (6-10 años)</option>
            <option value="Tropa">Tropa (11-14 años)</option>
            <option value="Comunidad">Comunidad (15-17 años)</option>
            <option value="Clan">Clan (18-21 años)</option>
            <option value="General">Todas las ramas</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Horarios</label>
          <input
            type="text"
            value={nuevoPunto.horarios || ''}
            onChange={(e) => setNuevoPunto({ ...nuevoPunto, horarios: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Sábados 3:00-6:00 PM"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Contacto</label>
        <input
          type="text"
          value={nuevoPunto.contacto || ''}
          onChange={(e) => setNuevoPunto({ ...nuevoPunto, contacto: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Teléfono o email de contacto"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar ubicación *</label>
        <LocationPicker
          onLocationSelect={(lat, lng, address) => {
            setNuevoPunto({ ...nuevoPunto, lat, lng, direccion: address });
          }}
          height="250px"
        />
        {nuevoPunto.direccion && (
          <p className="mt-2 text-sm text-gray-600">📍 {nuevoPunto.direccion}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={agregarPuntoReunion}
          disabled={!nuevoPunto.nombre || !nuevoPunto.lat}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar</span>
        </button>
      </div>
    </div>
  );

  const renderFormularioRuta = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Nueva Ruta de Excursión</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Ruta *</label>
          <input
            type="text"
            value={nuevaRuta.nombre || ''}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Excursión a Marcahuasi"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            value={nuevaRuta.tipo}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, tipo: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Excursión">Excursión</option>
            <option value="Campamento">Campamento</option>
            <option value="Caminata">Caminata</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duración estimada</label>
          <input
            type="text"
            value={nuevaRuta.duracion || ''}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, duracion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 2 días, 6 horas"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dificultad</label>
          <select
            value={nuevaRuta.dificultad}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, dificultad: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Fácil">Fácil</option>
            <option value="Moderada">Moderada</option>
            <option value="Difícil">Difícil</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
        <textarea
          value={nuevaRuta.descripcion || ''}
          onChange={(e) => setNuevaRuta({ ...nuevaRuta, descripcion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Descripción de la ruta y puntos de interés"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Marcar puntos de la ruta * (mínimo 2 puntos)
        </label>
        <LocationPicker
          onLocationSelect={agregarPuntoARuta}
          height="300px"
        />
        
        {nuevaRuta.puntos && nuevaRuta.puntos.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Puntos marcados:</h4>
            <div className="space-y-2">
              {nuevaRuta.puntos.map((punto, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">
                    {punto.orden}. {punto.nombre}
                  </span>
                  <button
                    onClick={() => {
                      const nuevosPuntos = nuevaRuta.puntos?.filter((_, i) => i !== index) || [];
                      // Reordenar los números
                      const puntosReordenados = nuevosPuntos.map((p, i) => ({ ...p, orden: i + 1 }));
                      setNuevaRuta({ ...nuevaRuta, puntos: puntosReordenados });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={agregarRuta}
          disabled={!nuevaRuta.nombre || !nuevaRuta.puntos || nuevaRuta.puntos.length < 2}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Ruta</span>
        </button>
      </div>
    </div>
  );

  const renderMapaActividades = () => {
    const center: [number, number] = actividades.length > 0 
      ? [actividades[0].lat, actividades[0].lng] 
      : [-12.0464, -77.0428];

    return (
      <div className="h-96 rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {actividades.map((actividad) => (
            <Marker key={actividad.id} position={[actividad.lat, actividad.lng]}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-blue-800">{actividad.nombre}</h4>
                  <p className="text-sm text-gray-600">{actividad.tipo}</p>
                  {actividad.fecha && <p className="text-sm">📅 {actividad.fecha}</p>}
                  {actividad.responsable && <p className="text-sm">👤 {actividad.responsable}</p>}
                  <p className="text-xs text-gray-500 mt-1">{actividad.direccion}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  const renderMapaPuntosReunion = () => {
    const center: [number, number] = puntosReunion.length > 0 
      ? [puntosReunion[0].lat, puntosReunion[0].lng] 
      : [-12.0464, -77.0428];

    return (
      <div className="h-96 rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {puntosReunion.map((punto) => (
            <Marker key={punto.id} position={[punto.lat, punto.lng]}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-green-800">{punto.nombre}</h4>
                  <p className="text-sm text-blue-600">{punto.grupo}</p>
                  <p className="text-sm text-gray-600">🏛️ {punto.rama}</p>
                  <p className="text-sm">🕐 {punto.horarios}</p>
                  {punto.contacto && <p className="text-sm">📞 {punto.contacto}</p>}
                  <p className="text-xs text-gray-500 mt-1">{punto.direccion}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  const renderMapaRutas = () => {
    const center: [number, number] = rutas.length > 0 && rutas[0].puntos.length > 0
      ? [rutas[0].puntos[0].lat, rutas[0].puntos[0].lng] 
      : [-12.0464, -77.0428];

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

    return (
      <div className="h-96 rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {rutas.map((ruta, rutaIndex) => {
            const color = colors[rutaIndex % colors.length];
            return (
              <div key={ruta.id}>
                {/* Línea de la ruta */}
                <Polyline 
                  positions={ruta.puntos.map(p => [p.lat, p.lng] as [number, number])}
                  color={color}
                  weight={4}
                  opacity={0.8}
                />
                
                {/* Marcadores de los puntos */}
                {ruta.puntos.map((punto, index) => (
                  <Marker key={`${ruta.id}-${index}`} position={[punto.lat, punto.lng]}>
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold" style={{ color }}>{ruta.nombre}</h4>
                        <p className="text-sm text-gray-600">📍 Punto {punto.orden}: {punto.nombre}</p>
                        <p className="text-sm">🚩 {ruta.tipo}</p>
                        {ruta.duracion && <p className="text-sm">⏱️ {ruta.duracion}</p>}
                        <p className="text-sm">📊 Dificultad: {ruta.dificultad}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </div>
            );
          })}
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Gestión de Mapas Scout</h1>
              <p className="text-green-100">Ubicaciones, actividades y rutas del grupo scout</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('actividades')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'actividades' 
                  ? 'bg-white text-blue-600 font-medium' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Actividades</span>
            </button>
            <button
              onClick={() => setActiveTab('reuniones')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'reuniones' 
                  ? 'bg-white text-blue-600 font-medium' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Puntos de Reunión</span>
            </button>
            <button
              onClick={() => setActiveTab('rutas')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'rutas' 
                  ? 'bg-white text-blue-600 font-medium' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Route className="w-4 h-4" />
              <span>Rutas y Excursiones</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Botón agregar */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeTab === 'actividades' && 'Nueva Actividad'}
                {activeTab === 'reuniones' && 'Nuevo Punto de Reunión'}
                {activeTab === 'rutas' && 'Nueva Ruta'}
              </span>
            </button>
          )}

          {/* Formularios */}
          {showForm && activeTab === 'actividades' && renderFormularioActividad()}
          {showForm && activeTab === 'reuniones' && renderFormularioPuntoReunion()}
          {showForm && activeTab === 'rutas' && renderFormularioRuta()}

          {/* Mapas */}
          {activeTab === 'actividades' && renderMapaActividades()}
          {activeTab === 'reuniones' && renderMapaPuntosReunion()}
          {activeTab === 'rutas' && renderMapaRutas()}

          {/* Lista de elementos */}
          {activeTab === 'actividades' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividades Registradas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actividades.map((actividad) => (
                  <div key={actividad.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{actividad.nombre}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => eliminarElemento(actividad.id, 'actividad')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600 mb-1">{actividad.tipo}</p>
                    {actividad.fecha && <p className="text-sm text-gray-600">📅 {actividad.fecha}</p>}
                    {actividad.responsable && <p className="text-sm text-gray-600">👤 {actividad.responsable}</p>}
                    <p className="text-xs text-gray-500 mt-2">{actividad.direccion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reuniones' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Puntos de Reunión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {puntosReunion.map((punto) => (
                  <div key={punto.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{punto.nombre}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => eliminarElemento(punto.id, 'punto')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600 mb-1">{punto.grupo}</p>
                    <p className="text-sm text-green-600">🏛️ {punto.rama}</p>
                    <p className="text-sm text-gray-600">🕐 {punto.horarios}</p>
                    {punto.contacto && <p className="text-sm text-gray-600">📞 {punto.contacto}</p>}
                    <p className="text-xs text-gray-500 mt-2">{punto.direccion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rutas' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rutas y Excursiones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rutas.map((ruta) => (
                  <div key={ruta.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{ruta.nombre}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => eliminarElemento(ruta.id, 'ruta')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600 mb-1">🚩 {ruta.tipo}</p>
                    <p className="text-sm text-gray-600">📍 {ruta.puntos.length} puntos</p>
                    {ruta.duracion && <p className="text-sm text-gray-600">⏱️ {ruta.duracion}</p>}
                    <p className="text-sm text-gray-600">📊 {ruta.dificultad}</p>
                    {ruta.descripcion && (
                      <p className="text-xs text-gray-500 mt-2">{ruta.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maps;