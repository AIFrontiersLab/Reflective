import { invoke } from "@tauri-apps/api/core";

export async function createUser(name: string) {
  return invoke<{ id: number; name: string; created_at: string }>("create_user", {
    name,
  });
}

export async function getUser() {
  return invoke<{ id: number; name: string; created_at: string } | null>("get_user");
}

export async function createIdentity(
  userId: number,
  input: { name: string; description?: string }
) {
  return invoke<{
    id: number;
    name: string;
    description: string;
    user_id: number;
    created_at: string;
  }>("create_identity", { userId, input });
}

export async function listIdentities(userId: number) {
  return invoke<
    Array<{
      id: number;
      name: string;
      description: string;
      user_id: number;
      created_at: string;
    }>
  >("list_identities", { userId });
}

export async function getIdentity(id: number) {
  return invoke<{
    id: number;
    name: string;
    description: string;
    user_id: number;
    created_at: string;
  } | null>("get_identity", { id });
}

export async function updateIdentity(
  id: number,
  updates: { name?: string; description?: string }
) {
  return invoke<{
    id: number;
    name: string;
    description: string;
    user_id: number;
    created_at: string;
  }>("update_identity", {
    id,
    name: updates.name ?? null,
    description: updates.description ?? null,
  });
}

export async function createTrait(identityId: number, name: string) {
  return invoke<{
    id: number;
    name: string;
    identity_id: number;
    created_at: string;
  }>("create_trait", { identityId, name });
}

export async function listTraits(identityId: number) {
  return invoke<
    Array<{
      id: number;
      name: string;
      identity_id: number;
      created_at: string;
    }>
  >("list_traits", { identityId });
}

export async function deleteTrait(id: number) {
  return invoke<void>("delete_trait", { id });
}

export async function logBehavior(input: {
  date: string;
  description: string;
  identity_id: number;
  alignment_score: number;
}) {
  return invoke<{
    id: number;
    date: string;
    description: string;
    identity_id: number;
    alignment_score: number;
    created_at: string;
  }>("log_behavior", { input });
}

export async function getBehaviorsForDate(
  identityId: number,
  date: string
) {
  return invoke<
    Array<{
      id: number;
      date: string;
      description: string;
      identity_id: number;
      alignment_score: number;
      created_at: string;
    }>
  >("get_behaviors_for_date", { identityId, date });
}

export async function listBehaviorsForIdentity(
  identityId: number,
  fromDate?: string,
  toDate?: string
) {
  return invoke<
    Array<{
      id: number;
      date: string;
      description: string;
      identity_id: number;
      alignment_score: number;
      created_at: string;
    }>
  >("list_behaviors_for_identity", {
    identityId,
    fromDate: fromDate ?? null,
    toDate: toDate ?? null,
  });
}

export async function generateReflection(
  apiKey: string,
  input: {
    identity_id: number;
    date: string;
    identity_name: string;
    identity_description: string;
    traits: string[];
    behaviors: Array<{ description: string; alignment_score: number }>;
  }
) {
  return invoke<{
    id: number;
    date: string;
    content: string;
    identity_id: number;
    created_at: string;
  }>("generate_reflection", { apiKey, input });
}

export async function getReflectionForDate(
  identityId: number,
  date: string
) {
  return invoke<{
    id: number;
    date: string;
    content: string;
    identity_id: number;
    created_at: string;
  } | null>("get_reflection_for_date", { identityId, date });
}

export async function listReflections(
  identityId: number,
  limit?: number
) {
  return invoke<
    Array<{
      id: number;
      date: string;
      content: string;
      identity_id: number;
      created_at: string;
    }>
  >("list_reflections", { identityId, limit: limit ?? null });
}

export async function getWeeklyAlignment(
  identityId: number,
  fromDate: string,
  toDate: string
) {
  return invoke<
    Array<{ date: string; avg_score: number; count: number }>
  >("get_weekly_alignment", {
    identityId,
    fromDate,
    toDate,
  });
}

export async function getAlignmentTrends(
  identityId: number,
  days?: number
) {
  return invoke<
    Array<{
      date: string;
      avg_alignment: number;
      behavior_count: number;
    }>
  >("get_alignment_trends", { identityId, days: days ?? null });
}
