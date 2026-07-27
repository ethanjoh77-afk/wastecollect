import { supabase } from "../lib/supabase";

export type LandingSection =
  | "hero"
  | "hero_carousel"
  | "features"
  | "steps"
  | "testimonials"
  | "stats";

export interface LandingContentItem {
  id: string;
  section: LandingSection;
  title: string | null;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type LandingContentInput = Partial<
  Omit<LandingContentItem, "id" | "created_at" | "updated_at">
> & { section: LandingSection };

/** Pata items zote za section fulani, zikiwa zimepangwa kwa sort_order. */
export async function getSection(
  section: LandingSection
): Promise<LandingContentItem[]> {
  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .eq("section", section)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Pata sections zote kwa mara moja — inafaa kwa admin dashboard. */
export async function getAllSections(): Promise<
  Record<LandingSection, LandingContentItem[]>
> {
  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const grouped: Record<string, LandingContentItem[]> = {};
  for (const item of data ?? []) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }
  return grouped as Record<LandingSection, LandingContentItem[]>;
}

/** Ongeza item mpya kwenye section fulani. */
export async function createContent(
  payload: LandingContentInput
): Promise<LandingContentItem> {
  const { data, error } = await supabase
    .from("landing_content")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Sasisha item iliyopo. */
export async function updateContent(
  id: string,
  payload: Partial<LandingContentInput>
): Promise<LandingContentItem> {
  const { data, error } = await supabase
    .from("landing_content")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Futa item. */
export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from("landing_content").delete().eq("id", id);
  if (error) throw error;
}

/** Badilisha mpangilio (sort_order) wa item, kwa drag-and-drop au move up/down. */
export async function reorderContent(
  id: string,
  sort_order: number
): Promise<void> {
  const { error } = await supabase
    .from("landing_content")
    .update({ sort_order })
    .eq("id", id);

  if (error) throw error;
}

/** Washa/zima item bila kuifuta (soft toggle inayoonekana kwenye landing page). */
export async function toggleActive(
  id: string,
  is_active: boolean
): Promise<void> {
  const { error } = await supabase
    .from("landing_content")
    .update({ is_active })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Pata picha za hero carousel pekee, zikiwa active na kwa mpangilio.
 * Inatumika na LandingPage.tsx moja kwa moja (public, hauhitaji login).
 */
export async function getHeroCarouselImages(): Promise<LandingContentItem[]> {
  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .eq("section", "hero_carousel")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
