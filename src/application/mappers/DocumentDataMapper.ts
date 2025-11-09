// ================================================================
// 🗂️ Application Mapper: Document Data
// ================================================================

import { ScoutDocumentData, GroupDocumentData, ActivityDocumentData } from '../../domain/entities/DocumentData';

export interface DocumentDataMapper {
  getScoutData(scoutId: string): Promise<ScoutDocumentData>;
  getGroupData(groupId: string): Promise<GroupDocumentData>;
  getActivityData(activityId: string): Promise<ActivityDocumentData>;
}

export class DocumentDataMapperImpl implements DocumentDataMapper {
  constructor(
    private scoutService: any, // Inyectar ScoutService
    private groupService: any, // Inyectar GrupoScoutService  
    private activityService: any // Inyectar ActividadService
  ) {}

  async getScoutData(scoutId: string): Promise<ScoutDocumentData> {
    // Obtener datos del scout desde la base de datos
    const scout = await this.scoutService.getById(scoutId);
    if (!scout) {
      throw new Error(`Scout not found: ${scoutId}`);
    }

    // Obtener familiares
    const familiares = await this.scoutService.getFamiliares(scoutId);
    
    // Obtener información de patrulla
    const patrulla = await this.scoutService.getPatrulla(scoutId);

    // Mapear a estructura de documento
    return {
      id: scout.id,
      codigoScout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      nombreCompleto: `${scout.nombres} ${scout.apellidos}`,
      fechaNacimiento: new Date(scout.fecha_nacimiento),
      edad: this.calculateAge(scout.fecha_nacimiento),
      sexo: scout.sexo,
      tipoDocumento: scout.tipo_documento,
      numeroDocumento: scout.numero_documento,
      celular: scout.celular,
      correo: scout.correo,
      direccion: scout.direccion,
      departamento: scout.departamento,
      provincia: scout.provincia,
      distrito: scout.distrito,
      centroEstudio: scout.centro_estudio,
      ocupacion: scout.ocupacion,
      centroLaboral: scout.centro_laboral,
      ramaActual: scout.rama_actual,
      fechaIngreso: new Date(scout.fecha_ingreso),
      tiempoEnMovimiento: this.calculateTimeInMovement(scout.fecha_ingreso),
      estado: scout.estado,
      patrulla: patrulla ? {
        id: patrulla.id,
        nombre: patrulla.nombre,
        animalTotem: patrulla.animal_totem,
        color: patrulla.color_patrulla,
        cargo: patrulla.cargo_patrulla || 'MIEMBRO'
      } : undefined,
      familiares: familiares.map(familiar => ({
        nombres: familiar.nombres,
        apellidos: familiar.apellidos,
        parentesco: familiar.parentesco,
        celular: familiar.celular,
        correo: familiar.correo,
        direccionTrabajo: familiar.direccion_trabajo,
        esContactoEmergencia: familiar.es_contacto_emergencia,
        esAutorizadoRecoger: familiar.es_autorizado_recoger
      })),
      contactoEmergencia: this.getContactoEmergencia(familiares),
      observaciones: scout.observaciones
    };
  }

  async getGroupData(groupId: string): Promise<GroupDocumentData> {
    const group = await this.groupService.getById(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    const dirigentes = await this.groupService.getDirigentes(groupId);
    const estadisticas = await this.groupService.getEstadisticas(groupId);

    return {
      id: group.id,
      codigoGrupo: group.codigo_grupo,
      nombre: group.nombre,
      numeral: group.numeral,
      localidad: group.localidad,
      region: group.region,
      fechaFundacion: new Date(group.fecha_fundacion),
      fundador: group.fundador,
      lugarReunion: group.lugar_reunion,
      direccionSede: group.direccion_sede,
      telefonoContacto: group.telefono_contacto,
      emailContacto: group.email_contacto,
      sitioWeb: group.sitio_web,
      dirigentes: dirigentes.map(dirigente => ({
        id: dirigente.id,
        nombres: dirigente.nombres,
        apellidos: dirigente.apellidos,
        cargo: dirigente.cargo,
        ramaResponsable: dirigente.rama_responsable,
        fechaInicioCargo: new Date(dirigente.fecha_inicio_cargo),
        estado: dirigente.estado_dirigente,
        certificaciones: dirigente.certificaciones || [],
        contacto: {
          celular: dirigente.celular,
          correo: dirigente.correo
        }
      })),
      estadisticas: {
        totalScouts: estadisticas.total_scouts,
        scoutsPorRama: {
          Lobatos: estadisticas.scouts_lobatos,
          Scouts: estadisticas.scouts_scouts,
          Rovers: estadisticas.scouts_rovers,
          Dirigentes: estadisticas.scouts_dirigentes
        },
        totalDirigentes: estadisticas.total_dirigentes,
        fechaUltimaActualizacion: new Date()
      }
    };
  }

  async getActivityData(activityId: string): Promise<ActivityDocumentData> {
    const activity = await this.activityService.getById(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const participantes = await this.activityService.getParticipantes(activityId);
    const responsable = await this.activityService.getResponsable(activityId);

    return {
      id: activity.id,
      nombre: activity.nombre,
      tipo: activity.tipo_actividad,
      fechaInicio: new Date(activity.fecha_inicio),
      fechaFin: activity.fecha_fin ? new Date(activity.fecha_fin) : undefined,
      ubicacion: activity.ubicacion,
      participantes: participantes.map(p => ({
        scoutId: p.scout_id,
        nombres: p.nombres,
        apellidos: p.apellidos,
        rama: p.rama,
        asistencia: p.estado_asistencia,
        observaciones: p.observaciones
      })),
      responsable: {
        id: responsable.id,
        nombres: responsable.nombres,
        apellidos: responsable.apellidos,
        cargo: responsable.cargo,
        ramaResponsable: responsable.rama_responsable,
        fechaInicioCargo: new Date(responsable.fecha_inicio_cargo),
        estado: responsable.estado_dirigente,
        certificaciones: responsable.certificaciones || []
      }
    };
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateTimeInMovement(fechaIngreso: string): string {
    const ingreso = new Date(fechaIngreso);
    const ahora = new Date();
    const diffTime = Math.abs(ahora.getTime() - ingreso.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`;
    } else {
      return `${months} mes${months > 1 ? 'es' : ''}`;
    }
  }

  private getContactoEmergencia(familiares: any[]) {
    const contacto = familiares.find(f => f.es_contacto_emergencia);
    if (contacto) {
      return {
        nombre: `${contacto.nombres} ${contacto.apellidos}`,
        parentesco: contacto.parentesco,
        celular: contacto.celular,
        direccion: contacto.direccion_trabajo
      };
    }
    
    // Si no hay contacto de emergencia marcado, usar el primer familiar
    const primerFamiliar = familiares[0];
    if (primerFamiliar) {
      return {
        nombre: `${primerFamiliar.nombres} ${primerFamiliar.apellidos}`,
        parentesco: primerFamiliar.parentesco,
        celular: primerFamiliar.celular,
        direccion: primerFamiliar.direccion_trabajo
      };
    }
    
    return {
      nombre: 'No especificado',
      parentesco: 'No especificado',
      celular: 'No especificado'
    };
  }
}