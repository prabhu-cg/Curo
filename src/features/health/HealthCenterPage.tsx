import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Info,
  OctagonAlert,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useBookmarks,
  useFolders,
  useHealthInsights,
  useHealthScore,
  useSettings,
} from '@/hooks';
import { DEFAULT_HEALTH_WEIGHTS } from '@/services/healthScoreService';
import type { ActionableInsight, HealthFactorKey } from '@/types';

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs attention';
  return 'Poor';
}

const SEVERITY_ICON: Record<ActionableInsight['severity'], typeof Info> = {
  critical: OctagonAlert,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR: Record<ActionableInsight['severity'], string> = {
  critical: 'text-destructive',
  warning: 'text-[#b08900]',
  info: 'text-[#555555]',
};

export function HealthCenterPage() {
  const { bookmarks } = useBookmarks();
  const { folders } = useFolders();
  const { settings, update } = useSettings();
  const health = useHealthScore(bookmarks, settings.healthScoreWeights);
  const insights = useHealthInsights(bookmarks, folders);

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No health data yet"
        description="Import or add bookmarks to see your Knowledge Health Score."
        action={
          <Button asChild>
            <Link to="/import">Import bookmarks</Link>
          </Button>
        }
      />
    );
  }

  function handleCommit(key: HealthFactorKey, value: number) {
    void update({ healthScoreWeights: { ...settings.healthScoreWeights, [key]: value } });
  }

  async function handleReset() {
    await update({ healthScoreWeights: DEFAULT_HEALTH_WEIGHTS });
    toast.success('Weights reset to defaults');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Knowledge Health Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold">{health.score}</span>
            <span className="text-sm text-[#555555]">
              / 100 · {scoreLabel(health.score)}
            </span>
          </div>

          <div className="space-y-4">
            {health.factors.map((factor) => (
              <div key={factor.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{factor.label}</span>
                  <span className="text-[#555555]">{factor.value}</span>
                </div>
                <Progress value={factor.value} aria-label={factor.label} />
                <p className="mt-1 text-xs text-[#555555]">{factor.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Scoring weights</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => void handleReset()}>
            <RotateCcw /> Reset to defaults
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-[#555555]">
            Adjust how much each factor counts toward your overall score.
          </p>
          {health.factors.map((factor) => (
            <div key={factor.key} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-sm">{factor.label}</span>
              <Slider
                value={[settings.healthScoreWeights[factor.key as HealthFactorKey]]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => {
                  if (v === undefined) return;
                  handleCommit(factor.key as HealthFactorKey, v);
                }}
                aria-label={`${factor.label} weight`}
              />
              <span className="w-10 shrink-0 text-right text-xs text-[#555555] tabular-nums">
                {Math.round(
                  settings.healthScoreWeights[factor.key as HealthFactorKey] * 100,
                )}
                %
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actionable insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {insights.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#555555]">
              No issues found — your library is in great shape.
            </p>
          ) : (
            insights.map((insight) => {
              const Icon = SEVERITY_ICON[insight.severity];
              return (
                <Link
                  key={insight.id}
                  to={insight.actionHref}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex items-start gap-3 rounded-md p-3 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${SEVERITY_COLOR[insight.severity]}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-[#555555]">{insight.description}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[#555555]">
                    {insight.actionLabel} <ArrowRight className="size-3" />
                  </span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
