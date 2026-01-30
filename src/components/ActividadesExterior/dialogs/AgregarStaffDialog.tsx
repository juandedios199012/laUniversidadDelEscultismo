/**
 * Dialog para agregar Staff a la actividad
 * UX: Formulario simple con búsqueda de dirigentes
 */

import React, { useState, useEffect } from 'react';
import { User, Search, Check, AlertCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ActividadesExteriorService,
  DirigentDisponible,
  RolStaff,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface AgregarStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadId: string;
  onSuccess: () => void;
}

const AgregarStaffDialog: React.FC<AgregarStaffDialogProps> = ({
  open,
  onOpenChange,
  actividadId,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [dirigentes, setDirigentes] = useState<DirigentDisponible[]>([]);
  const [rolesStaff, setRolesStaff] = useState<RolStaff[]>([]);
  
  // Datos del formulario
  const [personaSeleccionada, setPersonaSeleccionada] = useState<DirigentDisponible | null>(null);
  const [rol, setRol] = useState('');
  const [responsabilidades, setResponsabilidades] = useState('');
  
  // Validación onBlur
  const [touched, setTouched] = useState({ rol: false });
  const [errors, setErrors] = useState({ rol: '' });

  useEffect(() => {
    if (open) {
      cargarDirigentes();
      cargarRolesStaff();
      resetForm();
    }
  }, [open, actividadId]);

  const cargarRolesStaff = async () => {
    try {
      const roles = await ActividadesExteriorService.obtenerRolesStaff();
      setRolesStaff(roles);
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

  const resetForm = () => {
    setStep(1);
    setBusqueda('');
    setPersonaSeleccionada(null);
    setRol('');
    setResponsabilidades('');
    setTouched({ rol: false });
    setErrors({ rol: '' });
  };

  const cargarDirigentes = async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.listarDirigentesDisponibles(actividadId);
      setDirigentes(data);
    } catch (error) {
      console.error('Error cargando dirigentes:', error);
      toast.error('Error al cargar dirigentes disponibles');
    } finally {
      setLoading(false);
    }
  };

  const validateRol = (value: string) => {
    if (!value) {
      setErrors(prev => ({ ...prev, rol: 'Selecciona un rol' }));
      return false;
    }
    setErrors(prev => ({ ...prev, rol: '' }));
    return true;
  };

  const dirigentesDisponibles = dirigentes.filter(d => 
    !d.ya_asignado && 
    d.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSelectPersona = (persona: DirigentDisponible) => {
    setPersonaSeleccionada(persona);
    setStep(2);
  };

  const handleGuardar = async () => {
    setTouched({ rol: true });
    
    if (!personaSeleccionada || !validateRol(rol)) {
      return;
    }

    try {
      setGuardando(true);
      await ActividadesExteriorService.agregarStaff(actividadId, {
        persona_id: personaSeleccionada.id,
        rol,
        responsabilidades: responsabilidades || undefined,
      });
      
      toast.success(`${personaSeleccionada.nombre} agregado al staff`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error agregando staff:', error);
      toast.error(error.message || 'Error al agregar staff');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {step === 1 ? 'Seleccionar Persona' : 'Asignar Rol'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Busca y selecciona un dirigente para agregar al staff'
              : `Asigna rol y responsabilidades a ${personaSeleccionada?.nombre}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de dirigentes */}
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : dirigentesDisponibles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <User className="h-12 w-12 mb-2 opacity-50" />
                  <p>No hay dirigentes disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dirigentesDisponibles.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectPersona(d)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{d.nombre}</p>
                        {d.cargo && (
                          <p className="text-sm text-muted-foreground">{d.cargo}</p>
                        )}
                      </div>
                      {d.es_dirigente && (
                        <Badge variant="secondary">Dirigente</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 2 && personaSeleccionada && (
          <div className="space-y-4">
            {/* Persona seleccionada */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{personaSeleccionada.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {personaSeleccionada.cargo || 'Sin cargo asignado'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStep(1)}
              >
                Cambiar
              </Button>
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="rol">
                Rol en la actividad <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={rol} 
                onValueChange={(v) => {
                  setRol(v);
                  if (touched.rol) validateRol(v);
                }}
              >
                <SelectTrigger 
                  id="rol"
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, rol: true }));
                    validateRol(rol);
                  }}
                  className={errors.rol ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {rolesStaff.map((r) => (
                    <SelectItem key={r.codigo} value={r.codigo}>
                      {r.icono} {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rol && touched.rol && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.rol}
                </p>
              )}
            </div>

            {/* Responsabilidades */}
            <div className="space-y-2">
              <Label htmlFor="responsabilidades">Responsabilidades específicas</Label>
              <Textarea
                id="responsabilidades"
                placeholder="Ej: Coordinar actividades de la mañana, revisar materiales..."
                value={responsabilidades}
                onChange={(e) => setResponsabilidades(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Describe las tareas específicas asignadas.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button onClick={handleGuardar} disabled={guardando || !rol}>
              {guardando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Agregar al Staff
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgregarStaffDialog;
