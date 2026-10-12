import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  autoPublishEnabled,
  buildCaption,
  instagramConfig,
  publishToInstagram,
} from "@/lib/social/instagram";

/**
 * The automatic Instagram posting path.
 *
 * Two things are worth testing here above all else, and both are about not
 * lying to the clinic: a post is never recorded as published unless Instagram
 * said it was, and nothing is published at all unless a person approved it and
 * the scheduler itself called.
 */

const ORIGINAL_ENV = { ...process.env };

const CONFIG = { igUserId: "17841400000000000", accessToken: "EAAG-test-token" };

/** A partial environment, as the readers under test receive it. */
function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as unknown as NodeJS.ProcessEnv;
}

/** Mocks, shared with the route under test. */
const db = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(() => true),
  nextPublishablePost: vi.fn(),
  blockedApprovedCount: vi.fn(async () => 0),
  markSending: vi.fn(async (_id: string) => {}),
  markPublished: vi.fn(async (_id: string, _url: string | null) => {}),
  markFailed: vi.fn(async (_id: string, _reason: string) => {}),
  logActivity: vi.fn(async () => {}),
}));

vi.mock("@/lib/db/client", () => ({ isDatabaseConfigured: db.isDatabaseConfigured }));
vi.mock("@/lib/db/repos/social", () => ({
  nextPublishablePost: db.nextPublishablePost,
  blockedApprovedCount: db.blockedApprovedCount,
  markSending: db.markSending,
  markPublished: db.markPublished,
  markFailed: db.markFailed,
}));
vi.mock("@/lib/db/repos/activity", () => ({ logActivity: db.logActivity }));

const { GET } = await import("@/app/api/cron/social/route");

function cronRequest(secret?: string) {
  return new Request("https://admin.example.test/api/cron/social", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

function post(overrides: Record<string, unknown> = {}) {
  return {
    id: "4a0f7a4e-0000-4000-8000-000000000001",
    platform: "instagram",
    headline: "Implante dentare",
    caption: "Një buzëqeshje e re në një vizitë.",
    hashtags: ["#implante", "#prishtine"],
    media_id: "9b1f7a4e-0000-4000-8000-000000000002",
    status: "approved",
    ...overrides,
  };
}

/** A fetch stub that answers the container, publish and permalink calls. */
function graphStub(
  answers: { status?: number; body: unknown }[],
): ReturnType<typeof vi.fn> {
  const calls = [...answers];
  return vi.fn(async () => {
    const next = calls.shift() ?? { body: {} };
    return new Response(JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

beforeEach(() => {
  for (const key of ["CRON_SECRET", "META_IG_USER_ID", "META_ACCESS_TOKEN", "RESEND_API_KEY"]) {
    delete process.env[key];
  }
  process.env.SITE_URL = "https://example.test";
  db.isDatabaseConfigured.mockReturnValue(true);
  db.nextPublishablePost.mockResolvedValue(null);
  db.blockedApprovedCount.mockResolvedValue(0);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("buildCaption", () => {
  it("returns the caption alone when there are no hashtags", () => {
    expect(buildCaption("  Mirë se vini.  ", [])).toBe("Mirë se vini.");
  });

  it("puts the hashtags after a blank line and adds the missing #", () => {
    expect(buildCaption("Kontroll falas", ["implante", "#prishtine"])).toBe(
      "Kontroll falas\n\n#implante #prishtine",
    );
  });

  it("drops empty tags rather than emitting a bare #", () => {
    expect(buildCaption("Tekst", ["", "  ", "ortodonci"])).toBe("Tekst\n\n#ortodonci");
  });
});

describe("instagramConfig", () => {
  it("is null when either value is missing or blank", () => {
    expect(instagramConfig(env({}))).toBeNull();
    expect(instagramConfig(env({ META_IG_USER_ID: "123", META_ACCESS_TOKEN: "  " }))).toBeNull();
    expect(instagramConfig(env({ META_IG_USER_ID: " ", META_ACCESS_TOKEN: "tok" }))).toBeNull();
  });

  it("trims what it reads", () => {
    expect(
      instagramConfig(env({ META_IG_USER_ID: " 123 ", META_ACCESS_TOKEN: " tok\n" })),
    ).toEqual({ igUserId: "123", accessToken: "tok" });
  });
});

describe("autoPublishEnabled", () => {
  const creds = { META_IG_USER_ID: "123", META_ACCESS_TOKEN: "tok" };

  it("needs the credentials and the cron secret together", () => {
    expect(autoPublishEnabled(env(creds))).toBe(false);
    expect(autoPublishEnabled(env({ CRON_SECRET: "s3cret" }))).toBe(false);
    expect(autoPublishEnabled(env({ ...creds, CRON_SECRET: "s3cret" }))).toBe(true);
  });
});

describe("publishToInstagram", () => {
  it("creates a container, publishes it and reads the permalink back", async () => {
    const fetchMock = graphStub([
      { body: { id: "container-1" } },
      { body: { id: "media-1" } },
      { body: { permalink: "https://www.instagram.com/p/abc/" } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishToInstagram({
      config: CONFIG,
      imageUrl: "https://example.test/api/media/1",
      caption: "Tekst",
    });

    expect(result).toEqual({
      ok: true,
      mediaId: "media-1",
      permalink: "https://www.instagram.com/p/abc/",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    /* The token is a credential: it travels in the POST body, never in a URL
       that ends up in an access log. */
    const [containerUrl, containerInit] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(containerUrl.toString()).toContain(`/v21.0/${CONFIG.igUserId}/media`);
    expect(containerUrl.toString()).not.toContain(CONFIG.accessToken);
    expect(String(containerInit.body)).toContain("access_token=");
  });

  it("passes Instagram's own wording back when it refuses", async () => {
    vi.stubGlobal(
      "fetch",
      graphStub([
        {
          status: 400,
          body: { error: { message: "The image is not accessible", code: 9004 } },
        },
      ]),
    );

    const result = await publishToInstagram({
      config: CONFIG,
      imageUrl: "https://example.test/api/media/1",
      caption: "Tekst",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("The image is not accessible");
      expect(result.reason).toContain("9004");
    }
  });

  it("still counts as published when only the permalink read fails", async () => {
    vi.stubGlobal(
      "fetch",
      graphStub([
        { body: { id: "container-1" } },
        { body: { id: "media-1" } },
        { status: 500, body: { error: { message: "transient" } } },
      ]),
    );

    const result = await publishToInstagram({
      config: CONFIG,
      imageUrl: "https://example.test/api/media/1",
      caption: "Tekst",
    });

    expect(result).toEqual({ ok: true, mediaId: "media-1", permalink: null });
  });

  it("does not report success when no container id comes back", async () => {
    vi.stubGlobal("fetch", graphStub([{ body: {} }]));

    const result = await publishToInstagram({
      config: CONFIG,
      imageUrl: "https://example.test/api/media/1",
      caption: "Tekst",
    });

    expect(result.ok).toBe(false);
  });
});

describe("GET /api/cron/social", () => {
  it("refuses every caller when no cron secret is configured", async () => {
    const response = await GET(cronRequest("anything"));
    expect(response.status).toBe(401);
    expect(db.nextPublishablePost).not.toHaveBeenCalled();
  });

  it("refuses a wrong secret and an absent header", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await GET(cronRequest("wrong-secret"))).status).toBe(401);
    expect((await GET(cronRequest())).status).toBe(401);
    expect(db.nextPublishablePost).not.toHaveBeenCalled();
  });

  it("says which kind of nothing it found when the queue is empty", async () => {
    process.env.CRON_SECRET = "s3cret";
    db.blockedApprovedCount.mockResolvedValue(2);

    const response = await GET(cronRequest("s3cret"));
    expect(await response.json()).toEqual({
      published: false,
      reason: "queue_empty",
      blocked: 2,
    });
    expect(db.markPublished).not.toHaveBeenCalled();
  });

  it("leaves the post approved, and unpublished, when Meta is not configured", async () => {
    process.env.CRON_SECRET = "s3cret";
    db.nextPublishablePost.mockResolvedValue(post());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const body = await (await GET(cronRequest("s3cret"))).json();

    expect(body.reason).toBe("not_configured");
    expect(body.published).toBe(false);
    expect(db.markSending).not.toHaveBeenCalled();
    expect(db.markPublished).not.toHaveBeenCalled();
    expect(db.markFailed).not.toHaveBeenCalled();
    /* No email provider either, so nothing should have gone out at all. */
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publishes one post, marking it as sending before Instagram fetches the photo", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.META_IG_USER_ID = CONFIG.igUserId;
    process.env.META_ACCESS_TOKEN = CONFIG.accessToken;
    db.nextPublishablePost.mockResolvedValue(post());

    const order: string[] = [];
    db.markSending.mockImplementation(async () => void order.push("markSending"));
    const fetchMock = graphStub([
      { body: { id: "container-1" } },
      { body: { id: "media-1" } },
      { body: { permalink: "https://www.instagram.com/p/abc/" } },
    ]);
    vi.stubGlobal("fetch", (...args: unknown[]) => {
      order.push("fetch");
      return (fetchMock as (...a: unknown[]) => Promise<Response>)(...args);
    });

    const body = await (await GET(cronRequest("s3cret"))).json();

    expect(body).toEqual({
      published: true,
      postId: post().id,
      permalink: "https://www.instagram.com/p/abc/",
    });
    expect(order[0]).toBe("markSending");
    expect(db.markPublished).toHaveBeenCalledWith(
      post().id,
      "https://www.instagram.com/p/abc/",
    );
    expect(db.markFailed).not.toHaveBeenCalled();

    /* The image URL handed to Instagram has to be absolute and public. */
    const [containerUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(containerUrl.toString()).toContain("/media");
    expect(decodeURIComponent(String(init.body))).toContain(
      `image_url=https://example.test/api/media/${post().media_id}`,
    );
  });

  it("records the failure, not a publish, when Instagram refuses", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.META_IG_USER_ID = CONFIG.igUserId;
    process.env.META_ACCESS_TOKEN = CONFIG.accessToken;
    db.nextPublishablePost.mockResolvedValue(post());
    vi.stubGlobal(
      "fetch",
      graphStub([{ status: 400, body: { error: { message: "Unsupported format" } } }]),
    );

    const body = await (await GET(cronRequest("s3cret"))).json();

    expect(body.published).toBe(false);
    expect(db.markPublished).not.toHaveBeenCalled();
    expect(db.markFailed).toHaveBeenCalledTimes(1);
    expect(db.markFailed.mock.calls[0]?.[1]).toContain("Unsupported format");
    expect(db.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "social.failed" }),
    );
  });
});
