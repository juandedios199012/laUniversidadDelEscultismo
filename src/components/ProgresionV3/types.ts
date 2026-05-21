import type { ProgresoArea } from '../../services/progresionService';

export interface V3ScoutSummary {
  id: string;
  code: string;
  fullName: string;
  firstName: string;
  age: number;
  branch: string;
  patrol: string;
  stageCode: string;
  stageName: string;
  stageColor: string;
  stageAccent: string;
  progress: number;
  achievements: number;
  objectivesCompleted: number;
  objectivesTotal: number;
  activeSpecialties: number;
  badgeCount: number;
  headline: string;
  photoUrl?: string;
  areas: ProgresoArea[];
}

export interface V3StageDistributionItem {
  label: string;
  code: string;
  value: number;
  percentage: number;
  color: string;
}

export interface V3BarMetric {
  label: string;
  value: number;
  color: string;
  status: 'excellent' | 'good' | 'regular' | 'risk';
}

export interface V3TrendSeries {
  label: string;
  color: string;
  values: number[];
}

export interface V3BitacoraEntry {
  id: string;
  scoutId: string;
  scoutName: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  verified: boolean;
  points: number;
  color: string;
}

export interface V3InsightCard {
  id: string;
  title: string;
  body: string;
  action: string;
  gradient: string;
}

export interface V3EventCard {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  color: string;
  notes?: string[];
}

export interface V3AnnouncementCard {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  priority: 'Alta' | 'Media' | 'Baja';
}