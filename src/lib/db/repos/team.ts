import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, nextPosition, reorderRow, slugAvailable } from "@/lib/db/sql";
import type { LocalisedList, LocalisedValue, TeamMemberRow } from "@/lib/db/types";

/**
 * The clinical team, as the public website's team section lists them.
 *
 * The list is short by nature — one clinic's dentists — so it is never paged.
 */

const SELECT = `
  id, name, slug, role, bio, qualifications, specialties,
  photo_id::text as photo_id, socials, is_active, position, created_at, updated_at
`;

export async function listTeam(): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow>(
    `select ${SELECT} from team_member order by position asc, created_at asc`,
  );
}

export async function activeTeam(): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow>(
    `select ${SELECT} from team_member where is_active = true
      order by position asc, created_at asc`,
  );
}

export async function getTeamMember(id: string): Promise<TeamMemberRow | null> {
  return queryOne<TeamMemberRow>(`select ${SELECT} from team_member where id = $1`, [id]);
}

export async function teamCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from team_member",
  );
  return Number(row?.count ?? 0);
}

export type TeamMemberInput = {
  name: string;
  slug: string;
  role: LocalisedValue;
  bio: LocalisedValue;
  qualifications: LocalisedList;
  specialties: LocalisedList;
  photoId: string | null;
  socials: Record<string, string>;
  isActive: boolean;
};

export async function createTeamMember(input: TeamMemberInput): Promise<string> {
  const position = await nextPosition("team_member");

  const row = await queryOne<{ id: string }>(
    `insert into team_member (
       name, slug, role, bio, qualifications, specialties, photo_id, socials,
       is_active, position
     ) values (
       $1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::uuid, $8::jsonb, $9, $10
     ) returning id`,
    [
      input.name,
      input.slug,
      json(input.role),
      json(input.bio),
      json(input.qualifications),
      json(input.specialties),
      input.photoId,
      json(input.socials),
      input.isActive,
      position,
    ],
  );

  return row?.id ?? "";
}

export async function updateTeamMember(id: string, input: TeamMemberInput): Promise<void> {
  await execute(
    `update team_member set
       name = $2, slug = $3, role = $4::jsonb, bio = $5::jsonb,
       qualifications = $6::jsonb, specialties = $7::jsonb,
       photo_id = $8::uuid, socials = $9::jsonb, is_active = $10,
       updated_at = now()
     where id = $1`,
    [
      id,
      input.name,
      input.slug,
      json(input.role),
      json(input.bio),
      json(input.qualifications),
      json(input.specialties),
      input.photoId,
      json(input.socials),
      input.isActive,
    ],
  );
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  return deleteById("team_member", id);
}

export async function moveTeamMember(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("team_member", id, direction);
}

export async function teamSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  return slugAvailable("team_member", slug, exceptId);
}

export async function teamOptions(): Promise<{ id: string; name: string }[]> {
  return query<{ id: string; name: string }>(
    "select id, name from team_member where is_active = true order by position asc, created_at asc",
  );
}
