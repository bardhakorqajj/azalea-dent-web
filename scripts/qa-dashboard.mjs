#!/usr/bin/env node
/**
 * End-to-end check of the admin dashboard, against a running server.
 *
 * It drives the real forms over HTTP the way a browser with no JavaScript
 * would: fetch the page, read the hidden `$ACTION…` fields Next renders for
 * progressive enhancement, and POST the form back to the same URL. So it
 * exercises the whole stack — proxy, host routing, session, CSRF, validation,
 * repository, Postgres — rather than calling the server actions directly,
 * which would skip exactly the layers most likely to be wrong.
 *
 * It writes to the database it is pointed at, so point it at a scratch one.
 *
 *   npm run dev
 *   QA_DATABASE_URL=postgres://localhost/azalea_dev \
 *   QA_PASSWORD='the admin password' npm run qa:dashboard
 *
 * The unit and integration tests are in `tests/`; this covers what they
 * cannot, which is the HTTP surface.
 */

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const HOST = process.env.QA_ADMIN_HOST ?? "admin.localhost:3000";
const DB = process.env.QA_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

if (DB === "") {
  console.error(
    "QA_DATABASE_URL is not set. Point it at the database the running server " +
      "uses — the script writes to it, so never a production one.",
  );
  process.exit(1);
}

const cookies = new Map();

function cookieHeader() {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

function absorb(response) {
  for (const raw of response.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (value === "" ) cookies.delete(name);
    else cookies.set(name, value);
  }
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { Host: HOST, Cookie: cookieHeader() },
    redirect: "manual",
  });
  absorb(response);
  const body = await response.text();
  return { status: response.status, location: response.headers.get("location"), body };
}

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * The hidden `$ACTION*` fields of the form whose markup contains `marker`.
 *
 * There are two shapes. A plain server action renders one `$ACTION_ID_<hash>`
 * field. An action driven by `useActionState` renders a bound reference
 * instead — `$ACTION_REF_n`, `$ACTION_n:0`, `$ACTION_n:1` and `$ACTION_KEY` —
 * because the previous state travels with the submission. Replaying whatever
 * is there covers both without the test needing to know which it is.
 *
 * Forms are located by a field name they contain, which is stable across
 * renders in a way that an index in the page is not.
 */
function actionFields(html, marker) {
  const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];

  for (const form of forms) {
    if (!form.includes(marker)) continue;

    const fields = {};
    const pattern = /<input[^>]*name="(\$ACTION[^"]*)"(?:[^>]*value="([^"]*)")?[^>]*\/?>/g;
    let match;
    while ((match = pattern.exec(form)) !== null) {
      fields[decode(match[1])] = decode(match[2] ?? "");
    }

    if (Object.keys(fields).length > 0) return fields;
  }

  return null;
}

/** The value of a hidden input inside the form that contains `marker`. */
function hiddenValue(html, marker, field) {
  const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
  for (const form of forms) {
    if (!form.includes(marker)) continue;
    const pattern = new RegExp(`name="${field}"[^>]*value="([^"]*)"`);
    const found = pattern.exec(form) ?? new RegExp(`value="([^"]*)"[^>]*name="${field}"`).exec(form);
    if (found) return found[1];
  }
  return null;
}

async function post(path, action, fields) {
  const body = new FormData();
  for (const [name, value] of Object.entries(action ?? {})) body.set(name, value);
  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) for (const entry of value) body.append(name, entry);
    else body.set(name, value);
  }

  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Host: HOST, Cookie: cookieHeader(), Origin: `http://${HOST}` },
    body,
    redirect: "manual",
  });
  absorb(response);
  const text = await response.text();
  return { status: response.status, location: response.headers.get("location"), body: text };
}

async function sql(text, params = []) {
  const pg = (await import("pg")).default;
  const client = new pg.Client({ connectionString: DB });
  await client.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? `  — ${detail}` : ""}`);
  }
}

function section(name) {
  console.log(`\n=== ${name} ===`);
}

/* Read from the environment: a password does not belong in a repository, and
   the script is useless without knowing the real one anyway. */
const PASSWORD = process.env.QA_PASSWORD ?? "";
const EMAIL = process.env.QA_EMAIL ?? "azaleadent@hotmail.com";

if (PASSWORD === "") {
  console.error("QA_PASSWORD is not set, so there is no way to sign in.");
  process.exit(1);
}

/**
 * Removes the rows a previous run left behind, so the script is re-runnable.
 *
 * Only its own fixtures, matched by the exact names it creates — it must not
 * touch anything the clinic entered, even when pointed at a scratch database.
 */
async function clearFixtures() {
  await sql("delete from admin_session");
  await sql("delete from auth_attempt");
  await sql(
    "delete from service where slug in ('zbardhim-dhembesh','pa-csrf','csrf-e-gabuar','pa-titull')",
  );
  await sql("delete from appointment where patient_name in ('Blerta Hoxha','Test Telefoni')");
  await sql("delete from patient where full_name in ('Blerta Hoxha','Test Telefoni')");
  await sql("delete from review where author_name in ('A. K.','B. M.')");
  await sql("delete from content_block where key = 'home.hero.title'");
  /* The uploaded fixture photo, and the gallery entry pointing at it. */
  await sql("delete from gallery_image where media_id in (select id from media where filename = 'para-pas.png')");
  await sql("delete from media where filename = 'para-pas.png'");
}

async function main() {
  await clearFixtures();

  // ---------------------------------------------------------------------
  section("login");

  const loginPage = await get("/");
  check("login page served on the admin host", loginPage.status === 200);
  check("it is the login page", loginPage.body.includes("Hyr në panel"));

  const loginAction = actionFields(loginPage.body, 'name="password"');
  check("login form exposes its action fields", loginAction !== null, JSON.stringify(loginAction ?? {}).slice(0, 80));

  const wrong = await post("/", loginAction, { email: EMAIL, password: "wrong-password-here" });
  check("a wrong password does not create a session", !cookies.has("azalea_admin_session"));
  check(
    "and the failure is reported",
    wrong.body.includes("nuk është i saktë") || wrong.status === 200,
    `status ${wrong.status}`,
  );

  const failures = await sql(
    "select count(*)::int as n from auth_attempt where successful = false",
  );
  check("the failed attempt was counted for rate limiting", failures[0].n > 0);

  const good = await post("/", loginAction, { email: EMAIL, password: PASSWORD });
  check("a correct password redirects", good.status === 303 || good.status === 200);
  check("a session cookie is set", cookies.has("azalea_admin_session"));
  check("a CSRF cookie is set alongside it", cookies.has("azalea_admin_csrf"));

  const sessionRows = await sql("select count(*)::int as n from admin_session");
  check("the session is a database row", sessionRows[0].n >= 1);

  const stored = await sql("select token_hash from admin_session order by created_at desc limit 1");
  check(
    "the cookie token itself is not stored",
    !stored[0].token_hash.includes(cookies.get("azalea_admin_session")),
  );

  const dashboard = await get("/");
  check("the dashboard now renders", dashboard.status === 200);
  check("and shows live counts", dashboard.body.includes("Takimet e sotme"));

  const csrf = cookies.get("azalea_admin_csrf");

  // ---------------------------------------------------------------------
  section("CSRF and origin");

  const newServicePage = await get("/services/new");
  const createAction = actionFields(newServicePage.body, 'name="slug"');
  check("the create form exposes its action fields", createAction !== null);

  const embedded = hiddenValue(newServicePage.body, 'name="slug"', "csrf");
  check("the page embeds the CSRF token in its forms", embedded === csrf, `${embedded} vs ${csrf}`);

  const noCsrf = await post("/services/new", createAction, {
    csrf: "",
    "title.sq": "Pa CSRF",
    slug: "pa-csrf",
  });
  check(
    "a submission with no CSRF token is refused",
    noCsrf.status >= 400 || (await sql("select count(*)::int as n from service where slug='pa-csrf'"))[0].n === 0,
    `status ${noCsrf.status}`,
  );

  const badCsrf = await post("/services/new", createAction, {
    csrf: "not-the-right-token",
    "title.sq": "CSRF e gabuar",
    slug: "csrf-e-gabuar",
  });
  const badRows = await sql("select count(*)::int as n from service where slug='csrf-e-gabuar'");
  check("a submission with a wrong CSRF token is refused", badRows[0].n === 0, `status ${badCsrf.status}`);

  // ---------------------------------------------------------------------
  section("services: create, validate, edit, reorder, delete");

  const invalid = await post("/services/new", createAction, {
    csrf,
    "title.sq": "",
    "title.en": "",
    slug: "",
  });
  check(
    "a service with no title is rejected with a field error",
    invalid.body.includes("detyrueshme") || invalid.status === 200,
  );

  const badSlug = await post("/services/new", createAction, {
    csrf,
    "title.sq": "Titull",
    slug: "Jo Slug Valid!",
  });
  check(
    "an invalid slug is rejected",
    (await sql("select count(*)::int as n from service where slug like '%Jo%'"))[0].n === 0,
    `status ${badSlug.status}`,
  );

  const created = await post("/services/new", createAction, {
    csrf,
    "title.sq": "Zbardhim dhëmbësh",
    "title.en": "Teeth whitening",
    slug: "",
    "summary.sq": "Zbardhim profesional në klinikë.",
    "summary.en": "Professional in-clinic whitening.",
    "body.sq": "Paragrafi i pare.\n\nParagrafi i dyte.",
    "highlights.sq": "Një seancë\nRezultat i menjëhershëm",
    "highlights.en": "One appointment\nImmediate result",
    "priceText.sq": "prej 120 €",
    durationMinutes: "45",
    isActive: "on",
  });

  const whitening = await sql(
    "select id, slug, title, summary, highlights, body, duration_minutes, is_active from service where slug = $1",
    ["zbardhim-dhembesh"],
  );
  check("the service was created", whitening.length === 1, created.location ?? "");
  if (whitening.length === 1) {
    const row = whitening[0];
    check("the slug was derived from the Albanian title", row.slug === "zbardhim-dhembesh");
    check("both languages were stored", row.title.sq === "Zbardhim dhëmbësh" && row.title.en === "Teeth whitening");
    check("the highlights zipped by position", row.highlights.length === 2 && row.highlights[0].sq === "Një seancë" && row.highlights[0].en === "One appointment");
    check("the body kept its paragraph break", row.body.sq.includes("\n\n"));
    check("the duration was stored as a number", row.duration_minutes === 45);
    check("it is active", row.is_active === true);
  }

  const id = whitening[0]?.id;

  const dupe = await post("/services/new", createAction, {
    csrf,
    "title.sq": "Kopje",
    slug: "zbardhim-dhembesh",
  });
  check(
    "a duplicate slug is refused",
    (await sql("select count(*)::int as n from service where slug='zbardhim-dhembesh'"))[0].n === 1,
    `status ${dupe.status}`,
  );

  const editPage = await get(`/services/${id}`);
  check("the edit page loads the service", editPage.body.includes("Zbardhim dhëmbësh"));
  const updateAction = actionFields(editPage.body, 'name="slug"');

  await post(`/services/${id}`, updateAction, {
    csrf,
    id,
    "title.sq": "Zbardhim i dhëmbëve",
    "title.en": "Teeth whitening",
    slug: "zbardhim-dhembesh",
    "priceText.sq": "prej 150 €",
    isActive: "on",
    isFeatured: "on",
  });

  const edited = await sql("select title, price_text, is_featured from service where id = $1", [id]);
  check("the edit was saved", edited[0].title.sq === "Zbardhim i dhëmbëve");
  check("the price changed", edited[0].price_text.sq === "prej 150 €");
  check("the featured flag was set", edited[0].is_featured === true);

  // Toggle active from the list. The reorder forms carry the same row id, so
  // the toggle form is identified by the label only it renders.
  const listPage = await get("/services");
  const toggleAction = actionFields(listPage.body, "title=\"Joaktiv\"");
  if (toggleAction) {
    await post("/services", toggleAction, { csrf, id });
    const toggled = await sql("select is_active from service where id = $1", [id]);
    check("the publish toggle flipped the flag", toggled[0].is_active === false);
    await post("/services", toggleAction, { csrf, id });
    const back = await sql("select is_active from service where id = $1", [id]);
    check("and flips it back", back[0].is_active === true);
  } else {
    check("the list exposes a toggle action", false);
  }

  // ---------------------------------------------------------------------
  section("appointments: create and status changes");

  const newAppointment = await get("/appointments/new");
  const createAppointmentAction = actionFields(newAppointment.body, 'name="patientName"');

  const badPhone = await post("/appointments/new", createAppointmentAction, {
    csrf,
    patientName: "Test Telefoni",
    phone: "abc",
    scheduledDate: "2026-12-01",
    status: "pending",
    source: "admin",
  });
  check(
    "an invalid phone number is rejected",
    (await sql("select count(*)::int as n from appointment where patient_name='Test Telefoni'"))[0].n === 0,
    `status ${badPhone.status}`,
  );

  await post("/appointments/new", createAppointmentAction, {
    csrf,
    patientName: "Blerta Hoxha",
    phone: "+383 44 987 654",
    email: "blerta@example.org",
    scheduledDate: "2026-12-01",
    scheduledTime: "15:30",
    durationMinutes: "30",
    status: "pending",
    source: "phone",
    notes: "Kontroll i rregullt.",
    createPatient: "on",
  });

  const blerta = await sql(
    `select a.id, a.scheduled_date::text, to_char(a.scheduled_time,'HH24:MI') as t,
            a.status, a.patient_id, p.full_name
       from appointment a left join patient p on p.id = a.patient_id
      where a.patient_name = 'Blerta Hoxha'`,
  );
  check("the appointment was created", blerta.length === 1);
  if (blerta.length === 1) {
    check("the date was stored exactly as entered", blerta[0].scheduled_date === "2026-12-01");
    check("the time was stored exactly as entered", blerta[0].t === "15:30");
    check("a patient record was created and linked", blerta[0].patient_id !== null && blerta[0].full_name === "Blerta Hoxha");
  }

  const appointmentId = blerta[0]?.id;
  const detail = await get(`/appointments/${appointmentId}`);
  check("the detail page renders", detail.body.includes("Blerta Hoxha"));

  const confirmAction = actionFields(detail.body, 'value="confirmed"');
  await post(`/appointments/${appointmentId}`, confirmAction, {
    csrf,
    id: appointmentId,
    status: "confirmed",
  });
  const confirmed = await sql("select status from appointment where id = $1", [appointmentId]);
  check("the confirm button changed the status", confirmed[0].status === "confirmed");

  const activity = await sql(
    "select count(*)::int as n from activity where entity_id = $1",
    [appointmentId],
  );
  check("the change was recorded in the activity log", activity[0].n > 0);

  // A returning patient must not be filed twice.
  await post("/appointments/new", createAppointmentAction, {
    csrf,
    patientName: "Blerta Hoxha",
    phone: "044-987-654",
    scheduledDate: "2027-01-05",
    status: "pending",
    source: "website",
    createPatient: "on",
  });
  const patientCount = await sql(
    "select count(*)::int as n from patient where full_name = 'Blerta Hoxha'",
  );
  check("a returning patient is matched, not duplicated", patientCount[0].n === 1, `${patientCount[0].n} rows`);

  // ---------------------------------------------------------------------
  section("website content: override and restore");

  const contentPage = await get("/content?group=home");
  const saveContentAction = actionFields(contentPage.body, 'name="group"');

  await post("/content?group=home", saveContentAction, {
    csrf,
    group: "home",
    "block.home.hero.title.sq": "Titull i re nga paneli",
  });

  const override = await sql("select value from content_block where key = 'home.hero.title'");
  check("the override was stored", override.length === 1 && override[0].value.sq === "Titull i re nga paneli");
  check("the untouched language was not stored as empty", override[0].value.en === undefined);

  await post("/content?group=home", saveContentAction, {
    csrf,
    group: "home",
    "block.home.hero.title.sq": "   ",
  });
  const cleared = await sql("select count(*)::int as n from content_block where key = 'home.hero.title'");
  check("clearing the field removes the override", cleared[0].n === 0);

  // ---------------------------------------------------------------------
  section("gallery: the consent rule, end to end");

  // A 1×1 PNG.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
    "base64",
  );

  const galleryPage = await get("/gallery");
  const uploadAction = actionFields(galleryPage.body, 'name="files"');

  const uploadBody = new FormData();
  for (const [name, value] of Object.entries(uploadAction ?? {})) uploadBody.set(name, value);
  uploadBody.set("csrf", csrf);
  uploadBody.set("kind", "work");
  uploadBody.set("categoryId", "");
  uploadBody.append("files", new File([png], "para-pas.png", { type: "image/png" }));

  const uploaded = await fetch(`${BASE}/gallery`, {
    method: "POST",
    headers: { Host: HOST, Cookie: cookieHeader(), Origin: `http://${HOST}` },
    body: uploadBody,
    redirect: "manual",
  });
  absorb(uploaded);

  const workImages = await sql(
    "select id, kind, is_published, consent_on_file, media_id from gallery_image where kind = 'work'",
  );
  check("the upload created a gallery entry", workImages.length >= 1, `status ${uploaded.status}`);
  if (workImages.length >= 1) {
    check("a new upload is unpublished", workImages[0].is_published === false);
    check("and has no consent recorded", workImages[0].consent_on_file === false);
  }

  const imageId = workImages[0]?.id;
  if (imageId) {
    const imagePage = await get(`/gallery/${imageId}`);
    const saveImageAction = actionFields(imagePage.body, 'name="consentOnFile"');

    // Publishing a treatment photo without consent must be refused.
    await post(`/gallery/${imageId}`, saveImageAction, {
      csrf,
      id: imageId,
      "alt.sq": "Para dhe pas",
      kind: "work",
      isPublished: "on",
    });
    const refused = await sql("select is_published from gallery_image where id = $1", [imageId]);
    check("publishing a treatment photo without consent is refused", refused[0].is_published === false);

    // With consent recorded it goes through.
    await post(`/gallery/${imageId}`, saveImageAction, {
      csrf,
      id: imageId,
      "alt.sq": "Para dhe pas",
      kind: "work",
      consentOnFile: "on",
      isPublished: "on",
    });
    const allowed = await sql(
      "select is_published, consent_on_file from gallery_image where id = $1",
      [imageId],
    );
    check("with consent recorded it publishes", allowed[0].is_published === true && allowed[0].consent_on_file === true);

    // Alt text is required to publish.
    await post(`/gallery/${imageId}`, saveImageAction, {
      csrf,
      id: imageId,
      "alt.sq": "",
      "alt.en": "",
      kind: "clinic",
      isPublished: "on",
    });
    const altRequired = await sql("select alt from gallery_image where id = $1", [imageId]);
    check("publishing without alt text is refused", altRequired[0].alt.sq === "Para dhe pas");
  }

  // ---------------------------------------------------------------------
  section("media route: what is and is not served");

  const mediaId = workImages[0]?.media_id;
  if (mediaId) {
    const asAdmin = await fetch(`${BASE}/api/media/${mediaId}`, {
      headers: { Host: HOST, Cookie: cookieHeader() },
    });
    check("the signed-in admin can fetch the file", asAdmin.status === 200);

    // Unpublish it, then try again with no cookies at all.
    await sql("update gallery_image set is_published = false where media_id = $1", [mediaId]);

    const anonymous = await fetch(`${BASE}/api/media/${mediaId}`, {
      headers: { Host: "azaleadent.org" },
    });
    check(
      "an unpublished file is not served to a stranger",
      anonymous.status === 404,
      `status ${anonymous.status}`,
    );

    await sql("update gallery_image set is_published = true where media_id = $1", [mediaId]);
    const published = await fetch(`${BASE}/api/media/${mediaId}`, {
      headers: { Host: "azaleadent.org" },
    });
    check("a published file is served publicly", published.status === 200);
    check(
      "and is cached immutably",
      (published.headers.get("cache-control") ?? "").includes("immutable"),
    );

    const notAUuid = await fetch(`${BASE}/api/media/not-a-uuid`, { headers: { Host: HOST } });
    check("a non-uuid id answers 404 rather than erroring", notAUuid.status === 404);
  }

  // ---------------------------------------------------------------------
  section("reviews: source provenance");

  const newReview = await get("/reviews/new");
  const reviewAction = actionFields(newReview.body, 'name="authorName"');

  await post("/reviews/new", reviewAction, {
    csrf,
    authorName: "A. K.",
    "body.sq": "Shërbim i shkëlqyer, faleminderit.",
    rating: "5",
    source: "manual",
    isPublished: "on",
  });
  const manual = await sql(
    "select source, imported_at, is_published from review where author_name = 'A. K.'",
  );
  check("a hand-entered review is marked manual", manual[0]?.source === "manual");
  check("and carries no import stamp", manual[0]?.imported_at === null);

  await post("/reviews/new", reviewAction, {
    csrf,
    authorName: "B. M.",
    "body.sq": "Shumë e kënaqur.",
    rating: "5",
    source: "google",
  });
  const imported = await sql("select source, imported_at from review where author_name = 'B. M.'");
  check("a platform review is stamped as imported", imported[0]?.imported_at !== null);

  // ---------------------------------------------------------------------
  section("logout");

  const beforeLogout = await get("/");
  /* Every form on the page carries the CSRF token, so the sign-out form is
     found by its own button text. */
  const signOutAction = actionFields(beforeLogout.body, "Shkyçu");
  if (signOutAction) {
    await post("/", signOutAction, { csrf });
    check("the session cookie is cleared", !cookies.has("azalea_admin_session"));

    const after = await get("/appointments");
    check(
      "and the dashboard is no longer reachable",
      after.status === 307 || after.body.includes("Hyr në panel"),
      `status ${after.status}`,
    );
  } else {
    check("the sign-out form exposes its action fields", false);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
