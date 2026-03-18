/**
 * Scouts Page Component (Unified)
 * 
 * Main page that integrates all scout management:
 * - KPI Dashboard
 * - Scout List with search
 * - Scout Form (create/edit)
 * - Medical History Modal
 * - Deactivate/Delete actions
 * - PDF Generation
 * 
 * Architecture follows:
 * - Container/Presenter pattern
 * - Proper state management
 * - Responsive design
 */

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

import { ScoutList } from "../components/ScoutList";
import { KPIGrid } from "../components/KPICards";
import { ScoutFormWizard } from "./ScoutFormWizard";
import { HistoriaMedicaWizard } from "./HistoriaMedicaWizard";
import { ScoutDetailModal } from "../components/ScoutDetailModal";

import ScoutService from "@/services/scoutService";
import HistoriaMedicaService from "@/services/historiaMedicaService";
import { usePermissions } from "@/contexts/PermissionsContext";
import type { Scout } from "@/lib/supabase";
import type { HistoriaMedicaData } from "../schemas/historiaMedicaSchema";

// ============================================
// Types
// ============================================

type ViewMode = "list" | "create" | "edit" | "view";

interface ScoutStats {
  total: number;
  activos: number;
  nuevos: number;
  dirigentes: number;
}

// ============================================
// Component
// ============================================

export default function RegistroScoutPage() {
  // Permisos
  const { puedeCrear } = usePermissions();
  
  // State
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ScoutStats | null>(null);
  
  // Medical History Modal State
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [medicalHistoryScout, setMedicalHistoryScout] = useState<Scout | null>(null);
  const [medicalHistoryData, setMedicalHistoryData] = useState<HistoriaMedicaData | null>(null);
  
  // Scout Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailScout, setDetailScout] = useState<Scout | null>(null);
  
  const { toasts, removeToast, success, error } = useToast();

  // Load scouts on mount
  useEffect(() => {
    loadScouts();
    loadStats();
  }, []);

  // Load scouts from API
  const loadScouts = useCallback(async () => {
    try {
      setLoading(true);
      const scouts = await ScoutService.getAllScouts();
      setScouts(scouts);
    } catch (err) {
      console.error("Error loading scouts:", err);
      error("Error al cargar lista de scouts");
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const result = await ScoutService.getEstadisticasGrupo();
      console.log("📊 Dashboard data:", result);
      if (result) {
        // La API devuelve { scouts: { total, activos, nuevos_año, dirigentes } }
        const scoutsData = result.scouts || result;
        setStats({
          total: scoutsData.total || result.total_scouts || 0,
          activos: scoutsData.activos || result.scouts_activos || 0,
          nuevos: scoutsData["nuevos_año"] || scoutsData.nuevos_año || result.nuevos_anio || 0,
          dirigentes: scoutsData.dirigentes || result.dirigentes || 0,
        });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadScouts(), loadStats()]);
    setRefreshing(false);
    success("Datos actualizados");
  }, [loadScouts, loadStats, success]);

  // Handle scout selection - abre modal de detalle
  const handleSelectScout = useCallback((scout: Scout) => {
    setDetailScout(scout);
    setDetailModalOpen(true);
  }, []);

  // Handle close detail modal
  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailScout(null);
  }, []);

  // Handle edit - carga datos completos del scout (incluyendo ubicación)
  const handleEditScout = useCallback(async (scout: Scout) => {
    try {
      // Cargar datos completos del scout para tener ubicación, etc.
      const fullScout = await ScoutService.getScoutById(scout.id);
      if (fullScout) {
        console.log('✅ Scout completo cargado para edición:', fullScout);
        setSelectedScout(fullScout);
      } else {
        // Si falla, usar los datos que tenemos
        setSelectedScout(scout);
      }
    } catch (err) {
      console.error('Error cargando scout completo:', err);
      setSelectedScout(scout);
    }
    setViewMode("edit");
  }, []);

  // Handle new scout
  const handleNewScout = useCallback(() => {
    setSelectedScout(null);
    setViewMode("create");
  }, []);

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    loadScouts();
    loadStats();
    setViewMode("list");
    setSelectedScout(null);
  }, [loadScouts, loadStats]);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setViewMode("list");
    setSelectedScout(null);
  }, []);

  // Handle deactivate scout
  const handleDeactivateScout = useCallback(async (scout: Scout) => {
    if (!window.confirm(`¿Desactivar al scout ${scout.nombres} ${scout.apellidos}?\n\nEl scout pasará a estado INACTIVO pero sus datos se conservarán.`)) {
      return;
    }

    try {
      const result = await ScoutService.desactivarScout(scout.id);
      if (result.success) {
        await loadScouts();
        await loadStats();
        success('Scout desactivado exitosamente');
      } else {
        error(`Error al desactivar: ${result.error}`);
      }
    } catch (err) {
      console.error('Error al desactivar scout:', err);
      error('Error al desactivar el scout');
    }
  }, [loadScouts, loadStats, success, error]);

  // Handle delete scout
  const handleDeleteScout = useCallback(async (scout: Scout) => {
    if (!window.confirm(`⚠️ ATENCIÓN: Esta acción eliminará PERMANENTEMENTE al scout ${scout.nombres} ${scout.apellidos} y no se podrá recuperar.\n\n¿Estás COMPLETAMENTE SEGURO?`)) {
      return;
    }

    try {
      const result = await ScoutService.deleteScout(scout.id);
      if (result.success) {
        await loadScouts();
        await loadStats();
        success('Scout eliminado permanentemente');
      } else {
        error(`Error al eliminar: ${result.error}`);
      }
    } catch (err) {
      console.error('Error al eliminar scout:', err);
      error('Error al eliminar el scout');
    }
  }, [loadScouts, loadStats, success, error]);

  // Handle medical history
  const handleOpenMedicalHistory = useCallback(async (scout: Scout) => {
    setMedicalHistoryScout(scout);
    // Reset data first to force re-render
    setMedicalHistoryData(null);
    
    // Load existing medical history if available
    try {
      const histData = await HistoriaMedicaService.obtenerHistoriaMedica(scout.persona_id || scout.id);
      console.log('Historia médica raw data:', histData);
      console.log('Condiciones raw:', histData?.condiciones);
      
      if (histData) {
        // Transform the nested data structure to flat form data
        // Map DB field names to form field names
        const mappedData = {
          fecha_llenado: histData.cabecera?.fecha_llenado || new Date().toISOString().split("T")[0],
          lugar_nacimiento: histData.cabecera?.lugar_nacimiento || "",
          estatura_cm: histData.cabecera?.estatura_cm || undefined,
          peso_kg: histData.cabecera?.peso_kg || undefined,
          seguro_medico: histData.cabecera?.seguro_medico || "",
          numero_poliza: histData.cabecera?.numero_poliza || "",
          medico_cabecera: histData.cabecera?.medico_cabecera || "",
          telefono_medico: histData.cabecera?.telefono_medico || "",
          hospital_preferencia: histData.cabecera?.hospital_preferencia || "",
          observaciones_generales: histData.cabecera?.observaciones_generales || "",
          // Map condiciones: fecha_diagnostico → fecha_atencion
          // Dejar condicion_id vacío para que el wizard haga matching por nombre con el catálogo
          condiciones: (histData.condiciones || []).map((c: any) => ({
            id: c.id,
            condicion_id: '', // Se llenará con matching por nombre en el wizard
            nombre: c.nombre || '',
            tipo: c.tipo,
            fecha_atencion: c.fecha_diagnostico || c.fecha_atencion || '',
            tratamiento: c.tratamiento || '',
            notas: c.notas || '',
            activa: c.activa ?? true,
          })),
          // Map alergias: dejar alergia_id vacío para matching por nombre
          alergias: (histData.alergias || []).map((a: any) => ({
            id: a.id,
            alergia_id: '', // Se llenará con matching por nombre en el wizard
            nombre: a.nombre || '',
            tipo: a.tipo || '',
            reaccion: a.reaccion || '',
            tratamiento_emergencia: a.tratamiento_emergencia || '',
            aplica: true, // Si existe, aplica
            mencionar: a.mencionar || a.reaccion || '',
          })),
          // Map medicamentos
          medicamentos: (histData.medicamentos || []).map((m: any) => ({
            id: m.id,
            nombre: m.nombre || '',
            dosis: m.dosis || '',
            frecuencia: m.frecuencia || '',
            via_administracion: m.via_administracion || '',
            fecha_inicio: m.fecha_inicio || '',
            fecha_fin: m.fecha_fin || '',
            motivo: m.motivo || '',
            prescrito_por: m.prescrito_por || '',
            activo: m.activo ?? true,
          })),
          // Map vacunas: dejar vacuna_id vacío para matching por nombre
          vacunas: (histData.vacunas || []).map((v: any) => ({
            id: v.id,
            vacuna_id: '', // Se llenará con matching por nombre en el wizard
            nombre: v.nombre || '',
            fecha_aplicacion: v.fecha_aplicacion || '',
            dosis_numero: v.dosis_numero,
            lote: v.lote || '',
            establecimiento: v.establecimiento || '',
            proxima_dosis: v.proxima_dosis || '',
          })),
        } as HistoriaMedicaData;
        
        console.log('Mapped data for form:', mappedData);
        console.log('Mapped condiciones:', mappedData.condiciones);
        setMedicalHistoryData(mappedData);
      } else {
        setMedicalHistoryData(null);
      }
    } catch (err) {
      console.error("Error loading medical history:", err);
      setMedicalHistoryData(null);
    }
    
    setMedicalHistoryOpen(true);
  }, []);

  // Handle save medical history
  const handleSaveMedicalHistory = useCallback(async (data: HistoriaMedicaData): Promise<{ success: boolean; message?: string }> => {
    if (!medicalHistoryScout) {
      return { success: false, message: "No hay scout seleccionado" };
    }
    
    const personaId = medicalHistoryScout.persona_id || medicalHistoryScout.id;
    
    try {
      await HistoriaMedicaService.guardarHistoriaMedica(personaId, {
        cabecera: {
          persona_id: personaId,
          fecha_llenado: data.fecha_llenado,
          lugar_nacimiento: data.lugar_nacimiento,
          estatura_cm: data.estatura_cm || undefined,
          peso_kg: data.peso_kg || undefined,
          seguro_medico: data.seguro_medico,
          numero_poliza: data.numero_poliza,
          medico_cabecera: data.medico_cabecera,
          telefono_medico: data.telefono_medico,
          hospital_preferencia: data.hospital_preferencia,
          observaciones_generales: data.observaciones_generales,
        },
        condiciones: data.condiciones?.map(c => ({
          ...c,
          tipo: c.tipo as any,
        })) || [],
        alergias: data.alergias?.map(a => ({
          ...a,
          tipo: a.tipo as any,
        })) || [],
        medicamentos: data.medicamentos || [],
        vacunas: data.vacunas || [],
      });
      
      return { success: true, message: "Historia médica guardada exitosamente" };
    } catch (err) {
      console.error("Error saving medical history:", err);
      return { success: false, message: err instanceof Error ? err.message : "Error al guardar" };
    }
  }, [medicalHistoryScout]);

  // Handle close medical history
  const handleCloseMedicalHistory = useCallback(() => {
    setMedicalHistoryOpen(false);
    setMedicalHistoryScout(null);
    setMedicalHistoryData(null);
  }, []);

  // Render form view
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="container mx-auto p-4">
        <ScoutFormWizard
          scout={viewMode === "edit" ? selectedScout : null}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Render list view
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Scouts
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión integral de scouts del grupo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {puedeCrear('scouts') && (
            <Button onClick={handleNewScout}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Scout
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <KPIGrid stats={stats} loading={loading} />

      {/* Main Content */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos ({scouts.length})</TabsTrigger>
          <TabsTrigger value="activos">Activos ({scouts.filter(s => s.estado === "ACTIVO").length})</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivos ({scouts.filter(s => s.estado !== "ACTIVO").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <ScoutList
            scouts={scouts}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={handleEditScout}
            onNewScout={handleNewScout}
            onMedicalHistory={handleOpenMedicalHistory}
            onDeactivate={handleDeactivateScout}
            onDelete={handleDeleteScout}
            onRefresh={handleRefresh}
            selectedId={selectedScout?.id}
            showTitle={false}
          />
        </TabsContent>

        <TabsContent value="activos">
          <ScoutList
            scouts={scouts.filter((s) => s.estado === "ACTIVO")}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={handleEditScout}
            onNewScout={handleNewScout}
            onMedicalHistory={handleOpenMedicalHistory}
            onDeactivate={handleDeactivateScout}
            onDelete={handleDeleteScout}
            onRefresh={handleRefresh}
            selectedId={selectedScout?.id}
            showTitle={false}
          />
        </TabsContent>

        <TabsContent value="inactivos">
          <ScoutList
            scouts={scouts.filter((s) => s.estado !== "ACTIVO")}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={handleEditScout}
            onNewScout={handleNewScout}
            onMedicalHistory={handleOpenMedicalHistory}
            onDelete={handleDeleteScout}
            onRefresh={handleRefresh}
            selectedId={selectedScout?.id}
            showTitle={false}
          />
        </TabsContent>
      </Tabs>

      {/* Scout Detail Modal */}
      <ScoutDetailModal
        scout={detailScout}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={(scout) => {
          handleCloseDetailModal();
          handleEditScout(scout);
        }}
      />

      {/* Medical History Modal */}
      {medicalHistoryScout && (
        <HistoriaMedicaWizard
          key={`medical-history-${medicalHistoryScout.id}-${medicalHistoryOpen}`}
          scoutId={medicalHistoryScout.id}
          personaId={medicalHistoryScout.persona_id || medicalHistoryScout.id}
          scoutName={`${medicalHistoryScout.nombres} ${medicalHistoryScout.apellidos}`}
          initialData={medicalHistoryData}
          onSave={handleSaveMedicalHistory}
          onClose={handleCloseMedicalHistory}
          isOpen={medicalHistoryOpen}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
