/**
 * Inscribir Participantes Dialog - Multi-selección de scouts
 * Con búsqueda, filtros por rama y estado de inscripción
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users,
  Search,
  Check,
  X,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ActividadesExteriorService } from '@/services/actividadesExteriorService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Scout {
  id: string;
  codigo: string;
  nombre: string;
  rama: string;
  patrulla?: string;
  inscrito: boolean;
}

interface InscribirParticipantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  participantesActuales: string[]; // IDs de scouts ya inscritos
  onSuccess: () => void;
}

const RAMAS = [
  { value: 'TODOS', label: 'Todas las ramas' },
  { value: 'MANADA', label: '🐺 Manada' },
  { value: 'TROPA', label: '⚜️ Tropa' },
  { value: 'COMUNIDAD', label: '🏔️ Comunidad' },
  { value: 'CLAN', label: '🔥 Clan' },
];

const InscribirParticipantesDialog: React.FC<InscribirParticipantesDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  participantesActuales,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [filtroRama, setFiltroRama] = useState('TODOS');

  useEffect(() => {
    if (open) {
      cargarScouts();
    }
  }, [open]);

  const cargarScouts = async () => {
    try {
      setLoading(true);
      
      // Obtener scouts activos
      const { data, error } = await supabase
        .from('scouts')
        .select(`
          id,
          codigo_scout,
          rama_actual,
          persona:personas(nombres, apellidos)
        `)
        .eq('estado', 'ACTIVO')
        .order('codigo_scout');

      if (error) throw error;

      const scoutsData = (data || []).map(s => {
        // persona puede venir como array o como objeto dependiendo de la relación
        const personaData = Array.isArray(s.persona) ? s.persona[0] : s.persona;
        return {
          id: s.id,
          codigo: s.codigo_scout || '',
          nombre: personaData ? `${personaData.nombres} ${personaData.apellidos}` : 'Sin nombre',
          rama: s.rama_actual || 'Sin rama',
          inscrito: participantesActuales.includes(s.id),
        };
      });

      setScouts(scoutsData);
    } catch (error) {
      console.error('Error cargando scouts:', error);
      toast.error('Error al cargar scouts');
    } finally {
      setLoading(false);
    }
  };

  const scoutsFiltrados = useMemo(() => {
    return scouts.filter(s => {
      const matchBusqueda = !busqueda || 
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigo.toLowerCase().includes(busqueda.toLowerCase());
      
      const matchRama = filtroRama === 'TODOS' || s.rama === filtroRama;
      
      return matchBusqueda && matchRama && !s.inscrito;
    });
  }, [scouts, busqueda, filtroRama]);

  const toggleScout = (id: string) => {
    setSeleccionados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const seleccionarTodos = () => {
    setSeleccionados(new Set(scoutsFiltrados.map(s => s.id)));
  };

  const deseleccionarTodos = () => {
    setSeleccionados(new Set());
  };

  const handleInscribir = async () => {
    if (seleccionados.size === 0) {
      toast.error('Selecciona al menos un scout');
      return;
    }

    try {
      setGuardando(true);
      
      const result = await ActividadesExteriorService.inscribirParticipantes(
        actividadId,
        Array.from(seleccionados)
      );

      toast.success(`${result.inscritos} scout(s) inscrito(s) exitosamente`);
      setSeleccionados(new Set());
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error inscribiendo participantes:', error);
      toast.error('Error al inscribir participantes');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    setSeleccionados(new Set());
    setBusqueda('');
    setFiltroRama('TODOS');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inscribir Participantes
          </DialogTitle>
          <DialogDescription>
            Selecciona los scouts que participarán en esta actividad
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o código..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Select value={filtroRama} onValueChange={setFiltroRama}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rama" />
            </SelectTrigger>
            <SelectContent>
              {RAMAS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {scoutsFiltrados.length} disponible(s) • {seleccionados.size} seleccionado(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={seleccionarTodos}>
              <Check className="h-4 w-4 mr-1" />
              Todos
            </Button>
            <Button variant="outline" size="sm" onClick={deseleccionarTodos}>
              <X className="h-4 w-4 mr-1" />
              Ninguno
            </Button>
          </div>
        </div>

        {/* Lista de scouts */}
        <ScrollArea className="flex-1 min-h-0 border rounded-lg p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : scoutsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>No hay scouts disponibles para inscribir</p>
              <p className="text-sm">Todos ya están inscritos o no coinciden con los filtros</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scoutsFiltrados.map(scout => (
                <Card 
                  key={scout.id}
                  className={`cursor-pointer transition-colors ${
                    seleccionados.has(scout.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleScout(scout.id)}
                >
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <Checkbox 
                      checked={seleccionados.has(scout.id)}
                      onCheckedChange={() => toggleScout(scout.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{scout.nombre}</span>
                        <Badge variant="outline" className="shrink-0">
                          {scout.rama}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {scout.codigo}
                      </p>
                    </div>
                    {seleccionados.has(scout.id) && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Resumen de selección */}
        {seleccionados.size > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{seleccionados.size} scout(s) seleccionado(s)</span>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleInscribir} 
            disabled={guardando || seleccionados.size === 0}
          >
            {guardando ? 'Inscribiendo...' : `Inscribir ${seleccionados.size > 0 ? `(${seleccionados.size})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InscribirParticipantesDialog;
