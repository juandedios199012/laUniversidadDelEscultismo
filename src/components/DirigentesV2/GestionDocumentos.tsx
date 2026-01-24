/**
 * Componente de Gestión de Documentos para Dirigentes
 * Permite subir, ver y gestionar documentos como DNI, certificados, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassCard,
  Button,
  Badge,
  Toast,
  EmptyState,
} from '../ui/GlassUI';
import {
  Dirigente,
  DocumentoDirigente,
  TIPOS_DOCUMENTO_ADJUNTO,
  ESTADOS_DOCUMENTO_LABELS,
  EstadoDocumento,
} from '../../types/dirigente';
import DirigenteService from '../../services/dirigenteServiceV2';

// ============================================================================
// ICONOS
// ============================================================================

const Icons = {
  ArrowLeft: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Upload: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  File: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Image: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  FileText: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Trash: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Eye: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Download: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  CheckCircle: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AlertCircle: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ============================================================================
// TIPOS
// ============================================================================

interface GestionDocumentosProps {
  dirigente: Dirigente;
  onBack: () => void;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const GestionDocumentos: React.FC<GestionDocumentosProps> = ({
  dirigente,
  onBack,
}) => {
  // Estados
  const [documentos, setDocumentos] = useState<DocumentoDirigente[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'info', message: '' });
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  useEffect(() => {
    cargarDocumentos();
  }, [dirigente.id]);

  // ==========================================================================
  // FUNCIONES
  // ==========================================================================

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const docs = await DirigenteService.obtenerDocumentos(dirigente.id);
      setDocumentos(docs);
    } catch (error) {
      showToast('error', 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      subirArchivo(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      subirArchivo(file);
    }
  };

  const subirArchivo = async (file: File) => {
    if (!tipoSeleccionado) {
      showToast('warning', 'Selecciona el tipo de documento primero');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      showToast('error', 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP o PDF');
      return;
    }

    setUploading(true);
    try {
      const result = await DirigenteService.subirDocumento(
        dirigente.id,
        file,
        tipoSeleccionado
      );

      if (result.success) {
        showToast('success', 'Documento subido exitosamente');
        cargarDocumentos();
        setTipoSeleccionado('');
      } else {
        showToast('error', result.error || 'Error al subir documento');
      }
    } catch (error) {
      showToast('error', 'Error al subir documento');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const eliminarDocumento = async (documentoId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      const result = await DirigenteService.eliminarDocumento(documentoId);
      if (result.success) {
        showToast('success', 'Documento eliminado');
        cargarDocumentos();
      } else {
        showToast('error', 'Error al eliminar documento');
      }
    } catch (error) {
      showToast('error', 'Error al eliminar documento');
    }
  };

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ show: true, type, message });
    if (type !== 'error') {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const getEstadoIcon = (estado: EstadoDocumento) => {
    switch (estado) {
      case 'VERIFICADO':
        return <span className="text-emerald-500">{Icons.CheckCircle}</span>;
      case 'PENDIENTE':
        return <span className="text-amber-500">{Icons.Clock}</span>;
      case 'VENCIDO':
      case 'RECHAZADO':
        return <span className="text-red-500">{Icons.AlertCircle}</span>;
    }
  };

  const getEstadoBadgeVariant = (estado: EstadoDocumento): 'success' | 'warning' | 'danger' | 'default' => {
    switch (estado) {
      case 'VERIFICADO': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'VENCIDO': return 'danger';
      case 'RECHAZADO': return 'danger';
      default: return 'default';
    }
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return Icons.Image;
    }
    if (url.match(/\.pdf$/i)) {
      return Icons.FileText;
    }
    return Icons.File;
  };

  // Documentos requeridos
  const documentosRequeridos = TIPOS_DOCUMENTO_ADJUNTO.filter(
    tipo => !documentos.some(doc => doc.tipo === tipo.value)
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        <AnimatePresence>
          {toast.show && (
            <div className="fixed top-4 right-4 z-50">
              <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewUrl(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-slate-800 rounded-lg p-2"
                onClick={e => e.stopPropagation()}
              >
                {previewUrl.match(/\.pdf$/i) ? (
                  <iframe src={previewUrl} className="w-full h-[80vh]" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-w-full h-auto" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={onBack} icon={Icons.ArrowLeft}>
              Volver
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Documentos del Dirigente
              </h1>
              <p className="text-slate-500 mt-1">
                {dirigente.persona.nombres} {dirigente.persona.apellidos}
              </p>
            </div>

            {/* Resumen */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Documentos</p>
                <p className="text-2xl font-bold text-cyan-500">
                  {documentos.filter(d => d.estado === 'VERIFICADO').length}/{TIPOS_DOCUMENTO_ADJUNTO.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Zona de subida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard padding="lg">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Subir Nuevo Documento
            </h2>

            {/* Selector de tipo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Tipo de documento
              </label>
              <select
                value={tipoSeleccionado}
                onChange={e => setTipoSeleccionado(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <option value="">Seleccionar tipo...</option>
                {TIPOS_DOCUMENTO_ADJUNTO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                    {documentos.some(d => d.tipo === tipo.value) ? ' (Ya existe)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Zona de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => tipoSeleccionado && fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8
                transition-all duration-200 cursor-pointer
                ${dragOver 
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
                ${!tipoSeleccionado ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex flex-col items-center">
                {uploading ? (
                  <>
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">Subiendo documento...</p>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 mb-4">{Icons.Upload}</span>
                    <p className="text-slate-600 dark:text-slate-300 text-center">
                      {tipoSeleccionado
                        ? 'Arrastra un archivo aquí o haz clic para seleccionar'
                        : 'Primero selecciona el tipo de documento'}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      JPG, PNG, WEBP o PDF - Máximo 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </GlassCard>
        </motion.div>

        {/* Documentos pendientes */}
        {documentosRequeridos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Documentos Pendientes
            </h3>
            <div className="flex flex-wrap gap-2">
              {documentosRequeridos.map(tipo => (
                <Badge key={tipo.value} variant="outline" size="lg">
                  {tipo.label}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lista de documentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Documentos Subidos
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : documentos.length === 0 ? (
            <EmptyState
              icon={Icons.File}
              title="No hay documentos"
              description="Comienza subiendo los documentos requeridos del dirigente"
            />
          ) : (
            <div className="space-y-3">
              {documentos.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard hoverable padding="none">
                    <div className="flex items-center p-4">
                      {/* Icono y preview */}
                      <div className="flex-shrink-0 mr-4">
                        {doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div
                            className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden cursor-pointer"
                            onClick={() => setPreviewUrl(doc.url)}
                          >
                            <img
                              src={doc.url}
                              alt={doc.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                            {getFileIcon(doc.url)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-700 dark:text-slate-200">
                            {TIPOS_DOCUMENTO_ADJUNTO.find(t => t.value === doc.tipo)?.label || doc.tipo}
                          </h4>
                          <Badge variant={getEstadoBadgeVariant(doc.estado)} size="sm">
                            {ESTADOS_DOCUMENTO_LABELS[doc.estado]}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{doc.nombre}</p>
                        {doc.fecha_vencimiento && (
                          <p className="text-xs text-slate-400 mt-1">
                            Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Estado icono */}
                      <div className="hidden md:block mx-4">
                        {getEstadoIcon(doc.estado)}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewUrl(doc.url)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
                          title="Ver"
                        >
                          {Icons.Eye}
                        </button>
                        <a
                          href={doc.url}
                          download
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
                          title="Descargar"
                        >
                          {Icons.Download}
                        </a>
                        <button
                          onClick={() => eliminarDocumento(doc.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          {Icons.Trash}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GestionDocumentos;
