"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/context";
import * as tauri from "@/lib/tauri";
import type { AlignmentTrend } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  return { from: from.toISOString().slice(0, 10), to };
}

export default function EvolutionPage() {
  const { currentIdentity, loading: appLoading } = useApp();
  const [trends, setTrends] = useState<AlignmentTrend[]>([]);
  const [weekly, setWeekly] = useState<Array<{ date: string; avg_score: number; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentIdentity) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [t, w] = await Promise.all([
        tauri.getAlignmentTrends(currentIdentity.id, 14),
        (async () => {
          const { from, to } = getWeekRange();
          return tauri.getWeeklyAlignment(
            currentIdentity.id,
            from,
            to
          );
        })(),
      ]);
      setTrends(t);
      setWeekly(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [currentIdentity]);

  useEffect(() => {
    load();
  }, [load]);

  if (appLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (!currentIdentity) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-label-secondary">Select an identity first.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button>Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxScore = Math.max(
    ...trends.map((x) => x.avg_alignment),
    1
  );
  const avgRecent =
    trends.length > 0
      ? trends
          .slice(-7)
          .reduce((a, x) => a + x.avg_alignment, 0) / Math.min(7, trends.length)
      : 0;
  const prevWeek =
    trends.length > 7
      ? trends
          .slice(-14, -7)
          .reduce((a, x) => a + x.avg_alignment, 0) / Math.min(7, trends.length - 7)
      : 0;
  const drift = avgRecent - prevWeek;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-display text-lg font-semibold">
            Identity Habit AI
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-label-secondary hover:text-label-primary"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-xl font-semibold">
            Identity Evolution
          </h1>
          <p className="mt-1 text-sm text-label-secondary">
            {currentIdentity.name}
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weekly alignment</CardTitle>
            <p className="text-sm text-label-secondary">
              Average alignment score per day
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
              </div>
            ) : weekly.length === 0 ? (
              <p className="py-8 text-center text-sm text-label-tertiary">
                No data this week. Log behaviors on the dashboard.
              </p>
            ) : (
              <div className="flex items-end justify-between gap-1">
                {weekly.map((d) => (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-neutral-200 transition-all"
                      style={{
                        height: `${Math.max(8, (d.avg_score / 10) * 120)}px`,
                      }}
                    />
                    <span className="text-xs text-label-tertiary">
                      {d.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Drift indicator</CardTitle>
            <p className="text-sm text-label-secondary">
              This week vs. previous week average
            </p>
          </CardHeader>
          <CardContent>
            {trends.length < 2 ? (
              <p className="text-sm text-label-tertiary">
                Need more days of data.
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={
                    drift >= 0
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {drift >= 0 ? "↑" : "↓"} {Math.abs(drift).toFixed(1)} pts
                </span>
                <span className="text-sm text-label-secondary">
                  {drift >= 0
                    ? "Alignment improving"
                    : "Possible identity drift"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32" />
            ) : trends.length === 0 ? (
              <p className="text-sm text-label-tertiary">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...trends].reverse().map((t) => (
                  <li
                    key={t.date}
                    className="flex items-center justify-between rounded-apple bg-surface-overlay px-3 py-2 text-sm"
                  >
                    <span>{t.date}</span>
                    <span className="font-medium">
                      {t.avg_alignment.toFixed(1)} / 10
                    </span>
                    <span className="text-label-tertiary">
                      {t.behavior_count} behaviors
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
