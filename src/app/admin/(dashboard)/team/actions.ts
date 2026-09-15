"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  bool,
  Errors,
  errorState,
  isValidHref,
  isValidSlug,
  localised,
  localisedList,
  slugify,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import {
  createTeamMember,
  deleteTeamMember,
  moveTeamMember,
  teamSlugAvailable,
  updateTeamMember,
  type TeamMemberInput,
} from "@/lib/db/repos/team";
import { asUuid } from "@/lib/db/sql";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/** Team mutations. The public site's team section reads the same rows. */

const SOCIAL_FIELDS = ["instagram", "facebook", "linkedin", "tiktok"] as const;

async function readForm(
  formData: FormData,
  exceptId?: string,
): Promise<{ ok: true; input: TeamMemberInput } | { ok: false; state: ActionState }> {
  const dict = getAdminDictionary(await getAdminLocale());
  const errors = new Errors();

  const name = str(formData, "name", 160);
  const slugInput = str(formData, "slug", 80);
  const slug = slugInput === "" ? slugify(name) : slugInput;

  errors.require("name", name, dict);

  if (slug === "") {
    errors.add("slug", dict.errors.required);
  } else if (!isValidSlug(slug)) {
    errors.add("slug", dict.errors.invalidSlug);
  } else if (!(await teamSlugAvailable(slug, exceptId))) {
    errors.add("slug", dict.errors.slugTaken);
  }

  /* Social links end up as hrefs on the public site, so a `javascript:` URL
     saved here would run in every visitor's browser. */
  const socials: Record<string, string> = {};
  for (const field of SOCIAL_FIELDS) {
    const value = str(formData, `socials.${field}`, 300);
    if (value === "") continue;
    if (!isValidHref(value)) {
      errors.add(`socials.${field}`, dict.errors.invalidUrl);
      continue;
    }
    socials[field] = value;
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      name,
      slug,
      role: localised(formData, "role", 200),
      bio: localised(formData, "bio", 4000),
      qualifications: localisedList(formData, "qualifications"),
      specialties: localisedList(formData, "specialties"),
      photoId: asUuid(formData.get("photoId")),
      socials,
      isActive: bool(formData, "isActive"),
    },
  };
}

export async function createTeamMemberAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createTeamMember(parsed.input);
  refreshPublic(PUBLIC_TAGS.team);
  redirect(`/team/${id}?notice=saved`);
}

export async function updateTeamMemberAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData, id);
  if (!parsed.ok) return parsed.state;

  await updateTeamMember(id, parsed.input);
  refreshPublic(PUBLIC_TAGS.team);
  redirect(`/team/${id}?notice=saved`);
}

export async function moveTeamMemberAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveTeamMember(id, direction);
    refreshPublic(PUBLIC_TAGS.team);
  }
  redirect("/team");
}

export async function deleteTeamMemberAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteTeamMember(id);
    refreshPublic(PUBLIC_TAGS.team);
  }
  redirect("/team?notice=deleted");
}
