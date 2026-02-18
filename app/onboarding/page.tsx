"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useApp } from "@/lib/context";
import * as tauri from "@/lib/tauri";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "name" | "identity" | "traits" | "done";

export default function OnboardingPage() {
  const { refreshUser, refreshIdentities } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [identityName, setIdentityName] = useState("");
  const [identityDescription, setIdentityDescription] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await tauri.createUser(name.trim());
      await refreshUser();
      setStep("identity");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const addTrait = () => {
    const t = traitInput.trim();
    if (t && !traits.includes(t)) {
      setTraits((prev) => [...prev, t]);
      setTraitInput("");
    }
  };

  const removeTrait = (t: string) => {
    setTraits((prev) => prev.filter((x) => x !== t));
  };

  const { user } = useApp();

  const handleCreateIdentitySubmit = async () => {
    if (!identityName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setError("User not found.");
        return;
      }
      await tauri.createIdentity(user.id, {
        name: identityName.trim(),
        description: identityDescription.trim() || undefined,
      });
      await refreshIdentities();
      setStep("traits");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTraitsSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await tauri.getUser();
      if (!u) {
        setError("User not found.");
        return;
      }
      const list = await tauri.listIdentities(u.id);
      const identity = list[0];
      if (!identity) {
        setError("Identity not found.");
        return;
      }
      for (const t of traits) {
        await tauri.createTrait(identity.id, t);
      }
      await refreshIdentities();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-label-primary">
            Identity Habit AI
          </h1>
          <p className="mt-1 text-sm text-label-secondary">
            Who you are becoming.
          </p>
        </div>

        {step === "name" && (
          <Card>
            <CardHeader>
              <CardTitle>Your name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                placeholder="How should we address you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={handleCreateUser}
                loading={loading}
                disabled={!name.trim()}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "identity" && (
          <Card>
            <CardHeader>
              <CardTitle>Define your identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Identity"
                placeholder="e.g. Disciplined Founder"
                value={identityName}
                onChange={(e) => setIdentityName(e.target.value)}
              />
              <Textarea
                label="Description (optional)"
                placeholder="What this identity means to you..."
                value={identityDescription}
                onChange={(e) => setIdentityDescription(e.target.value)}
                rows={3}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={handleCreateIdentitySubmit}
                loading={loading}
                disabled={!identityName.trim()}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "traits" && (
          <Card>
            <CardHeader>
              <CardTitle>Traits that signal this identity</CardTitle>
              <p className="mt-1 text-sm text-label-secondary">
                e.g. focused, decisive, consistent
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a trait"
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTrait())}
                />
                <Button variant="secondary" onClick={addTrait}>
                  Add
                </Button>
              </div>
              {traits.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {traits.map((t) => (
                    <li
                      key={t}
                      className="inline-flex items-center rounded-apple bg-surface-overlay px-3 py-1.5 text-sm"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTrait(t)}
                        className="ml-2 text-label-tertiary hover:text-label-primary"
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={handleFinishTraitsSubmit}
                loading={loading}
              >
                Finish setup
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <div className="text-center text-label-secondary">
            Redirecting to dashboard...
          </div>
        )}
      </div>
    </div>
  );
}
