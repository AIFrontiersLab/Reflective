"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/context";
import * as tauri from "@/lib/tauri";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function ReflectionContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const identityIdParam = searchParams.get("identityId");
  const { currentIdentity, identities } = useApp();
  const identityId = identityIdParam ? Number(identityIdParam) : currentIdentity?.id;
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (identityId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await tauri.getReflectionForDate(identityId, date);
      setContent(r?.content ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [identityId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const identity = identityId
    ? identities.find((i) => i.id === identityId) ?? currentIdentity
    : currentIdentity;

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
        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold">
            Reflection — {date}
          </h1>
          {identity && (
            <p className="mt-1 text-sm text-label-secondary">{identity.name}</p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          </div>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && content && (
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-label-primary whitespace-pre-wrap">
                {content}
              </div>
              <div className="mt-6 flex gap-3">
                <Link href="/dashboard">
                  <Button variant="secondary">Back to dashboard</Button>
                </Link>
                <Link
                  href={
                    "/dashboard?regenerate=1&date=" +
                    date +
                    "&identityId=" +
                    (identityId ?? "")
                  }
                >
                  <Button variant="ghost">Regenerate</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && !content && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-label-secondary">
                No reflection for this day yet.
              </p>
              <Link href="/dashboard" className="mt-4 inline-block">
                <Button>Log behaviors & generate</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function ReflectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      }
    >
      <ReflectionContent />
    </Suspense>
  );
}
