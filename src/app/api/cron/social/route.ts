import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/db/client";
import { logActivity } from "@/lib/db/repos/activity";
import {
  blockedApprovedCount,
  markFailed,
  markPublished,
  markSending,
  nextPublishablePost,
} from "@/lib/db/repos/social";
import { adminUrl } from "@/lib/admin/host";
import { resolveEmailChannel } from "@/lib/delivery";
import { absoluteUrl } from "@/lib/site";
import { buildCaption, instagramConfig, publishToInstagram } from "@/lib/social/instagram";

/**
 * The clinic's posting rhythm: one post out on Tuesday, one on Friday.
 *
 * `vercel.json` calls this on a schedule. It takes the oldest approved post
 * that is due and sends it, one per run — never a backlog in one burst, which
 * is both what Instagram's limits prefer and what a feed should look like.
 *
 * Two things it deliberately does not do. It does not write posts: if nobody
 * has approved one, Tuesday passes and nothing goes out, and the clinic is
 * told so. And it does not publish anything a person has not approved —
 * `nextPublishablePost` only ever returns `approved` rows.
 *
 * With no Meta credentials configured it emails the post that was due instead
 * of publishing it, and says in the email that automatic publishing is off.
 * It never records a post as published that was not.
 */

export const runtime = "nodejs";
/* Reads the queue and posts; there is nothing here to cache. */
export const dynamic = "force-dynamic";

/**
 * Only the scheduler may call this.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on its cron requests. With
 * no secret configured the route refuses everything rather than running open:
 * an endpoint that publishes to the clinic's Instagram is not one to leave
 * reachable by anyone who guesses the path.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret === "") return false;

  const offered = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(offered);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Emails the clinic, for the runs that could not publish. */
async function email(subject: string, lines: (string | null)[]): Promise<void> {
  const channel = resolveEmailChannel(process.env);
  if (!channel) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: channel.from,
        to: [channel.to],
        subject,
        text: lines.filter(Boolean).join("\n"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    /* Swallowed on purpose: a failing email provider must not turn a
       successful publish into a 500, and must not stop the next run. */
    console.error("Social scheduler could not send its email:", error);
  }
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "no_database" }, { status: 501 });
  }

  const post = await nextPublishablePost();

  if (!post) {
    /* Nothing to send. Say which kind of nothing it is: an empty queue and a
       queue full of posts with no photograph need different answers from the
       person reading the email. */
    const blocked = await blockedApprovedCount();
    await email(
      "Azalea Dent: asgjë për të publikuar sot",
      [
        "Erdhi radha e publikimit, por nuk kishte postim gati.",
        blocked > 0
          ? `${blocked} postim(e) janë të aprovuara por nuk mund të publikohen automatikisht — Instagram kërkon një fotografi, dhe vetëm Instagram publikohet automatikisht.`
          : "Nuk ka postime të aprovuara në radhë.",
        "",
        adminUrl("/social"),
      ],
    );
    return NextResponse.json({ published: false, reason: "queue_empty", blocked });
  }

  const config = instagramConfig();
  const caption = buildCaption(post.caption, post.hashtags as string[]);

  if (!config) {
    /* No credentials: this is the honest half of the feature. The post stays
       approved — it is not marked published, and not marked failed either,
       because nothing was attempted. It will be the one offered next time. */
    await email(`Azalea Dent: postimi i radhës për Instagram`, [
      "Publikimi automatik nuk është i konfiguruar, prandaj ky postim nuk u dërgua.",
      "Kopjojeni dhe publikojeni vetë, ose konfiguroni Meta API-n.",
      "",
      caption,
      "",
      post.media_id ? absoluteUrl(`/api/media/${post.media_id}`) : null,
    ]);
    return NextResponse.json({ published: false, reason: "not_configured", postId: post.id });
  }

  if (!post.media_id) {
    /* `nextPublishablePost` filters these out; belt and braces, because
       publishing without a photo cannot succeed. */
    return NextResponse.json({ published: false, reason: "no_image", postId: post.id });
  }

  /* Marked as going out *before* the call: that is what makes the photo
     readable by Instagram's servers. See `markSending`. */
  await markSending(post.id);

  const result = await publishToInstagram({
    config,
    imageUrl: absoluteUrl(`/api/media/${post.media_id}`),
    caption,
  });

  if (!result.ok) {
    await markFailed(post.id, result.reason);
    await logActivity({
      kind: "social.failed",
      summary: `Instagram: ${result.reason}`,
      entity: "social_post",
      entityId: post.id,
    });
    await email("Azalea Dent: postimi në Instagram dështoi", [
      "Postimi i radhës nuk u publikua.",
      "",
      result.reason,
      "",
      "Shikojeni në panel te Rrjetet sociale.",
    ]);
    return NextResponse.json({ published: false, reason: result.reason, postId: post.id });
  }

  await markPublished(post.id, result.permalink);
  await logActivity({
    kind: "social.published",
    summary: `Instagram: ${post.headline ?? caption.slice(0, 80)}`,
    entity: "social_post",
    entityId: post.id,
  });

  return NextResponse.json({
    published: true,
    postId: post.id,
    permalink: result.permalink,
  });
}
