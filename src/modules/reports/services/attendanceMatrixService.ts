import { supabase } from '../../../lib/supabase';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function isoToLabel(iso: string): string {
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const dd = parts[2].padStart(2, '0');
  const m = parseInt(parts[1], 10) - 1;
  return `${dd} ${MONTHS[m] ?? ''}`;
}

export interface MatrixSession {
  id: string;
  fecha: string; // YYYY-MM-DD
  label: string; // "06 Jun"
}

export type CellStatus = 'P' | 'F' | 'FJ' | 'NA' | '-';

export interface MatrixScout {
  id: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  fecha_ingreso: string | null;
  statuses: Record<string, CellStatus>; // session.id → status
  presente: number;
  falta: number;
  justificado: number;
  na: number;
  totalEvaluadas: number; // sessions where scout was already active
  rendimiento: number;   // 0-100, excludes NA and FJ from denominator
}

export interface AttendanceMatrixData {
  sessions: MatrixSession[];
  scouts: MatrixScout[];
  rama?: string;
  dateFrom: string;
  dateTo: string;
  globalRendimiento: number;
  sessionTotals: Record<string, { P: number; F: number; FJ: number; NA: number; total: number }>;
}

export async function getAttendanceMatrixData(
  dateFrom: string,
  dateTo: string,
  rama?: string
): Promise<AttendanceMatrixData> {
  // ── 1. sessions ───────────────────────────────────────────────────────────
  let pq = supabase
    .from('programa_semanal')
    .select('id, fecha_inicio, rama')
    .gte('fecha_inicio', dateFrom)
    .lte('fecha_inicio', dateTo)
    .order('fecha_inicio', { ascending: true });
  if (rama) pq = pq.eq('rama', rama);

  const { data: programsRaw, error: pErr } = await pq;
  if (pErr) throw pErr;

  const sessions: MatrixSession[] = (programsRaw || []).map((p: any) => ({
    id: p.id,
    fecha: p.fecha_inicio,
    label: isoToLabel(p.fecha_inicio),
  }));

  if (sessions.length === 0) {
    return { sessions: [], scouts: [], rama, dateFrom, dateTo, globalRendimiento: 0, sessionTotals: {} };
  }

  // ── 2. scouts ─────────────────────────────────────────────────────────────
  let sq = supabase
    .from('scouts')
    .select('id, rama_actual, personas!inner(nombres, apellidos, codigo_asociado, fecha_ingreso)')
    .eq('estado', 'ACTIVO');
  if (rama) sq = sq.eq('rama_actual', rama);

  const { data: scoutsRaw, error: sErr } = await sq;
  if (sErr) throw sErr;

  // ── 3. attendance records ─────────────────────────────────────────────────
  const sessionIds = sessions.map(s => s.id);
  const { data: attRaw, error: aErr } = await supabase
    .from('asistencias')
    .select('scout_id, actividad_id, estado_asistencia')
    .in('actividad_id', sessionIds);
  if (aErr) throw aErr;

  // Build lookup: scoutId → (sessionId → estado_asistencia)
  const attMap = new Map<string, Map<string, string>>();
  (attRaw || []).forEach((a: any) => {
    if (!attMap.has(a.scout_id)) attMap.set(a.scout_id, new Map());
    attMap.get(a.scout_id)!.set(a.actividad_id, a.estado_asistencia);
  });

  // ── 4. build matrix rows ──────────────────────────────────────────────────
  const scouts: MatrixScout[] = (scoutsRaw || []).map((s: any) => {
    const p = s.personas as any;
    const fechaIngreso: string | null = p?.fecha_ingreso ?? null;
    const scoutAtt = attMap.get(s.id) ?? new Map<string, string>();

    const statuses: Record<string, CellStatus> = {};
    let presente = 0, falta = 0, justificado = 0, na = 0;

    for (const sess of sessions) {
      // Scout not yet active on this session date
      if (fechaIngreso && sess.fecha < fechaIngreso) {
        statuses[sess.id] = 'NA';
        na++;
        continue;
      }
      const raw = scoutAtt.get(sess.id);
      if (!raw) {
        // Active but no attendance record → unregistered absence
        statuses[sess.id] = '-';
        falta++;
        continue;
      }
      if (raw === 'PRESENTE' || raw === 'TARDANZA') {
        statuses[sess.id] = 'P';
        presente++;
      } else if (raw === 'JUSTIFICADO') {
        statuses[sess.id] = 'FJ';
        justificado++;
      } else {
        statuses[sess.id] = 'F';
        falta++;
      }
    }

    const totalEvaluadas = sessions.length - na;
    const denom = totalEvaluadas - justificado;
    const rendimiento = denom > 0
      ? Math.round((presente / denom) * 100)
      : (totalEvaluadas === 0 ? 0 : 100);

    return {
      id: s.id,
      nombres: p?.nombres ?? '',
      apellidos: p?.apellidos ?? '',
      codigo: p?.codigo_asociado ?? '',
      fecha_ingreso: fechaIngreso,
      statuses, presente, falta, justificado, na, totalEvaluadas, rendimiento,
    };
  }).sort((a, b) => b.rendimiento - a.rendimiento || a.apellidos.localeCompare(b.apellidos));

  // ── 5. session totals ──────────────────────────────────────────────────────
  const sessionTotals: Record<string, { P: number; F: number; FJ: number; NA: number; total: number }> = {};
  for (const sess of sessions) {
    let P = 0, F = 0, FJ = 0, NA = 0;
    for (const scout of scouts) {
      const st = scout.statuses[sess.id];
      if (st === 'P') P++;
      else if (st === 'F' || st === '-') F++;
      else if (st === 'FJ') FJ++;
      else if (st === 'NA') NA++;
    }
    sessionTotals[sess.id] = { P, F, FJ, NA, total: P + F + FJ };
  }

  // ── 6. global rendimiento (weighted average) ───────────────────────────────
  const totalPres = scouts.reduce((s, x) => s + x.presente, 0);
  const totalDenom = scouts.reduce((s, x) => s + Math.max(0, x.totalEvaluadas - x.justificado), 0);
  const globalRendimiento = totalDenom > 0 ? Math.round((totalPres / totalDenom) * 100) : 0;

  return { sessions, scouts, rama, dateFrom, dateTo, globalRendimiento, sessionTotals };
}

// Compute date range from a month selection
export function monthToRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dateFrom: `${year}-${mm}-01`,
    dateTo: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

// Compute date range from a quarter selection (1-4)
export function quarterToRange(year: number, quarter: number): { dateFrom: string; dateTo: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    dateFrom: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    dateTo: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}
