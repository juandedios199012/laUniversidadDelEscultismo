/**
 * Scout Search and List Component (Unified)
 * Integra funcionalidades de Registro y Gestión de Scouts
 */

import { useState, useMemo } from "react";
import { Search, Edit, Eye, Plus, Users, Heart, FileText, UserMinus, Trash2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { usePermissions } from "@/contexts/PermissionsContext";
import { getScoutData } from "@/modules/reports/services/reportDataService";
import { generateReportMetadata } from "@/modules/reports/services/pdfService";
import DNGI03Template from "@/modules/reports/templates/pdf/DNGI03Template";
import type { Scout } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ScoutListProps {
  scouts: Scout[];
  loading: boolean;
  onSelect: (scout: Scout) => void;
  onEdit: (scout: Scout) => void;
  onNewScout: () => void;
  onMedicalHistory?: (scout: Scout) => void;
  onDeactivate?: (scout: Scout) => void;
  onDelete?: (scout: Scout) => void;
  onRefresh?: () => void;
  selectedId?: string;
  showTitle?: boolean;
}

const ramaBadgeVariant: Record<string, "manada" | "tropa" | "comunidad" | "clan" | "default"> = {
  MANADA: "manada",
  Manada: "manada",
  TROPA: "tropa",
  Tropa: "tropa",
  COMUNIDAD: "comunidad",
  Comunidad: "comunidad",
  Caminantes: "comunidad",
  CLAN: "clan",
  Clan: "clan",
};

export function ScoutList({
  scouts,
  loading,
  onSelect,
  onEdit,
  onNewScout,
  onMedicalHistory,
  onDeactivate,
  onDelete,
  onRefresh,
  selectedId,
  showTitle = true,
}: ScoutListProps) {
  const { puedeCrear, puedeEditar, puedeEliminar, puedeExportar } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Handler para generar PDF
  const handleGenerarPDF = async (scout: Scout, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setGeneratingPdf(scout.id);
      console.log('📄 Generando PDF para scout:', scout.id);
      
      const scoutData = await getScoutData(scout.id);
      if (!scoutData) {
        alert('No se pudieron obtener los datos del scout');
        return;
      }

      const metadata = generateReportMetadata();
      const doc = <DNGI03Template scout={scoutData} metadata={metadata} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DNGI03_${scout.codigo_scout}_${scout.nombres}_${scout.apellidos}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const filteredScouts = useMemo(() => {
    if (!searchTerm.trim()) return scouts;
    const term = searchTerm.toLowerCase();
    return scouts.filter(
      (scout) =>
        scout.nombres?.toLowerCase().includes(term) ||
        scout.apellidos?.toLowerCase().includes(term) ||
        scout.codigo_scout?.toLowerCase().includes(term) ||
        scout.numero_documento?.includes(term)
    );
  }, [scouts, searchTerm]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Scouts ({filteredScouts.length})
          </CardTitle>
          {puedeCrear('scouts') && (
            <Button 
              size="sm" 
              onClick={onNewScout}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          )}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {filteredScouts.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm ? "Sin resultados" : "No hay scouts registrados"}
            description={
              searchTerm
                ? `No se encontraron scouts con "${searchTerm}"`
                : "Comienza registrando al primer scout del grupo"
            }
            action={
              !searchTerm && puedeCrear('scouts')
                ? { label: "Registrar Scout", onClick: onNewScout }
                : undefined
            }
          />
        ) : (
          <ScrollArea className="h-[400px] px-4">
            <div className="space-y-2 pb-4">
              {filteredScouts.map((scout) => (
                <div
                  key={scout.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-accent hover:border-primary/20",
                    selectedId === scout.id && "bg-accent border-primary"
                  )}
                  onClick={() => onSelect(scout)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {scout.apellidos}, {scout.nombres}
                      </p>
                      {scout.estado === "ACTIVO" ? (
                        <Badge variant="activo" className="text-xs">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="inactivo" className="text-xs">
                          {scout.estado}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {scout.codigo_scout}
                      </span>
                      {scout.rama_actual && (
                        <Badge
                          variant={ramaBadgeVariant[scout.rama_actual] || "default"}
                          className="text-xs"
                        >
                          {scout.rama_actual}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(scout);
                      }}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {puedeEditar('scouts') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(scout);
                        }}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onMedicalHistory && puedeEditar('scouts') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMedicalHistory(scout);
                        }}
                        title="Historia Médica"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                    {puedeExportar('scouts') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleGenerarPDF(scout, e)}
                        disabled={generatingPdf === scout.id}
                        title="Generar PDF DNGI-03"
                        className="text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                      >
                        <FileText className={`h-4 w-4 ${generatingPdf === scout.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                    {onDeactivate && puedeEditar('scouts') && scout.estado === "ACTIVO" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeactivate(scout);
                        }}
                        title="Desactivar scout"
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && puedeEliminar('scouts') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(scout);
                        }}
                        title="Eliminar permanentemente"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
