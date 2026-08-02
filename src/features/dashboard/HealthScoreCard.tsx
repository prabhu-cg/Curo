import { Link } from 'react-router-dom';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { HealthScoreBreakdown } from '@/types';

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs attention';
  return 'Poor';
}

export function HealthScoreCard({ health }: { health: HealthScoreBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Knowledge Health Score</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/health">View full report</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold">{health.score}</span>
          <span className="text-sm text-muted-foreground">
            / 100 · {scoreLabel(health.score)}
          </span>
        </div>

        <div className="space-y-3">
          {health.factors.map((factor) => (
            <div key={factor.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{factor.label}</span>
                <span className="text-muted-foreground">{factor.value}</span>
              </div>
              <Progress value={factor.value} aria-label={factor.label} />
              <p className="mt-1 text-xs text-muted-foreground">{factor.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
