/**
 * Scout Search and List Component
 */

import { useState, useMemo } from "react";
import { Search, Edit, Eye, Plus, Users, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import type { Scout } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ScoutListProps {
  scouts: Scout[];
  loading: boolean;
  onSelect: (scout: Scout) => void;
  onEdit: (scout: Scout) => void;
  onNewScout: () => void;
  onMedicalHistory?: (scout: Scout) => void;
  selectedId?: string;
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
  selectedId,
}: ScoutListProps) {
  const [searchTerm, setSearchTerm] = useState("");

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
          <Button size="sm" onClick={onNewScout}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
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
              !searchTerm
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
                    {onMedicalHistory && (
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
