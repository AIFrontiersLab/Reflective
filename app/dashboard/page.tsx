"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Slider from "@/components/ui/Slider";
import { useApp } from "@/lib/context";
import * as tauri from "@/lib/tauri";
import type { BehaviorLog } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user, identities, currentIdentity, setCurrentIdentity, loading: appLoading } = useApp();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [alignmentScore, setAlignmentScore] = useState(7);
  const [behaviors, setBehaviors] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const date = todayISO();

  const loadBehaviors = useCallback(async () => {
    if (!currentIdentity) return;
    try {
      const list = await tauri.getBehaviorsForDate(currentIdentity.id, date);
      setBehaviors(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [currentIdentity, date]);

  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (currentIdentity) loadBehaviors();
  }, [currentIdentity, loadBehaviors]);

  const handleLogBehavior = async () => {
    if (!currentIdentity || !description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await tauri.logBehavior({
        date,
        description: description.trim(),
        identity_id: currentIdentity.id,
        alignment_score: alignmentScore,
      });
      setDescription("");
      setAlignmentScore(7);
      await loadBehaviors();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!currentIdentity || !apiKey.trim()) {
      setError("OpenAI API key is required. Add it in Settings or in the field above.");
      return;
    }
    setReflectionLoading(true);
    setError(null);
    try {
      const traitsList = await tauri.listTraits(currentIdentity.id);
      await tauri.generateReflection(apiKey, {
        identity_id: currentIdentity.id,
        date,
        identity_name: currentIdentity.name,
        identity_description: currentIdentity.description,
        traits: traitsList.map((t) => t.name),
        behaviors: behaviors.map((b) => ({
          description: b.description,
          alignment_score: b.alignment_score,
        })),
      });
      router.push("/reflection?date=" + date + "&identityId=" + currentIdentity.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReflectionLoading(false);
    }
  };

  if (appLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (identities.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-label-secondary">No identity yet.</p>
            <Button className="mt-4" onClick={() => router.push("/onboarding")}>
              Set up identity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-display text-lg font-semibold">
            Identity Habit AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/evolution"
              className="text-sm text-label-secondary transition-colors hover:text-label-primary"
            >
              Evolution
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-label-secondary">
            Identity
          </label>
          <select
            value={currentIdentity?.id ?? ""}
            onChange={(e) => {
              const id = identities.find((i) => i.id === Number(e.target.value));
              setCurrentIdentity(id ?? null);
            }}
            className="h-10 w-full rounded-apple border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
          >
            {identities.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Log behavior</CardTitle>
            <p className="text-sm text-label-secondary">
              What did you do today that signals this identity?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="e.g. Shipped the feature without context-switching"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogBehavior()}
            />
            <Slider
              label="Alignment (1–10)"
              value={alignmentScore}
              onChange={setAlignmentScore}
              min={1}
              max={10}
            />
            <Button
              className="w-full"
              onClick={handleLogBehavior}
              loading={loading}
              disabled={!description.trim()}
            >
              Log
            </Button>
          </CardContent>
        </Card>

        {behaviors.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Today&apos;s behaviors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {behaviors.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-apple bg-surface-overlay px-3 py-2 text-sm"
                  >
                    <span className="text-label-primary">{b.description}</span>
                    <span className="font-medium text-label-secondary">
                      {b.alignment_score}/10
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Reflection</CardTitle>
            <p className="text-sm text-label-secondary">
              Generate an identity-alignment reflection for today.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="OpenAI API key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleGenerateReflection}
              loading={reflectionLoading}
              disabled={!apiKey.trim()}
            >
              Generate reflection
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-apple border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
