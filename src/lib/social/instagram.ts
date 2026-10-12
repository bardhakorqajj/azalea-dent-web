/**
 * Publishing a post to Instagram.
 *
 * Instagram's own API, through Meta's Graph API, and it has conditions worth
 * stating plainly because they decide whether any of this can run at all:
 *
 *   - the account must be an Instagram **Business** account, connected to a
 *     Facebook Page. A personal account has no publishing API, and Creator
 *     accounts are not reliably supported for it;
 *   - a feed post must carry an image. There is no caption-only post, so a
 *     post with no photo is never sent here;
 *   - the image is fetched *by Instagram*, from a public URL. It is not
 *     uploaded. That is why `media/[id]` treats a photo on a post that is
 *     going out as public: Meta's servers have to be able to read it.
 *
 * Publishing is two calls — build a container, then publish it — and a third
 * to read back the permalink, which is what the dashboard links to afterwards.
 *
 * Nothing here stores a password. The access token is an environment
 * variable, it belongs to the clinic's own Meta app, and it can be revoked
 * from Meta's side at any time without touching this code.
 */

/**
 * The Graph API version to call.
 *
 * Meta retires a version roughly two years after it ships, and a retired one
 * fails every call. It is an environment variable so the clinic can move to a
 * current version without a deploy, and the default is only a starting point:
 * check which versions are live in the Meta app dashboard when setting this
 * up. A version error comes back in `reason` and is shown in the dashboard
 * rather than disappearing into a log.
 */
const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";

const GRAPH = "https://graph.facebook.com";

/** Meta can be slow to fetch a large photo; it is still not allowed to hang. */
const TIMEOUT_MS = 30_000;

export type InstagramConfig = {
  igUserId: string;
  accessToken: string;
};

/**
 * The credentials, or null when automatic publishing is not set up.
 *
 * Null is a normal state, not an error: until the clinic has a Meta app the
 * scheduler emails the post instead of publishing it, and the dashboard says
 * which of the two is happening.
 */
export function instagramConfig(env: NodeJS.ProcessEnv = process.env): InstagramConfig | null {
  const igUserId = env.META_IG_USER_ID?.trim() ?? "";
  const accessToken = env.META_ACCESS_TOKEN?.trim() ?? "";
  if (igUserId === "" || accessToken === "") return null;
  return { igUserId, accessToken };
}

export type PublishResult =
  | { ok: true; permalink: string | null; mediaId: string }
  | { ok: false; reason: string };

/** Meta's error body, which carries a message worth showing the clinic. */
type GraphError = {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
};

/**
 * One Graph call, as a form POST or a GET.
 *
 * The token goes in the body rather than the query string: a URL ends up in
 * access logs and error reports, and this one is a credential.
 */
async function graph(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST",
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; reason: string }> {
  const url = new URL(`${GRAPH}/${GRAPH_VERSION}/${path}`);
  const body = new URLSearchParams(params);

  if (method === "GET") {
    for (const [key, value] of body) url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      body: method === "POST" ? body : undefined,
      headers:
        method === "POST"
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Could not reach Instagram: ${detail}` };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: `Instagram answered ${response.status} with no JSON body` };
  }

  if (!response.ok) {
    const message = (payload as GraphError)?.error?.message;
    const code = (payload as GraphError)?.error?.code;
    return {
      ok: false,
      reason: message
        ? `Instagram refused it${code ? ` (${code})` : ""}: ${message}`
        : `Instagram answered ${response.status}`,
    };
  }

  return { ok: true, data: (payload ?? {}) as Record<string, unknown> };
}

/**
 * Publishes one photo with its caption.
 *
 * `imageUrl` must be reachable by Meta's servers from the public internet —
 * a preview deployment behind authentication, or a localhost address, will
 * fail here with Instagram's own wording rather than ours.
 */
export async function publishToInstagram(input: {
  config: InstagramConfig;
  imageUrl: string;
  caption: string;
}): Promise<PublishResult> {
  const { config, imageUrl, caption } = input;

  const container = await graph(
    `${config.igUserId}/media`,
    { image_url: imageUrl, caption, access_token: config.accessToken },
    "POST",
  );
  if (!container.ok) return { ok: false, reason: container.reason };

  const creationId = typeof container.data.id === "string" ? container.data.id : "";
  if (creationId === "") {
    return { ok: false, reason: "Instagram accepted the photo but returned no container id" };
  }

  const published = await graph(
    `${config.igUserId}/media_publish`,
    { creation_id: creationId, access_token: config.accessToken },
    "POST",
  );
  if (!published.ok) return { ok: false, reason: published.reason };

  const mediaId = typeof published.data.id === "string" ? published.data.id : "";
  if (mediaId === "") {
    return { ok: false, reason: "Instagram published it but returned no media id" };
  }

  /* The permalink is a convenience for the dashboard's "see it on Instagram"
     link. The post is already live by this point, so failing to read it back
     is not a failed publish — it just means no link. */
  const link = await graph(
    mediaId,
    { fields: "permalink", access_token: config.accessToken },
    "GET",
  );
  const permalink = link.ok && typeof link.data.permalink === "string" ? link.data.permalink : null;

  return { ok: true, permalink, mediaId };
}

/** The caption as Instagram receives it: the text, then the hashtags. */
export function buildCaption(caption: string, hashtags: string[]): string {
  const tags = hashtags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  if (tags.length === 0) return caption.trim();
  return `${caption.trim()}\n\n${tags.join(" ")}`;
}

/**
 * Whether a post can actually go out on its own.
 *
 * Two separate things have to be in place, and the dashboard says which is
 * missing: Meta credentials, and `CRON_SECRET`. Without the secret the
 * scheduled request is refused before it reaches the queue, so a valid token
 * on its own would still publish nothing — claiming automatic publishing was
 * on in that state would be a lie the clinic only discovers from a quiet feed.
 */
export function autoPublishEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return instagramConfig(env) !== null && (env.CRON_SECRET?.trim() ?? "") !== "";
}
