/**
 * Módulo Juvenil — operación diaria de scouts activos.
 *
 * A diferencia de "Participantes" (vista de solo consulta, cualquier
 * estado), acá viven TODAS las operaciones: registrar, editar, dar de
 * baja/reactivar, historia médica, y la pestaña "En Proceso" con los
 * scouts cuya membresía anual (31 marzo - 31 marzo, ver
 * database/129_membresia_anual.sql) del período vigente todavía no
 * está al día.
 */
import { useState, useEffect, useCallback } from "react";
import { Sparkles, Clock3, RefreshCw, UserCheck, AlertTriangle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/contexts/PermissionsContext";

import { ScoutList } from "../RegistroScout/components/ScoutList";
import { KPIGrid } from "../RegistroScout/components/KPICards";
import { ScoutFormWizard } from "../RegistroScout/v2/ScoutFormWizard";
import { HistoriaMedicaWizard } from "../RegistroScout/v2/HistoriaMedicaWizard";
import { ScoutDetailModal } from "../RegistroScout/components/ScoutDetailModal";

import ScoutService from "@/services/scoutService";
import HistoriaMedicaService from "@/services/historiaMedicaService";
import MembresiaService, { ScoutPendienteMembresia } from "@/services/membresiaService";
import type { Scout } from "@/lib/supabase";
import type { HistoriaMedicaData } from "../RegistroScout/schemas/historiaMedicaSchema";

type ViewMode = "list" | "create" | "edit";

interface ScoutStats {
  total: number;
  activos: number;
  nuevos: number;
  dirigentes: number;
}

export default function JuvenilPage() {
  const { puedeCrear, puedeEditar } = usePermissions();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ScoutStats | null>(null);

  const [pendientes, setPendientes] = useState<ScoutPendienteMembresia[]>([]);
  const [periodYear, setPeriodYear] = useState<number | null>(null);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [errorPendientes, setErrorPendientes] = useState<string | null>(null);
  const [exonerandoId, setExonerandoId] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailScout, setDetailScout] = useState<Scout | null>(null);

  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [medicalHistoryScout, setMedicalHistoryScout] = useState<Scout | null>(null);
  const [medicalHistoryData, setMedicalHistoryData] = useState<HistoriaMedicaData | null>(null);

  const { toasts, removeToast, success, error } = useToast();

  const loadScouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ScoutService.getAllScouts();
      setScouts(data.filter((s) => s.estado === "ACTIVO"));
    } catch (err) {
      console.error("Error cargando scouts activos:", err);
      error("Error al cargar los scouts activos");
    } finally {
      setLoading(false);
    }
  }, [error]);

  const loadStats = useCallback(async () => {
    try {
      const result = await ScoutService.getEstadisticasGrupo();
      if (result) {
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

  const loadPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    const { periodYear: periodo, data, error: err } = await MembresiaService.listarPendientesJuvenil();
    if (err) {
      console.error("Error cargando pendientes de membresía:", err);
      setErrorPendientes(err);
    } else {
      setPendientes(data);
      setPeriodYear(periodo);
      setErrorPendientes(null);
    }
    setLoadingPendientes(false);
  }, []);

  useEffect(() => {
    loadScouts();
    loadStats();
    loadPendientes();
  }, [loadScouts, loadStats, loadPendientes]);

  const handleExonerar = useCallback(async (scoutId: string) => {
    setExonerandoId(scoutId);
    const resultado = await MembresiaService.exonerarScout(scoutId, "Exonerado desde módulo Juvenil");
    setExonerandoId(null);
    if (resultado.success) {
      success("Scout exonerado del pago de este período");
      loadPendientes();
    } else {
      error(resultado.error || "No se pudo exonerar");
    }
  }, [loadPendientes, success, error]);

  const handleVerPendiente = useCallback(async (scoutId: string) => {
    const fullScout = await ScoutService.getScoutById(scoutId);
    if (fullScout) {
      setDetailScout(fullScout);
      setDetailModalOpen(true);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadScouts(), loadStats(), loadPendientes()]);
    setRefreshing(false);
    success("Datos actualizados");
  }, [loadScouts, loadStats, loadPendientes, success]);

  const handleSelectScout = useCallback((scout: Scout) => {
    setDetailScout(scout);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailScout(null);
  }, []);

  const handleEditScout = useCallback(async (scout: Scout) => {
    try {
      const fullScout = await ScoutService.getScoutById(scout.id);
      setSelectedScout(fullScout || scout);
    } catch (err) {
      console.error("Error cargando scout completo:", err);
      setSelectedScout(scout);
    }
    setViewMode("edit");
  }, []);

  const handleNewScout = useCallback(() => {
    setSelectedScout(null);
    setViewMode("create");
  }, []);

  const handleFormSuccess = useCallback(() => {
    setViewMode("list");
    setSelectedScout(null);
    loadScouts();
    loadStats();
    loadPendientes();
  }, [loadScouts, loadStats, loadPendientes]);

  const handleFormCancel = useCallback(() => {
    setViewMode("list");
    setSelectedScout(null);
  }, []);

  const handleDeactivateScout = useCallback(async (scout: Scout) => {
    if (!window.confirm(`¿Desactivar al scout ${scout.nombres} ${scout.apellidos}?\n\nEl scout pasará a estado INACTIVO pero sus datos se conservarán.`)) {
      return;
    }
    try {
      const result = await ScoutService.desactivarScout(scout.id);
      if (result.success) {
        await loadScouts();
        await loadStats();
        success("Scout desactivado exitosamente");
      } else {
        error(`Error al desactivar: ${result.error}`);
      }
    } catch (err) {
      console.error("Error al desactivar scout:", err);
      error("Error al desactivar el scout");
    }
  }, [loadScouts, loadStats, success, error]);

  const handleActivateScout = useCallback(async (scout: Scout) => {
    if (!window.confirm(`¿Reactivar al scout ${scout.nombres} ${scout.apellidos}?\n\nEl scout volverá a estado ACTIVO.`)) {
      return;
    }
    try {
      const result = await ScoutService.activarScout(scout.id);
      if (result.success) {
        await loadScouts();
        await loadStats();
        success("Scout activado exitosamente");
      } else {
        error(`Error al activar: ${result.error}`);
      }
    } catch (err) {
      console.error("Error al activar scout:", err);
      error("Error al activar el scout");
    }
  }, [loadScouts, loadStats, success, error]);

  const handleDeleteScout = useCallback(async (scout: Scout) => {
    if (!window.confirm(`⚠️ ATENCIÓN: Esta acción eliminará PERMANENTEMENTE al scout ${scout.nombres} ${scout.apellidos} y no se podrá recuperar.\n\n¿Estás COMPLETAMENTE SEGURO?`)) {
      return;
    }
    try {
      const result = await ScoutService.deleteScout(scout.id);
      if (result.success) {
        await loadScouts();
        await loadStats();
        success("Scout eliminado permanentemente");
      } else {
        error(`Error al eliminar: ${result.error}`);
      }
    } catch (err) {
      console.error("Error al eliminar scout:", err);
      error("Error al eliminar el scout");
    }
  }, [loadScouts, loadStats, success, error]);

  const handleOpenMedicalHistory = useCallback(async (scout: Scout) => {
    setMedicalHistoryScout(scout);
    setMedicalHistoryData(null);
    try {
      const histData = await HistoriaMedicaService.obtenerHistoriaMedica(scout.persona_id || scout.id);
      if (histData) {
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
          condiciones: (histData.condiciones || []).map((c: any) => ({
            id: c.id,
            condicion_id: '',
            nombre: c.nombre || '',
            tipo: c.tipo,
            fecha_atencion: c.fecha_diagnostico || c.fecha_atencion || '',
            tratamiento: c.tratamiento || '',
            notas: c.notas || '',
            activa: c.activa ?? true,
          })),
          alergias: (histData.alergias || []).map((a: any) => ({
            id: a.id,
            alergia_id: '',
            nombre: a.nombre || '',
            tipo: a.tipo || '',
            reaccion: a.reaccion || '',
            tratamiento_emergencia: a.tratamiento_emergencia || '',
            aplica: true,
            mencionar: a.mencionar || a.reaccion || '',
          })),
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
          vacunas: (histData.vacunas || []).map((v: any) => ({
            id: v.id,
            vacuna_id: '',
            nombre: v.nombre || '',
            fecha_aplicacion: v.fecha_aplicacion || '',
            dosis_numero: v.dosis_numero,
            lote: v.lote || '',
            establecimiento: v.establecimiento || '',
            proxima_dosis: v.proxima_dosis || '',
          })),
        } as HistoriaMedicaData;
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
        condiciones: data.condiciones?.map(c => ({ ...c, tipo: c.tipo as any })) || [],
        alergias: data.alergias?.map(a => ({ ...a, tipo: a.tipo as any })) || [],
        medicamentos: data.medicamentos || [],
        vacunas: data.vacunas || [],
      });
      return { success: true, message: "Historia médica guardada exitosamente" };
    } catch (err) {
      console.error("Error saving medical history:", err);
      return { success: false, message: err instanceof Error ? err.message : "Error al guardar" };
    }
  }, [medicalHistoryScout]);

  const handleCloseMedicalHistory = useCallback(() => {
    setMedicalHistoryOpen(false);
    setMedicalHistoryScout(null);
    setMedicalHistoryData(null);
  }, []);

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

  return (
    <div className="container mx-auto p-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Juvenil
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {puedeCrear("scouts") && (
            <Button onClick={handleNewScout}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Scout
            </Button>
          )}
        </div>
      </div>

      <KPIGrid stats={stats} loading={loading} />

      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="activos">Activos ({scouts.length})</TabsTrigger>
          <TabsTrigger value="en-proceso">En Proceso ({pendientes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activos">
          <ScoutList
            scouts={scouts}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={handleEditScout}
            onNewScout={handleNewScout}
            onMedicalHistory={handleOpenMedicalHistory}
            onDeactivate={handleDeactivateScout}
            onActivate={handleActivateScout}
            onDelete={handleDeleteScout}
            onRefresh={handleRefresh}
            selectedId={selectedScout?.id}
            showTitle={false}
          />
        </TabsContent>

        <TabsContent value="en-proceso">
          {periodYear && (
            <p className="text-sm text-muted-foreground mb-3">
              Período vigente: {periodYear} - {periodYear + 1} (31 marzo - 31 marzo). Un scout sale de esta lista automáticamente al registrar su pago de Inscripción en Finanzas &gt; Cuenta por Persona.
            </p>
          )}

          {loadingPendientes ? (
            <div className="py-16 text-center text-muted-foreground">Cargando...</div>
          ) : errorPendientes ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-red-600 border rounded-lg border-dashed border-red-200 bg-red-50">
              <AlertTriangle className="h-10 w-10" />
              <p className="font-medium">No se pudo cargar la lista</p>
              <p className="text-sm max-w-md">{errorPendientes}</p>
              <p className="text-xs text-red-400 max-w-md">
                Si el error menciona una función que no existe, revisa que se hayan corrido las migraciones
                database/129_membresia_anual.sql y database/130_membresia_todos_los_roles.sql en Supabase.
              </p>
            </div>
          ) : pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground border rounded-lg border-dashed">
              <UserCheck className="h-10 w-10 text-green-500" />
              <p className="font-medium">Todos al día</p>
              <p className="text-sm max-w-md">Ningún scout activo tiene pendiente el pago de la membresía del período vigente.</p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {pendientes.map((p) => (
                <div key={p.scout_id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleVerPendiente(p.scout_id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <Clock3 className={`h-4 w-4 shrink-0 ${p.estado === "EXPIRED" ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.apellidos}, {p.nombres}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.rama_actual} {p.codigo_asociado ? `· ${p.codigo_asociado}` : ""} ·{" "}
                        {p.estado === "EXPIRED" ? `Venció ${p.expiration_date}` : "Nunca pagó este período"}
                      </p>
                    </div>
                  </button>
                  {puedeEditar("finanzas") && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={exonerandoId === p.scout_id}
                      onClick={() => handleExonerar(p.scout_id)}
                    >
                      Exonerar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ScoutDetailModal
        scout={detailScout}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={(scout) => {
          handleCloseDetailModal();
          handleEditScout(scout);
        }}
      />

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
