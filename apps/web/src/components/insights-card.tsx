import { AlertTriangle, Info, RefreshCw, Sparkles, ThumbsUp } from 'lucide-react';
import type { InsightTone } from '@spendly/shared';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsights, useRefreshInsights, useServerConfig } from '@/hooks/api';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const TONES: Record<InsightTone, { icon: typeof Info; className: string }> = {
  positive: { icon: ThumbsUp, className: 'bg-income/12 text-income' },
  warning: { icon: AlertTriangle, className: 'bg-warning/15 text-warning' },
  info: { icon: Info, className: 'bg-primary/12 text-primary' },
};

export function InsightsCard({ month, hasData }: { month: string; hasData: boolean }) {
  const { data: config } = useServerConfig();
  const enabled = Boolean(config?.features.ai) && hasData;
  const { data, isLoading, error } = useInsights(month, enabled);
  const refresh = useRefreshInsights(month);

  if (!config?.features.ai) return null;

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/15 blur-3xl" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> AI insights
        </CardTitle>
        <CardDescription>
          {data?.generatedAt ? `Updated ${formatAgo(data.generatedAt)}` : 'Personal tips based on this month'}
        </CardDescription>
        {hasData && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending || isLoading}
              aria-label="Regenerate insights"
            >
              <RefreshCw className={cn(refresh.isPending && 'animate-spin')} />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasData && <p className="text-sm text-muted-foreground">Add a few transactions to get personalised insights.</p>}
        {(isLoading || refresh.isPending) &&
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        {error && !refresh.isPending && <p className="text-sm text-muted-foreground">{error.message}</p>}
        {!isLoading &&
          !refresh.isPending &&
          data?.insights.map((insight) => {
            const tone = TONES[insight.tone];
            return (
              <div key={insight.title} className="flex gap-3">
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tone.className)}>
                  <tone.icon className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-medium">{insight.title}</div>
                  <p className="text-sm text-muted-foreground">{insight.body}</p>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
