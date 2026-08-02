export interface DomainCount {
  domain: string;
  count: number;
}

export interface FolderCount {
  folderPath: string[];
  label: string;
  count: number;
}

export interface CollectionCount {
  collectionId: string;
  name: string;
  count: number;
}

export interface AgeBucket {
  label: string;
  count: number;
}

export interface GrowthPoint {
  /** YYYY-MM */
  month: string;
  count: number;
  cumulative: number;
}

export interface AnalyticsSnapshot {
  totalBookmarks: number;
  domains: DomainCount[];
  folders: FolderCount[];
  collections: CollectionCount[];
  ageBuckets: AgeBucket[];
  growth: GrowthPoint[];
}

export interface HealthScoreFactor {
  key: string;
  label: string;
  /** 0-100 */
  value: number;
  /** Relative weight used to combine into the overall score. */
  weight: number;
  description: string;
}

export interface HealthScoreBreakdown {
  /** 0-100 */
  score: number;
  factors: HealthScoreFactor[];
}

export const HEALTH_FACTOR_KEYS = [
  'duplicates',
  'organization',
  'tags',
  'titles',
  'freshness',
] as const;

export type HealthFactorKey = (typeof HEALTH_FACTOR_KEYS)[number];

export type HealthScoreWeights = Record<HealthFactorKey, number>;

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  actionLabel: string;
  actionHref: string;
  count?: number;
}
