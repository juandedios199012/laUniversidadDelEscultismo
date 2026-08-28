/**
 * Participantes — vista de consulta.
 *
 * A diferencia del módulo Juvenil (donde se registra, edita, da de baja
 * o gestiona la historia médica de un scout), esta pantalla es de solo
 * lectura: lista/busca/filtra a TODOS los scouts (cualquier estado) y
 * permite ver el detalle de cada uno. Toda operación de escritura vive
 * en Juvenil — ver src/components/Juvenil/JuvenilPage.tsx.
 */

import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

import { ScoutList } from "../components/ScoutList";
import { ScoutDetailModal } from "../components/ScoutDetailModal";

import ScoutService from "@/services/scoutService";
import type { Scout } from "@/lib/supabase";

export default function RegistroScoutPage() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailScout, setDetailScout] = useState<Scout | null>(null);

  const { toasts, removeToast, success, error } = useToast();

  const loadScouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ScoutService.getAllScouts();
      setScouts(data);
    } catch (err) {
      console.error("Error loading scouts:", err);
      error("Error al cargar lista de scouts");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadScouts();
  }, [loadScouts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScouts();
    setRefreshing(false);
    success("Datos actualizados");
  }, [loadScouts, success]);

  const handleSelectScout = useCallback((scout: Scout) => {
    setDetailScout(scout);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailScout(null);
  }, []);

  return (
    <div className="container mx-auto p-4 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Participantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista de consulta — para registrar, editar o dar de baja un scout, usá el módulo Juvenil.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

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
            onEdit={() => {}}
            onNewScout={() => {}}
            onRefresh={handleRefresh}
            showTitle={false}
            soloLectura
          />
        </TabsContent>

        <TabsContent value="activos">
          <ScoutList
            scouts={scouts.filter((s) => s.estado === "ACTIVO")}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={() => {}}
            onNewScout={() => {}}
            onRefresh={handleRefresh}
            showTitle={false}
            soloLectura
          />
        </TabsContent>

        <TabsContent value="inactivos">
          <ScoutList
            scouts={scouts.filter((s) => s.estado !== "ACTIVO")}
            loading={loading}
            onSelect={handleSelectScout}
            onEdit={() => {}}
            onNewScout={() => {}}
            onRefresh={handleRefresh}
            showTitle={false}
            soloLectura
          />
        </TabsContent>
      </Tabs>

      {/* Scout Detail Modal (sin onEdit — solo lectura) */}
      <ScoutDetailModal
        scout={detailScout}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
