import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UbigeoService, Departamento, Provincia, Distrito } from '@/services/ubigeoService';
import { Loader2 } from 'lucide-react';

interface UbigeoSelectorProps {
  departamento: string;
  provincia: string;
  distrito: string;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
  disabled?: boolean;
}

export const UbigeoSelector: React.FC<UbigeoSelectorProps> = ({
  departamento,
  provincia,
  distrito,
  onDepartamentoChange,
  onProvinciaChange,
  onDistritoChange,
  disabled = false
}) => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  
  const [loadingDep, setLoadingDep] = useState(true);
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);

  const [selectedDepId, setSelectedDepId] = useState<number | null>(null);
  const [selectedProvId, setSelectedProvId] = useState<number | null>(null);

  // Cargar departamentos al montar
  useEffect(() => {
    const cargarDepartamentos = async () => {
      setLoadingDep(true);
      const data = await UbigeoService.obtenerDepartamentos();
      setDepartamentos(data);
      setLoadingDep(false);
    };
    cargarDepartamentos();
  }, []);

  // Cuando cambia el departamento prop o los departamentos se cargan, buscar ID
  useEffect(() => {
    if (departamento && departamentos.length > 0 && !selectedDepId) {
      const dep = departamentos.find(d => d.nombre === departamento);
      if (dep) {
        setSelectedDepId(dep.id);
      }
    }
  }, [departamento, departamentos]);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    if (selectedDepId) {
      const cargarProvincias = async () => {
        setLoadingProv(true);
        const data = await UbigeoService.obtenerProvincias(selectedDepId);
        setProvincias(data);
        setLoadingProv(false);
      };
      cargarProvincias();
    } else {
      setProvincias([]);
      setDistritos([]);
    }
  }, [selectedDepId]);

  // Cuando cambia la provincia prop o las provincias se cargan, buscar ID
  useEffect(() => {
    if (provincia && provincias.length > 0 && !selectedProvId) {
      const prov = provincias.find(p => p.nombre === provincia);
      if (prov) {
        setSelectedProvId(prov.id);
      }
    }
  }, [provincia, provincias]);

  // Cargar distritos cuando cambia provincia
  useEffect(() => {
    if (selectedProvId) {
      const cargarDistritos = async () => {
        setLoadingDist(true);
        const data = await UbigeoService.obtenerDistritos(selectedProvId);
        setDistritos(data);
        setLoadingDist(false);
      };
      cargarDistritos();
    } else {
      setDistritos([]);
    }
  }, [selectedProvId]);

  const handleDepartamentoChange = (value: string) => {
    const dep = departamentos.find(d => d.nombre === value);
    setSelectedDepId(dep?.id || null);
    setSelectedProvId(null);
    onDepartamentoChange(value);
    onProvinciaChange('');
    onDistritoChange('');
  };

  const handleProvinciaChange = (value: string) => {
    const prov = provincias.find(p => p.nombre === value);
    setSelectedProvId(prov?.id || null);
    onProvinciaChange(value);
    onDistritoChange('');
  };

  const handleDistritoChange = (value: string) => {
    onDistritoChange(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-50">
      {/* Departamento */}
      <div className="space-y-2">
        <Label htmlFor="departamento">Departamento</Label>
        <Select
          value={departamento}
          onValueChange={handleDepartamentoChange}
          disabled={disabled || loadingDep}
        >
          <SelectTrigger id="departamento">
            {loadingDep ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : (
              <SelectValue placeholder="Seleccionar departamento" />
            )}
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {departamentos.map((dep) => (
              <SelectItem key={dep.id} value={dep.nombre}>
                {dep.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provincia */}
      <div className="space-y-2">
        <Label htmlFor="provincia">Provincia</Label>
        <Select
          value={provincia}
          onValueChange={handleProvinciaChange}
          disabled={disabled || !selectedDepId || loadingProv}
        >
          <SelectTrigger id="provincia">
            {loadingProv ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : (
              <SelectValue placeholder={selectedDepId ? "Seleccionar provincia" : "Primero seleccione departamento"} />
            )}
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {provincias.map((prov) => (
              <SelectItem key={prov.id} value={prov.nombre}>
                {prov.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Distrito */}
      <div className="space-y-2">
        <Label htmlFor="distrito">Distrito</Label>
        <Select
          value={distrito}
          onValueChange={handleDistritoChange}
          disabled={disabled || !selectedProvId || loadingDist}
        >
          <SelectTrigger id="distrito">
            {loadingDist ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : (
              <SelectValue placeholder={selectedProvId ? "Seleccionar distrito" : "Primero seleccione provincia"} />
            )}
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {distritos.map((dist) => (
              <SelectItem key={dist.id} value={dist.nombre}>
                {dist.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
