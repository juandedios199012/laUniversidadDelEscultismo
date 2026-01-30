/**
 * Scout Registration Page Component (Refactored)
 * 
 * Main page that integrates:
 * - KPI Dashboard
 * - Scout List with search
 * - Scout Form (create/edit)
 * - Medical History Modal
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

import ScoutService from "@/services/scoutService";
import HistoriaMedicaService from "@/services/historiaMedicaService";
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
      if (result) {
        setStats({
          total: result.total_scouts || 0,
          activos: result.scouts_activos || 0,
          nuevos: result.nuevos_anio || 0,
          dirigentes: result.dirigentes || 0,
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

  // Handle scout selection
  const handleSelectScout = useCallback((scout: Scout) => {
    setSelectedScout(scout);
    setViewMode("view");
  }, []);

  // Handle edit
  const handleEditScout = useCallback((scout: Scout) => {
    setSelectedScout(scout);
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

  // Handle medical history
  const handleOpenMedicalHistory = useCallback(async (scout: Scout) => {
    setMedicalHistoryScout(scout);
    
    // Load existing medical history if available
    try {
      const histData = await HistoriaMedicaService.obtenerHistoriaMedica(scout.persona_id || scout.id);
      if (histData) {
        // Transform the nested data structure to flat form data
        setMedicalHistoryData({
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
          condiciones: histData.condiciones || [],
          alergias: histData.alergias || [],
          medicamentos: histData.medicamentos || [],
          vacunas: histData.vacunas || [],
        } as HistoriaMedicaData);
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
          severidad: a.severidad as any,
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
            Registro de Scouts
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el registro de scouts del grupo
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
          <Button onClick={handleNewScout}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Scout
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPIGrid stats={stats} loading={loading} />

      {/* Main Content */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <ScoutList
            scouts={scouts}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={handleEditScout}
            onNewScout={handleNewScout}
            onMedicalHistory={handleOpenMedicalHistory}
            selectedId={selectedScout?.id}
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
            selectedId={selectedScout?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Medical History Modal */}
      {medicalHistoryScout && (
        <HistoriaMedicaWizard
          scoutId={medicalHistoryScout.persona_id || medicalHistoryScout.id}
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
