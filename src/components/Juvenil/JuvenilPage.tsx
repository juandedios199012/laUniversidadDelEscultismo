/**
 * Módulo Juvenil — roster de scouts activos.
 *
 * Distinto de "Participantes" (el CRUD administrativo completo, con
 * todos los estados): esta pantalla es una vista curada de quiénes
 * están activos hoy, más una pestaña "En Proceso" con los scouts cuya
 * membresía anual (31 marzo - 31 marzo, ver database/129_membresia_anual.sql)
 * del período vigente todavía no está al día.
 */
import { useState, useEffect, useCallback } from "react";
import { Sparkles, Clock3, RefreshCw, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/contexts/PermissionsContext";

import { ScoutList } from "../RegistroScout/components/ScoutList";
import { ScoutFormWizard } from "../RegistroScout/v2/ScoutFormWizard";
import { ScoutDetailModal } from "../RegistroScout/components/ScoutDetailModal";

import ScoutService from "@/services/scoutService";
import MembresiaService, { ScoutPendienteMembresia } from "@/services/membresiaService";
import type { Scout } from "@/lib/supabase";

type ViewMode = "list" | "create" | "edit";

export default function JuvenilPage() {
  const { puedeEditar } = usePermissions();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendientes, setPendientes] = useState<ScoutPendienteMembresia[]>([]);
  const [periodYear, setPeriodYear] = useState<number | null>(null);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [exonerandoId, setExonerandoId] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailScout, setDetailScout] = useState<Scout | null>(null);

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

  const loadPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    const { periodYear: periodo, data, error: err } = await MembresiaService.listarPendientesJuvenil();
    if (err) {
      console.error("Error cargando pendientes de membresía:", err);
    } else {
      setPendientes(data);
      setPeriodYear(periodo);
    }
    setLoadingPendientes(false);
  }, []);

  useEffect(() => {
    loadScouts();
    loadPendientes();
  }, [loadScouts, loadPendientes]);

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
    await Promise.all([loadScouts(), loadPendientes()]);
    setRefreshing(false);
    success("Datos actualizados");
  }, [loadScouts, loadPendientes, success]);

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
    loadPendientes();
  }, [loadScouts, loadPendientes]);

  const handleFormCancel = useCallback(() => {
    setViewMode("list");
    setSelectedScout(null);
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
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

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

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
