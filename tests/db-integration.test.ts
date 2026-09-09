import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Exercises the repository layer against a real PostgreSQL database.
 *
 * These are integration tests on purpose. The repositories are almost entirely
 * SQL, and SQL is exactly the kind of code a mock cannot check: a wrong cast, a
 * `nulls last` in the wrong place or a filter that silently matches nothing all
 * typecheck perfectly. So the tests run the statements.
 *
 * They are skipped unless `TEST_DATABASE_URL` names a database they may write
 * to — every table is truncated between tests, so it must never point at
 * anything real. CI has no database and skips the whole file; to run them:
 *
 *   TEST_DATABASE_URL=postgres://localhost/azalea_test npm test
 *
 * (Create the database and run `npm run db:migrate` against it first.)
 */

const TEST_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_URL ? describe : describe.skip;

/* The repositories read DATABASE_URL through `client.ts`, so it is pointed at
   the test database before any of them are imported. */
if (TEST_URL) {
  process.env.DATABASE_URL = TEST_URL;
  process.env.PGSSLMODE = "disable";
}

type Repos = {
  client: typeof import("@/lib/db/client");
  appointments: typeof import("@/lib/db/repos/appointments");
  patients: typeof import("@/lib/db/repos/patients");
  services: typeof import("@/lib/db/repos/services");
  team: typeof import("@/lib/db/repos/team");
  treatments: typeof import("@/lib/db/repos/treatments");
  social: typeof import("@/lib/db/repos/social");
  promotions: typeof import("@/lib/db/repos/promotions");
  reviews: typeof import("@/lib/db/repos/reviews");
  gallery: typeof import("@/lib/db/repos/gallery");
  media: typeof import("@/lib/db/repos/media");
  messages: typeof import("@/lib/db/repos/messages");
  content: typeof import("@/lib/db/repos/content");
  settings: typeof import("@/lib/db/repos/settings");
  activity: typeof import("@/lib/db/repos/activity");
  status: typeof import("@/lib/db/status");
};

let repos: Repos;

/** A 1×1 PNG, so media rows can be created without a fixture file. */
const PNG_1X1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]);

/** A second, distinguishable image, so checksum de-duplication is testable. */
const PNG_2X1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x72, 0xb6, 0x0d, 0x24, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x05, 0x00,
  0x02, 0xa7, 0x3d, 0xbb, 0x8f, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

const ALL_TABLES = [
  "activity",
  "auth_attempt",
  "admin_session",
  "patient_treatment",
  "appointment",
  "gallery_image",
  "gallery_category",
  "social_post",
  "promotion",
  "review",
  "faq_item",
  "content_block",
  "setting",
  "treatment",
  "service",
  "team_member",
  "patient",
  "message",
  "media",
  "admin_account",
];

async function reset(): Promise<void> {
  await repos.client.execute(`truncate ${ALL_TABLES.join(", ")} restart identity cascade`);
}

/** Fields every service needs, so a test only states what it cares about. */
function serviceInput(
  overrides: Partial<import("@/lib/db/repos/services").ServiceInput> = {},
): import("@/lib/db/repos/services").ServiceInput {
  return {
    slug: "implante-dentare",
    title: { sq: "Implante dentare", en: "Dental implants" },
    summary: { sq: "Përmbledhje", en: "Summary" },
    body: { sq: "Paragrafi i pare.\n\nI dyti.", en: "First.\n\nSecond." },
    highlights: [{ sq: "Pika e pare", en: "First point" }],
    priceText: { sq: "prej 250 €", en: "from 250 €" },
    durationMinutes: 60,
    imageId: null,
    seoTitle: {},
    seoDescription: {},
    isActive: true,
    isFeatured: false,
    ...overrides,
  };
}

function appointmentInput(
  overrides: Partial<import("@/lib/db/repos/appointments").AppointmentInput> = {},
): import("@/lib/db/repos/appointments").AppointmentInput {
  return {
    patientId: null,
    patientName: "Arta Krasniqi",
    phone: "+383 44 111 222",
    email: "arta@example.org",
    serviceId: null,
    serviceLabel: null,
    teamMemberId: null,
    scheduledDate: "2026-11-04",
    scheduledTime: "14:30",
    timeSlot: null,
    durationMinutes: 30,
    status: "pending",
    source: "website",
    notes: null,
    internalNotes: null,
    ...overrides,
  };
}

beforeAll(async () => {
  if (!TEST_URL) return;

  repos = {
    client: await import("@/lib/db/client"),
    appointments: await import("@/lib/db/repos/appointments"),
    patients: await import("@/lib/db/repos/patients"),
    services: await import("@/lib/db/repos/services"),
    team: await import("@/lib/db/repos/team"),
    treatments: await import("@/lib/db/repos/treatments"),
    social: await import("@/lib/db/repos/social"),
    promotions: await import("@/lib/db/repos/promotions"),
    reviews: await import("@/lib/db/repos/reviews"),
    gallery: await import("@/lib/db/repos/gallery"),
    media: await import("@/lib/db/repos/media"),
    messages: await import("@/lib/db/repos/messages"),
    content: await import("@/lib/db/repos/content"),
    settings: await import("@/lib/db/repos/settings"),
    activity: await import("@/lib/db/repos/activity"),
    status: await import("@/lib/db/status"),
  };

  const status = await repos.status.databaseStatus();
  if (status.state !== "ready") {
    throw new Error(
      `TEST_DATABASE_URL is set but the database is ${status.state}. ` +
        "Run `npm run db:migrate` against it first.",
    );
  }
});

afterAll(async () => {
  if (!TEST_URL || !repos) return;
  await reset();
  await repos.client.closePool();
});

describeDb("the database schema", () => {
  it("reports itself as ready and migrated", async () => {
    const status = await repos.status.databaseStatus();
    expect(status.state).toBe("ready");
    if (status.state === "ready") expect(status.migrations).toBeGreaterThan(0);
  });
});

describeDb("services", () => {
  beforeAll(reset);

  it("round-trips every field, including the bilingual jsonb ones", async () => {
    const id = await repos.services.createService(serviceInput());
    const row = await repos.services.getService(id);

    expect(row).not.toBeNull();
    expect(row?.slug).toBe("implante-dentare");
    /* jsonb comes back as an object, not a string — which is the whole reason
       `json()` exists in sql.ts. */
    expect(row?.title).toEqual({ sq: "Implante dentare", en: "Dental implants" });
    expect(row?.highlights).toEqual([{ sq: "Pika e pare", en: "First point" }]);
    /* Rows keep the database's column names; only the write inputs are camel. */
    expect(row?.price_text).toEqual({ sq: "prej 250 €", en: "from 250 €" });
    expect(row?.duration_minutes).toBe(60);
    expect(row?.is_active).toBe(true);
  });

  it("stores an empty highlights list as a JSON array, not a Postgres array", async () => {
    const id = await repos.services.createService(
      serviceInput({ slug: "pa-pika", highlights: [] }),
    );
    const row = await repos.services.getService(id);
    expect(row?.highlights).toEqual([]);
  });

  it("finds a service by either language", async () => {
    const albanian = await repos.services.listServices({ search: "Implante" });
    const english = await repos.services.listServices({ search: "implants" });

    expect(albanian.rows.map((row) => row.slug)).toContain("implante-dentare");
    expect(english.rows.map((row) => row.slug)).toContain("implante-dentare");
  });

  it("treats a percent sign in a search as a literal, not a wildcard", async () => {
    const results = await repos.services.listServices({ search: "%" });
    expect(results.total).toBe(0);
  });

  it("hides inactive services from the public read", async () => {
    const id = await repos.services.createService(
      serviceInput({ slug: "e-fshehur", isActive: false }),
    );

    const active = await repos.services.activeServices();
    const all = await repos.services.allServices();

    expect(active.map((row) => row.id)).not.toContain(id);
    expect(all.map((row) => row.id)).toContain(id);
  });

  it("refuses a duplicate slug and reports it before the insert", async () => {
    expect(await repos.services.serviceSlugAvailable("implante-dentare")).toBe(false);
    expect(await repos.services.serviceSlugAvailable("krejt-e-re")).toBe(true);

    await expect(
      repos.services.createService(serviceInput({ slug: "implante-dentare" })),
    ).rejects.toThrow();
  });

  it("lets a service keep its own slug while being edited", async () => {
    const row = await repos.services.getServiceBySlug("implante-dentare");
    expect(row).not.toBeNull();
    expect(
      await repos.services.serviceSlugAvailable("implante-dentare", row?.id),
    ).toBe(true);
  });

  it("reorders by renumbering, so rows created together still order strictly", async () => {
    await reset();
    const first = await repos.services.createService(serviceInput({ slug: "a" }));
    const second = await repos.services.createService(serviceInput({ slug: "b" }));
    const third = await repos.services.createService(serviceInput({ slug: "c" }));

    const before = (await repos.services.allServices()).map((row) => row.slug);
    expect(before).toEqual(["a", "b", "c"]);

    await repos.services.moveService(third, "up");
    expect((await repos.services.allServices()).map((row) => row.slug)).toEqual([
      "a",
      "c",
      "b",
    ]);

    await repos.services.moveService(first, "down");
    expect((await repos.services.allServices()).map((row) => row.slug)).toEqual([
      "c",
      "a",
      "b",
    ]);

    /* Moving the first row up, or the last down, is a no-op rather than an error. */
    const order = (await repos.services.allServices()).map((row) => row.slug);
    await repos.services.moveService(second, "down");
    expect((await repos.services.allServices()).map((row) => row.slug)).toEqual(order);
  });

  it("updates in place without changing the position", async () => {
    const id = await repos.services.createService(serviceInput({ slug: "para" }));
    const before = await repos.services.getService(id);

    await repos.services.updateService(
      id,
      serviceInput({ slug: "pas", title: { sq: "Ndryshuar" }, isActive: false }),
    );

    const after = await repos.services.getService(id);
    expect(after?.slug).toBe("pas");
    expect(after?.title).toEqual({ sq: "Ndryshuar" });
    expect(after?.is_active).toBe(false);
    expect(after?.position).toBe(before?.position);
  });

  it("deletes", async () => {
    const id = await repos.services.createService(serviceInput({ slug: "fshihem" }));
    expect(await repos.services.deleteService(id)).toBe(true);
    expect(await repos.services.getService(id)).toBeNull();
    /* Deleting something already gone reports false rather than throwing. */
    expect(await repos.services.deleteService(id)).toBe(false);
  });
});

describeDb("appointments", () => {
  beforeAll(reset);

  it("keeps the date exactly as entered, with no timezone drift", async () => {
    const id = await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: "2026-01-01", scheduledTime: "00:15" }),
    );
    const row = await repos.appointments.getAppointment(id);

    /* The bug this guards against: a bare `date` parsed into a JS Date at the
       server's local midnight, which reads back as the previous day west of
       UTC. It must come back as the string that went in. */
    expect(row?.scheduled_date).toBe("2026-01-01");
    expect(row?.scheduled_time).toBe("00:15");
  });

  it("accepts a request with only a rough time preference", async () => {
    const id = await repos.appointments.createAppointment(
      appointmentInput({ scheduledTime: null, timeSlot: "morning" }),
    );
    const row = await repos.appointments.getAppointment(id);

    expect(row?.scheduled_time).toBeNull();
    expect(row?.time_slot).toBe("morning");
  });

  it("orders a day's list with unscheduled appointments after the timed ones", async () => {
    await reset();
    await repos.appointments.createAppointment(
      appointmentInput({ patientName: "No time", scheduledDate: "2026-03-02", scheduledTime: null }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ patientName: "Late", scheduledDate: "2026-03-02", scheduledTime: "18:00" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ patientName: "Early", scheduledDate: "2026-03-02", scheduledTime: "09:00" }),
    );

    const page = await repos.appointments.listAppointments({ order: "date_asc" });
    expect(page.rows.map((row) => row.patient_name)).toEqual(["Early", "Late", "No time"]);
  });

  it("filters by status and by date range together", async () => {
    await reset();
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: "2026-05-01", status: "confirmed" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: "2026-05-10", status: "pending" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: "2026-06-20", status: "confirmed" }),
    );

    const inMay = await repos.appointments.listAppointments({
      from: "2026-05-01",
      to: "2026-05-31",
    });
    expect(inMay.total).toBe(2);

    const confirmedInMay = await repos.appointments.listAppointments({
      from: "2026-05-01",
      to: "2026-05-31",
      status: "confirmed",
    });
    expect(confirmedInMay.total).toBe(1);
    expect(confirmedInMay.rows[0]?.scheduled_date).toBe("2026-05-01");
  });

  it("includes both endpoints of a date range", async () => {
    const onTheEdge = await repos.appointments.listAppointments({
      from: "2026-05-10",
      to: "2026-05-10",
    });
    expect(onTheEdge.total).toBe(1);
  });

  it("returns a date window for the calendar in day order", async () => {
    const rows = await repos.appointments.appointmentsBetween("2026-05-01", "2026-06-30");
    expect(rows.map((row) => row.scheduled_date)).toEqual([
      "2026-05-01",
      "2026-05-10",
      "2026-06-20",
    ]);
  });

  it("joins the service and dentist names for the list", async () => {
    await reset();
    const serviceId = await repos.services.createService(serviceInput());
    const memberId = await repos.team.createTeamMember({
      name: "Dr. Spec. Arbëreshë Korçaj",
      slug: "arberesh-korcaj",
      role: { sq: "Mjeke specialiste", en: "Specialist dentist" },
      bio: {},
      qualifications: [],
      specialties: [],
      photoId: null,
      socials: {},
      isActive: true,
    });

    const id = await repos.appointments.createAppointment(
      appointmentInput({ serviceId, teamMemberId: memberId }),
    );
    const row = await repos.appointments.getAppointment(id);

    expect(row?.service_title).toEqual({ sq: "Implante dentare", en: "Dental implants" });
    expect(row?.team_member_name).toBe("Dr. Spec. Arbëreshë Korçaj");
  });

  it("keeps the appointment when the service it named is deleted", async () => {
    const serviceId = (await repos.services.allServices())[0]?.id as string;
    const id = await repos.appointments.createAppointment(
      appointmentInput({ serviceId, serviceLabel: "Implante dentare" }),
    );

    await repos.services.deleteService(serviceId);

    const row = await repos.appointments.getAppointment(id);
    expect(row).not.toBeNull();
    expect(row?.service_id).toBeNull();
    /* The free-text label is why the history is still readable. */
    expect(row?.service_label).toBe("Implante dentare");
  });

  it("counts today, upcoming, pending and completed-this-month", async () => {
    await reset();
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = `${new Date().getUTCFullYear() + 1}-06-01`;

    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: today, status: "confirmed" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: nextYear, status: "pending" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: today, status: "completed" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ scheduledDate: today, status: "cancelled" }),
    );

    const counts = await repos.appointments.appointmentCounts();

    /* Today counts only what is still going to happen — a completed or
       cancelled visit is not on the list for the morning. */
    expect(counts.today).toBe(1);
    expect(counts.upcoming).toBe(1);
    expect(counts.pending).toBe(1);
    expect(counts.completedThisMonth).toBe(1);
    expect(counts.byStatus.cancelled).toBe(1);
    expect(await repos.appointments.pendingAppointmentCount()).toBe(1);
  });

  it("moves status without touching anything else", async () => {
    const id = await repos.appointments.createAppointment(appointmentInput());
    await repos.appointments.setAppointmentStatus(id, "confirmed");

    const row = await repos.appointments.getAppointment(id);
    expect(row?.status).toBe("confirmed");
    expect(row?.patient_name).toBe("Arta Krasniqi");
  });

  it("builds a request chart with a row per week, including empty ones", async () => {
    const weeks = await repos.appointments.requestsPerWeek(12);
    expect(weeks).toHaveLength(12);
    expect(weeks.every((week) => /^\d{4}-\d{2}-\d{2}$/.test(week.weekStart))).toBe(true);
    /* The requests just created land in the current week, which is the last. */
    expect(weeks[weeks.length - 1]?.count).toBeGreaterThan(0);
  });

  it("builds a request chart with a row per day, including empty ones", async () => {
    const days = await repos.appointments.requestsPerDay(30);
    expect(days).toHaveLength(30);
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBeGreaterThan(0);
  });

  it("counts requests by service and by source from real rows only", async () => {
    await reset();
    const serviceId = await repos.services.createService(serviceInput());

    await repos.appointments.createAppointment(appointmentInput({ serviceId }));
    await repos.appointments.createAppointment(appointmentInput({ serviceId }));
    await repos.appointments.createAppointment(
      appointmentInput({ serviceLabel: "Nuk e ka vendosur", source: "phone" }),
    );

    const byService = await repos.appointments.requestsByService(6);
    expect(byService[0]?.count).toBe(2);
    expect(byService[0]?.title).toEqual({
      sq: "Implante dentare",
      en: "Dental implants",
    });

    const bySource = await repos.appointments.requestsBySource();
    expect(bySource.find((entry) => entry.source === "website")?.count).toBe(2);
    expect(bySource.find((entry) => entry.source === "phone")?.count).toBe(1);
    /* Sources with nothing behind them are absent, not zero-filled — the
       analytics page must not imply data it does not have. */
    expect(bySource.find((entry) => entry.source === "walk_in")).toBeUndefined();
  });

  it("pages the list", async () => {
    await reset();
    for (let index = 0; index < 30; index += 1) {
      await repos.appointments.createAppointment(
        appointmentInput({ patientName: `Patient ${index}` }),
      );
    }

    const first = await repos.appointments.listAppointments({ page: 1 });
    const second = await repos.appointments.listAppointments({ page: 2 });

    expect(first.total).toBe(30);
    expect(first.pageCount).toBe(2);
    expect(first.rows).toHaveLength(25);
    expect(second.rows).toHaveLength(5);

    /* A page past the end clamps rather than 404s. */
    const beyond = await repos.appointments.listAppointments({ page: 99 });
    expect(beyond.page).toBe(2);
  });
});

describeDb("patients", () => {
  beforeAll(reset);

  it("round-trips a record and reads the date of birth back as a string", async () => {
    const id = await repos.patients.createPatient({
      fullName: "Arta Krasniqi",
      phone: "+383 44 111 222",
      email: "Arta@Example.org",
      dateOfBirth: "1991-02-28",
      address: "Prishtinë",
      notes: "Alergji ndaj penicilinës",
    });

    const row = await repos.patients.getPatient(id);
    expect(row?.full_name).toBe("Arta Krasniqi");
    expect(row?.date_of_birth).toBe("1991-02-28");
    expect(row?.notes).toBe("Alergji ndaj penicilinës");
  });

  it("finds a returning patient however they wrote their number", async () => {
    /* All of these are the number stored as "+383 44 111 222". A patient gives
       the international form on the website and the local one on the phone,
       and the clinic must not end up with two records. */
    for (const written of [
      "+383 44 111 222",
      "+383-44-111-222",
      "044 111 222",
      "044111222",
      "44111222",
      "00383 44 111 222",
      " +383 (44) 111-222 ",
    ]) {
      const found = await repos.patients.findPatientByContact({ phone: written });
      expect(found?.full_name, written).toBe("Arta Krasniqi");
    }
  });

  it("does not match a different subscriber", async () => {
    /* Same country code and operator prefix, different subscriber. */
    const found = await repos.patients.findPatientByContact({
      phone: "+383 44 111 999",
    });
    expect(found).toBeNull();
  });

  it("reduces a number to the digits that identify the person", async () => {
    const { phoneKey } = repos.patients;
    expect(phoneKey("+383 44 111 222")).toBe("44111222");
    expect(phoneKey("044 111 222")).toBe("44111222");
    expect(phoneKey("44111222")).toBe("44111222");
    /* Too short to identify anyone, so it matches nothing rather than
       everything ending in those digits. */
    expect(phoneKey("111222")).toBe("");
    expect(phoneKey("")).toBe("");
    expect(phoneKey(null)).toBe("");
  });

  it("finds a returning patient by email, case-insensitively", async () => {
    const found = await repos.patients.findPatientByContact({ email: "arta@example.ORG" });
    expect(found?.full_name).toBe("Arta Krasniqi");
  });

  it("does not match on a fragment of contact detail", async () => {
    expect(await repos.patients.findPatientByContact({ phone: "111" })).toBeNull();
    expect(await repos.patients.findPatientByContact({ email: "" })).toBeNull();
    expect(await repos.patients.findPatientByContact({})).toBeNull();
  });

  it("counts appointments and the last completed visit per patient", async () => {
    const patient = (await repos.patients.listPatients()).rows[0];
    const patientId = patient?.id as string;

    await repos.appointments.createAppointment(
      appointmentInput({ patientId, scheduledDate: "2026-02-01", status: "completed" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ patientId, scheduledDate: "2026-04-01", status: "completed" }),
    );
    await repos.appointments.createAppointment(
      appointmentInput({ patientId, scheduledDate: "2026-09-01", status: "pending" }),
    );

    const page = await repos.patients.listPatients();
    const row = page.rows.find((entry) => entry.id === patientId);

    expect(row?.appointment_count).toBe(3);
    /* The last *completed* visit, not the next booking. */
    expect(row?.last_visit).toBe("2026-04-01");
  });

  it("keeps a patient with no appointments in the list", async () => {
    const id = await repos.patients.createPatient({
      fullName: "Endrit Bytyqi",
      phone: null,
      email: null,
      dateOfBirth: null,
      address: null,
      notes: null,
    });

    const page = await repos.patients.listPatients();
    const row = page.rows.find((entry) => entry.id === id);

    expect(row).toBeDefined();
    expect(row?.appointment_count).toBe(0);
    expect(row?.last_visit).toBeNull();
  });

  it("hides archived patients unless asked for", async () => {
    const id = await repos.patients.createPatient({
      fullName: "Ish pacient",
      phone: null,
      email: null,
      dateOfBirth: null,
      address: null,
      notes: null,
    });
    await repos.patients.setPatientArchived(id, true);

    const visible = await repos.patients.listPatients();
    const withArchived = await repos.patients.listPatients({ includeArchived: true });

    expect(visible.rows.map((row) => row.id)).not.toContain(id);
    expect(withArchived.rows.map((row) => row.id)).toContain(id);

    const counts = await repos.patients.patientCounts();
    expect(counts.total).toBe(visible.total);
  });

  it("records treatment history and cascades it on delete", async () => {
    const patientId = await repos.patients.createPatient({
      fullName: "Me historik",
      phone: null,
      email: null,
      dateOfBirth: null,
      address: null,
      notes: null,
    });

    await repos.patients.addPatientTreatment({
      patientId,
      treatmentId: null,
      appointmentId: null,
      label: "Mbushje kompozite",
      performedOn: "2026-03-15",
      costText: "40 €",
      notes: null,
    });

    const history = await repos.patients.patientTreatments(patientId);
    expect(history).toHaveLength(1);
    expect(history[0]?.label).toBe("Mbushje kompozite");
    expect(history[0]?.performed_on).toBe("2026-03-15");

    await repos.patients.deletePatient(patientId);
    expect(await repos.patients.patientTreatments(patientId)).toHaveLength(0);
  });

  it("keeps an appointment when its patient record is deleted", async () => {
    const patientId = await repos.patients.createPatient({
      fullName: "Do të fshihet",
      phone: "+383 49 000 111",
      email: null,
      dateOfBirth: null,
      address: null,
      notes: null,
    });

    const appointmentId = await repos.appointments.createAppointment(
      appointmentInput({ patientId, patientName: "Do të fshihet" }),
    );

    await repos.patients.deletePatient(patientId);

    const row = await repos.appointments.getAppointment(appointmentId);
    expect(row).not.toBeNull();
    expect(row?.patient_id).toBeNull();
    /* The contact snapshot is why the appointment is still actionable. */
    expect(row?.patient_name).toBe("Do të fshihet");
    expect(row?.phone).toBe("+383 44 111 222");
  });
});

describeDb("gallery and media", () => {
  beforeAll(reset);

  it("stores an uploaded image and reads the bytes back unchanged", async () => {
    const result = await repos.media.storeMedia({
      filename: "reception.png",
      bytes: PNG_1X1,
      maxBytes: 1024 * 1024,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const meta = await repos.media.getMediaMeta(result.id);
    expect(meta?.mime_type).toBe("image/png");
    expect(meta?.width).toBe(1);
    expect(meta?.height).toBe(1);

    const stored = await repos.media.readMedia(result.id);
    expect(stored?.mimeType).toBe("image/png");
    expect(Buffer.from(PNG_1X1).equals(stored?.data as Buffer)).toBe(true);
  });

  it("reuses the row when the same file is uploaded twice", async () => {
    const first = await repos.media.storeMedia({
      filename: "again.png",
      bytes: PNG_1X1,
      maxBytes: 1024 * 1024,
    });
    expect(first.ok && first.reused).toBe(true);
    expect(await repos.media.mediaCount()).toBe(1);
  });

  it("rejects a file that is not one of the accepted image formats", async () => {
    const result = await repos.media.storeMedia({
      filename: "evil.png",
      bytes: new Uint8Array(Buffer.from("<svg><script>alert(1)</script></svg>")),
      maxBytes: 1024 * 1024,
    });
    expect(result).toEqual({ ok: false, reason: "wrong_type" });
  });

  it("rejects a file over the size limit before storing it", async () => {
    const result = await repos.media.storeMedia({
      filename: "big.png",
      bytes: PNG_1X1,
      maxBytes: 10,
    });
    expect(result).toEqual({ ok: false, reason: "too_large" });
    expect(await repos.media.mediaCount()).toBe(1);
  });

  it("will not publish a treatment photo without recorded consent", async () => {
    const upload = await repos.media.storeMedia({
      filename: "work.png",
      bytes: PNG_2X1,
      maxBytes: 1024 * 1024,
    });
    expect(upload.ok).toBe(true);
    if (!upload.ok) return;

    /* The rule, in the repository. */
    expect(
      repos.gallery.galleryConsentSatisfied({
        kind: "work",
        isPublished: true,
        consentOnFile: false,
      }),
    ).toBe(false);

    /* And the same rule in the database, which is what makes it a guarantee
       rather than a form validation. */
    await expect(
      repos.gallery.createGalleryImage(upload.id, {
        categoryId: null,
        alt: { sq: "Para dhe pas" },
        caption: {},
        kind: "work",
        consentOnFile: false,
        isPublished: true,
        isFeatured: false,
      }),
    ).rejects.toThrow(/gallery_work_needs_consent/);
  });

  it("allows an unpublished treatment photo without consent", async () => {
    const media = (await repos.media.listMedia()).find(
      (row) => row.filename === "work.png",
    );

    const id = await repos.gallery.createGalleryImage(media?.id as string, {
      categoryId: null,
      alt: { sq: "Para dhe pas" },
      caption: {},
      kind: "work",
      consentOnFile: false,
      isPublished: false,
      isFeatured: false,
    });

    expect(id).not.toBe("");

    /* Publishing it is refused, and reported rather than thrown. */
    expect(await repos.gallery.toggleGalleryPublished(id)).toBe(false);
    expect((await repos.gallery.getGalleryImage(id))?.is_published).toBe(false);
  });

  it("publishes a treatment photo once consent is recorded", async () => {
    const image = (await repos.gallery.listGalleryImages({ kind: "work" }))[0];
    const id = image?.id as string;

    await repos.gallery.updateGalleryImage(id, {
      categoryId: null,
      alt: { sq: "Para dhe pas" },
      caption: {},
      kind: "work",
      consentOnFile: true,
      isPublished: false,
      isFeatured: false,
    });

    expect(await repos.gallery.toggleGalleryPublished(id)).toBe(true);
    expect((await repos.gallery.getGalleryImage(id))?.is_published).toBe(true);
  });

  it("publishes a clinic photo with no consent question at all", async () => {
    const media = (await repos.media.listMedia()).find(
      (row) => row.filename === "reception.png",
    );

    const id = await repos.gallery.createGalleryImage(media?.id as string, {
      categoryId: null,
      alt: { sq: "Zona e pritjes", en: "The waiting area" },
      caption: { sq: "Pritja" },
      kind: "clinic",
      consentOnFile: false,
      isPublished: true,
      isFeatured: true,
    });

    const row = await repos.gallery.getGalleryImage(id);
    expect(row?.is_published).toBe(true);
    /* The joined media columns are what the gallery grid renders from. */
    expect(row?.mime_type).toBe("image/png");
    expect(row?.filename).toBe("reception.png");
  });

  it("counts what is published and what is still waiting on consent", async () => {
    const counts = await repos.gallery.galleryCounts();
    expect(counts.total).toBe(2);
    expect(counts.published).toBe(2);
    expect(counts.awaitingConsent).toBe(0);
  });

  it("shows only published images to the public read", async () => {
    const published = await repos.gallery.publishedGalleryImages();
    expect(published).toHaveLength(2);
    expect(published.every((row) => row.is_published)).toBe(true);
  });

  it("refuses to delete a file another row still points at", async () => {
    const media = (await repos.media.listMedia()).find(
      (row) => row.filename === "reception.png",
    );
    expect(await repos.media.deleteMediaIfUnused(media?.id as string)).toBe(false);
  });

  it("deletes the file once nothing points at it", async () => {
    const media = (await repos.media.listMedia()).find(
      (row) => row.filename === "reception.png",
    );
    const image = (await repos.gallery.listGalleryImages({ kind: "clinic" }))[0];

    await repos.gallery.deleteGalleryImage(image?.id as string);
    expect(await repos.media.deleteMediaIfUnused(media?.id as string)).toBe(true);
    expect(await repos.media.getMediaMeta(media?.id as string)).toBeNull();
  });

  it("files images under a category and lets the category go without them", async () => {
    await reset();
    const upload = await repos.media.storeMedia({
      filename: "c.png",
      bytes: PNG_1X1,
      maxBytes: 1024 * 1024,
    });
    if (!upload.ok) throw new Error("upload failed");

    const categoryId = await repos.gallery.createGalleryCategory({
      slug: "ambienti",
      name: { sq: "Ambienti", en: "The space" },
    });

    const imageId = await repos.gallery.createGalleryImage(upload.id, {
      categoryId,
      alt: { sq: "Foto" },
      caption: {},
      kind: "clinic",
      consentOnFile: false,
      isPublished: true,
      isFeatured: false,
    });

    const inCategory = await repos.gallery.listGalleryImages({ categoryId });
    expect(inCategory.map((row) => row.id)).toEqual([imageId]);
    expect(inCategory[0]?.category_name).toEqual({ sq: "Ambienti", en: "The space" });

    const categories = await repos.gallery.listGalleryCategories();
    expect(categories[0]?.image_count).toBe(1);

    /* Deleting a category leaves its images, uncategorised. */
    await repos.gallery.deleteGalleryCategory(categoryId);
    const orphan = await repos.gallery.getGalleryImage(imageId);
    expect(orphan).not.toBeNull();
    expect(orphan?.category_id).toBeNull();
  });

  it("removes the gallery entry when its file is deleted", async () => {
    const media = (await repos.media.listMedia())[0];
    const image = (await repos.gallery.listGalleryImages())[0];

    await repos.client.execute("delete from media where id = $1", [media?.id]);

    /* `on delete cascade` on media_id: an entry pointing at nothing would
       render a broken image on the public gallery. */
    expect(await repos.gallery.getGalleryImage(image?.id as string)).toBeNull();
  });
});

describeDb("messages", () => {
  beforeAll(reset);

  it("stores a contact-form message and hashes the sender's address", async () => {
    const id = await repos.messages.createMessage({
      name: "Vizitor",
      email: "v@example.org",
      phone: null,
      subject: "Pyetje",
      body: "Sa kushton një kontroll?",
      source: "website",
      locale: "sq",
      ip: "203.0.113.7",
    });

    const row = await repos.messages.getMessage(id);
    expect(row?.body).toBe("Sa kushton një kontroll?");
    expect(row?.is_read).toBe(false);
    expect(row?.status).toBe("new");

    const stored = await repos.client.queryOne<{ ip_hash: string | null }>(
      "select ip_hash from message where id = $1",
      [id],
    );
    expect(stored?.ip_hash).not.toBeNull();
    /* Hashed, not stored: the raw address must not be recoverable. */
    expect(stored?.ip_hash).not.toContain("203.0.113.7");
  });

  it("counts unread messages, ignoring spam", async () => {
    const spamId = await repos.messages.createMessage({
      name: "Spam",
      email: null,
      phone: null,
      subject: null,
      body: "buy now",
      source: "website",
    });
    await repos.messages.updateMessage(spamId, { status: "spam" });

    expect(await repos.messages.unreadMessageCount()).toBe(1);
  });

  it("marks a message read without changing its status", async () => {
    const row = (await repos.messages.recentMessages())[0];
    await repos.messages.markMessageRead(row?.id as string);

    const after = await repos.messages.getMessage(row?.id as string);
    expect(after?.is_read).toBe(true);
    expect(after?.status).toBe("new");
    expect(await repos.messages.unreadMessageCount()).toBe(0);
  });

  it("searches across name, email and body", async () => {
    const byBody = await repos.messages.listMessages({ search: "kontroll" });
    expect(byBody.total).toBe(1);

    const byEmail = await repos.messages.listMessages({ search: "v@example" });
    expect(byEmail.total).toBe(1);

    const nothing = await repos.messages.listMessages({ search: "asnjë përputhje" });
    expect(nothing.total).toBe(0);
  });
});

describeDb("promotions", () => {
  beforeAll(reset);

  const base = {
    title: { sq: "Kontroll falas", en: "Free check-up" },
    description: {},
    discountText: { sq: "-20%" },
    ctaLabel: {},
    ctaHref: "/takim",
    imageId: null,
    isActive: true,
  };

  it("shows an active promotion inside its window to the public read", async () => {
    await repos.promotions.createPromotion({
      ...base,
      slug: "aktiv-tani",
      startsOn: "2020-01-01",
      endsOn: "2099-12-31",
    });

    const live = await repos.promotions.livePromotions();
    expect(live.map((row) => row.slug)).toEqual(["aktiv-tani"]);
    expect(await repos.promotions.activePromotionCount()).toBe(1);
  });

  it("hides one whose window has not opened, and one that has closed", async () => {
    await repos.promotions.createPromotion({
      ...base,
      slug: "e-ardhme",
      startsOn: "2099-01-01",
      endsOn: "2099-12-31",
    });
    await repos.promotions.createPromotion({
      ...base,
      slug: "e-skaduar",
      startsOn: "2020-01-01",
      endsOn: "2020-12-31",
    });

    const live = await repos.promotions.livePromotions();
    expect(live.map((row) => row.slug)).toEqual(["aktiv-tani"]);
  });

  it("hides an inactive promotion even inside its window", async () => {
    await repos.promotions.createPromotion({
      ...base,
      slug: "e-fikur",
      isActive: false,
      startsOn: null,
      endsOn: null,
    });

    const live = await repos.promotions.livePromotions();
    expect(live.map((row) => row.slug)).not.toContain("e-fikur");
  });

  it("treats a promotion with no dates as always on, while active", async () => {
    await repos.promotions.createPromotion({
      ...base,
      slug: "pa-data",
      startsOn: null,
      endsOn: null,
    });

    const live = await repos.promotions.livePromotions();
    expect(live.map((row) => row.slug)).toContain("pa-data");
  });

  it("labels each promotion with the state the dashboard shows", async () => {
    const rows = await repos.promotions.listPromotions();
    const state = (slug: string) => {
      const row = rows.find((entry) => entry.slug === slug);
      return row ? repos.promotions.promotionState(row) : null;
    };

    expect(state("aktiv-tani")).toBe("live");
    expect(state("e-ardhme")).toBe("scheduled");
    expect(state("e-skaduar")).toBe("expired");
    expect(state("e-fikur")).toBe("draft");
  });

  it("refuses a window that ends before it starts", async () => {
    await expect(
      repos.promotions.createPromotion({
        ...base,
        slug: "kohe-e-kthyer",
        startsOn: "2026-06-01",
        endsOn: "2026-05-01",
      }),
    ).rejects.toThrow(/promotion_dates_ordered/);
  });

  it("toggles active and reports the new state", async () => {
    const row = (await repos.promotions.listPromotions()).find(
      (entry) => entry.slug === "aktiv-tani",
    );
    expect(await repos.promotions.togglePromotionActive(row?.id as string)).toBe(false);
    expect(await repos.promotions.togglePromotionActive(row?.id as string)).toBe(true);
  });
});

describeDb("reviews", () => {
  beforeAll(reset);

  it("marks a hand-entered review as manual, with no import stamp", async () => {
    const id = await repos.reviews.createReview({
      authorName: "A. K.",
      body: { sq: "Shërbim i shkëlqyer." },
      rating: 5,
      source: "manual",
      externalUrl: null,
      reviewedOn: "2026-04-02",
      isPublished: true,
      isFeatured: false,
    });

    const row = await repos.reviews.getReview(id);
    expect(row?.source).toBe("manual");
    /* The distinction the dashboard shows on every row. */
    expect(row?.imported_at).toBeNull();
    expect(row?.reviewed_on).toBe("2026-04-02");
  });

  it("stamps a review recorded as coming from a platform", async () => {
    const id = await repos.reviews.createReview({
      authorName: "B. M.",
      body: { sq: "Faleminderit!" },
      rating: 5,
      source: "google",
      externalUrl: "https://maps.google.com/…",
      reviewedOn: null,
      isPublished: false,
      isFeatured: false,
    });

    const row = await repos.reviews.getReview(id);
    expect(row?.source).toBe("google");
    expect(row?.imported_at).not.toBeNull();
  });

  it("shows only published reviews to the public read, featured first", async () => {
    await repos.reviews.createReview({
      authorName: "C. Z.",
      body: { sq: "Shumë e kënaqur." },
      rating: 5,
      source: "manual",
      externalUrl: null,
      reviewedOn: "2026-01-01",
      isPublished: true,
      isFeatured: true,
    });

    const published = await repos.reviews.publishedReviews();
    expect(published.map((row) => row.author_name)).toEqual(["C. Z.", "A. K."]);
  });

  it("updates an imported review instead of duplicating it on a re-run", async () => {
    await repos.reviews.upsertImportedReview({
      source: "google",
      externalId: "g-123",
      authorName: "D. H.",
      body: { sq: "Version i pare" },
      rating: 4,
      externalUrl: null,
      reviewedOn: null,
    });
    await repos.reviews.upsertImportedReview({
      source: "google",
      externalId: "g-123",
      authorName: "D. H.",
      body: { sq: "Version i dyte" },
      rating: 5,
      externalUrl: null,
      reviewedOn: null,
    });

    const rows = await repos.reviews.listReviews({ source: "google" });
    const imported = rows.filter((row) => row.external_id === "g-123");
    expect(imported).toHaveLength(1);
    expect(imported[0]?.body).toEqual({ sq: "Version i dyte" });
    expect(imported[0]?.rating).toBe(5);
  });

  it("averages the ratings it actually has, ignoring unrated reviews", async () => {
    /* Four fives so far. A three and an unrated review make the average worth
       checking: 5,5,5,5,3 → 4.6, and the null must not count as a zero. */
    await repos.reviews.createReview({
      authorName: "E. R.",
      body: { sq: "Mirë, por prita." },
      rating: 3,
      source: "manual",
      externalUrl: null,
      reviewedOn: null,
      isPublished: false,
      isFeatured: false,
    });
    await repos.reviews.createReview({
      authorName: "F. S.",
      body: { sq: "Pa yje." },
      rating: null,
      source: "manual",
      externalUrl: null,
      reviewedOn: null,
      isPublished: false,
      isFeatured: false,
    });

    const stats = await repos.reviews.reviewStats();
    expect(stats.total).toBe(6);
    expect(stats.published).toBe(2);
    expect(stats.averageRating).toBe(4.6);
  });

  it("refuses a rating outside one to five", async () => {
    await expect(
      repos.reviews.createReview({
        authorName: "Jo i vlefshëm",
        body: {},
        rating: 9,
        source: "manual",
        externalUrl: null,
        reviewedOn: null,
        isPublished: false,
        isFeatured: false,
      }),
    ).rejects.toThrow();
  });
});

describeDb("social posts", () => {
  beforeAll(reset);

  const base = {
    platform: "instagram" as const,
    headline: "Kontrolli i rregullt",
    caption: "Pse kontrolli çdo gjashtë muaj kursen para.",
    hashtags: ["#dentist", "#prishtine"],
    mediaId: null,
    mediaSuggestion: "Foto e dhomës së trajtimit",
    language: "sq",
    scheduledFor: null,
    externalUrl: null,
    notes: null,
  };

  it("stores hashtags as a JSON array", async () => {
    const id = await repos.social.createSocialPost({ ...base, status: "draft" });
    const row = await repos.social.getSocialPost(id);

    expect(row?.hashtags).toEqual(["#dentist", "#prishtine"]);
    expect(row?.status).toBe("draft");
    /* A draft has reached neither approval nor publication. */
    expect(row?.approved_at).toBeNull();
    expect(row?.published_at).toBeNull();
  });

  it("stamps approval when a post reaches approved, and only once", async () => {
    const id = await repos.social.createSocialPost({ ...base, status: "draft" });

    await repos.social.setSocialStatus(id, "approved");
    const first = await repos.social.getSocialPost(id);
    expect(first?.approved_at).not.toBeNull();

    await repos.social.setSocialStatus(id, "scheduled");
    const second = await repos.social.getSocialPost(id);
    /* Moving on down the workflow keeps the original approval time. */
    expect(second?.approved_at?.getTime()).toBe(first?.approved_at?.getTime());
    expect(second?.published_at).toBeNull();
  });

  it("clears the stamps when a post is sent back to draft", async () => {
    const id = await repos.social.createSocialPost({ ...base, status: "approved" });
    await repos.social.setSocialStatus(id, "draft");

    const row = await repos.social.getSocialPost(id);
    expect(row?.approved_at).toBeNull();
  });

  it("records publication only when the admin says it happened", async () => {
    const id = await repos.social.createSocialPost({ ...base, status: "approved" });
    expect((await repos.social.getSocialPost(id))?.published_at).toBeNull();

    await repos.social.setSocialStatus(id, "published");
    expect((await repos.social.getSocialPost(id))?.published_at).not.toBeNull();
  });

  it("orders the list by where each post is in the workflow", async () => {
    await reset();
    await repos.social.createSocialPost({ ...base, caption: "d", status: "draft" });
    await repos.social.createSocialPost({ ...base, caption: "p", status: "published" });
    await repos.social.createSocialPost({ ...base, caption: "r", status: "ready_for_approval" });
    await repos.social.createSocialPost({ ...base, caption: "f", status: "failed" });

    const page = await repos.social.listSocialPosts();
    expect(page.rows.map((row) => row.caption)).toEqual(["f", "r", "d", "p"]);
  });

  it("counts what is waiting for the admin", async () => {
    const counts = await repos.social.socialCounts();
    expect(counts.forApproval).toBe(1);
    expect(counts.published).toBe(1);
    expect(await repos.social.postsForApprovalCount()).toBe(1);
  });

  it("returns dated posts for the content calendar", async () => {
    await reset();
    await repos.social.createSocialPost({
      ...base,
      status: "scheduled",
      scheduledFor: new Date("2026-07-15T09:00:00Z"),
    });
    await repos.social.createSocialPost({
      ...base,
      status: "draft",
      scheduledFor: null,
    });

    const inJuly = await repos.social.socialPostsBetween(
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-08-01T00:00:00Z"),
    );

    /* An undated draft is not on the calendar — it has no day to sit on. */
    expect(inJuly).toHaveLength(1);
  });

  it("cleans up whatever the admin typed into the hashtag field", () => {
    expect(repos.social.parseHashtags("#implante, dentare  #prishtinë")).toEqual([
      "#implante",
      "#dentare",
      "#prishtinë",
    ]);
    expect(repos.social.parseHashtags("###mbi #dy!! #tre?")).toEqual([
      "#mbi",
      "#dy",
      "#tre",
    ]);
    expect(repos.social.parseHashtags("   ")).toEqual([]);
  });
});

describeDb("website content and settings", () => {
  beforeAll(reset);

  it("falls back to the site's published copy when nothing is overridden", async () => {
    const { contentBlocks } = await import("@/lib/cms/registry");
    const overrides = await repos.content.contentOverrides();
    const first = contentBlocks[0];

    expect(overrides.size).toBe(0);
    expect(repos.content.resolveContent(first?.key as string, overrides)).toEqual(
      first?.fallback,
    );
  });

  it("overrides one language and leaves the other on the published copy", async () => {
    const { contentBlocks } = await import("@/lib/cms/registry");
    const block = contentBlocks.find((entry) => entry.key === "home.hero.title");

    await repos.content.setContentBlock("home.hero.title", { sq: "Titull i re" });

    const overrides = await repos.content.contentOverrides();
    const resolved = repos.content.resolveContent("home.hero.title", overrides);

    expect(resolved.sq).toBe("Titull i re");
    /* The English is untouched, not blanked. */
    expect(resolved.en).toBe(block?.fallback.en);
  });

  it("restores the published copy when a field is cleared", async () => {
    const { contentBlocks } = await import("@/lib/cms/registry");
    const block = contentBlocks.find((entry) => entry.key === "home.hero.title");

    await repos.content.setContentBlock("home.hero.title", { sq: "   ", en: "" });

    const overrides = await repos.content.contentOverrides();
    expect(overrides.has("home.hero.title")).toBe(false);
    expect(repos.content.resolveContent("home.hero.title", overrides)).toEqual(
      block?.fallback,
    );
  });

  it("ignores a stored key that is no longer a declared block", async () => {
    await repos.client.execute(
      "insert into content_block (key, value) values ($1, $2::jsonb)",
      ["home.removed.block", JSON.stringify({ sq: "leftover" })],
    );

    const overrides = await repos.content.contentOverrides();
    expect(overrides.has("home.removed.block")).toBe(false);
  });

  it("will not store a value for an undeclared key", async () => {
    await repos.content.setContentBlock("made.up.key", { sq: "nope" });
    expect(await repos.content.editedContentCount()).toBe(1);
  });

  it("orders and toggles FAQ entries", async () => {
    const first = await repos.content.createFaqItem({
      question: { sq: "A pranoni pacientë të re?" },
      answer: { sq: "Po." },
      isActive: true,
    });
    const second = await repos.content.createFaqItem({
      question: { sq: "Sa kushton kontrolli?" },
      answer: { sq: "Shihni çmimet." },
      isActive: false,
    });

    expect((await repos.content.listFaqItems()).map((row) => row.id)).toEqual([
      first,
      second,
    ]);
    expect((await repos.content.activeFaqItems()).map((row) => row.id)).toEqual([first]);

    await repos.content.moveFaqItem(second, "up");
    expect((await repos.content.listFaqItems()).map((row) => row.id)).toEqual([
      second,
      first,
    ]);
  });

  it("reads settings merged over the values the site publishes", async () => {
    const { defaultSettings } = await import("@/lib/settings/registry");
    const defaults = defaultSettings();

    const stored = await repos.settings.readSettings();
    expect(stored.clinicName).toBe(defaults.clinicName);
    expect(stored.phones).toEqual(defaults.phones);
  });

  it("writes several settings at once and merges them on read", async () => {
    await repos.settings.writeSettings({
      clinicName: "Azalea Dent Prishtinë",
      phones: ["+383 48 306 376"],
      notifyOnMessage: true,
    });

    const stored = await repos.settings.readSettings();
    expect(stored.clinicName).toBe("Azalea Dent Prishtinë");
    expect(stored.phones).toEqual(["+383 48 306 376"]);
    expect(stored.notifyOnMessage).toBe(true);
    /* Untouched keys still come from clinic.ts. */
    const { defaultSettings } = await import("@/lib/settings/registry");
    expect(stored.email).toBe(defaultSettings().email);
  });

  it("restores the published value when a setting is reset", async () => {
    const { defaultSettings } = await import("@/lib/settings/registry");
    await repos.settings.resetSetting("clinicName");

    const stored = await repos.settings.readSettings();
    expect(stored.clinicName).toBe(defaultSettings().clinicName);
  });

  it("ignores a stored setting of the wrong shape rather than breaking the site", async () => {
    const { defaultSettings } = await import("@/lib/settings/registry");

    /* A hand-edited row: `phones` should be an array of strings. */
    await repos.client.execute(
      `insert into setting (key, value) values ('phones', '"not-an-array"'::jsonb)
       on conflict (key) do update set value = excluded.value`,
    );

    const stored = await repos.settings.readSettings();
    expect(stored.phones).toEqual(defaultSettings().phones);
  });

  it("collapses and expands opening hours without losing a day", async () => {
    const { hoursByDay, hoursFromDays, WEEKDAYS } = await import(
      "@/lib/settings/registry"
    );

    const byDay = hoursByDay([
      { days: ["mon", "tue", "wed", "thu", "fri"], opens: "14:00", closes: "20:00" },
      { days: ["sat", "sun"], opens: null, closes: null },
    ]);

    expect(byDay.mon).toEqual({ opens: "14:00", closes: "20:00" });
    expect(byDay.sun).toEqual({ opens: "", closes: "" });

    const rules = hoursFromDays(byDay);
    /* Merged back into two rules, so the website still reads "Mon–Fri". */
    expect(rules).toHaveLength(2);
    expect(rules[0]?.days).toEqual(["mon", "tue", "wed", "thu", "fri"]);
    expect(rules[1]?.opens).toBeNull();

    /* Every day survives the round trip. */
    expect(rules.flatMap((rule) => rule.days)).toEqual([...WEEKDAYS]);
  });

  it("treats a half-entered day as closed", async () => {
    const { hoursByDay, hoursFromDays } = await import("@/lib/settings/registry");

    const byDay = hoursByDay([]);
    byDay.wed = { opens: "09:00", closes: "" };

    const rules = hoursFromDays(byDay);
    const wednesday = rules.find((rule) => rule.days.includes("wed"));
    expect(wednesday?.opens).toBeNull();
  });
});

describeDb("activity log", () => {
  beforeAll(reset);

  it("records an event and counts it as unread", async () => {
    await repos.activity.logActivity({
      kind: "appointment.requested",
      summary: "Kërkesë e re nga Arta Krasniqi",
      entity: "appointment",
      entityId: null,
      meta: { source: "website" },
    });

    const recent = await repos.activity.recentActivity();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.summary).toBe("Kërkesë e re nga Arta Krasniqi");
    expect(recent[0]?.meta).toEqual({ source: "website" });
    expect(await repos.activity.unreadActivityCount()).toBe(1);
  });

  it("links a notification to the thing it happened to", async () => {
    const id = await repos.appointments.createAppointment(appointmentInput());
    await repos.activity.logActivity({
      kind: "appointment.requested",
      summary: "Kërkesë e re",
      entity: "appointment",
      entityId: id,
    });

    const row = (await repos.activity.recentActivity())[0];
    expect(repos.activity.activityHref(row!)).toBe(`/appointments/${id}`);
  });

  it("clears the unread count", async () => {
    await repos.client.execute("update activity set read_at = now() where read_at is null");
    expect(await repos.activity.unreadActivityCount()).toBe(0);
  });
});

describeDb("treatments", () => {
  beforeAll(reset);

  it("links a treatment to a service and survives the service being deleted", async () => {
    const serviceId = await repos.services.createService(serviceInput());
    const treatmentId = await repos.treatments.createTreatment({
      slug: "kurore-zirkoni",
      serviceId,
      title: { sq: "Kurorë zirkoni", en: "Zirconia crown" },
      summary: {},
      body: {},
      priceText: {},
      durationMinutes: null,
      imageId: null,
      isActive: true,
      isFeatured: false,
    });

    const listed = await repos.treatments.listTreatments({ serviceId });
    expect(listed.rows.map((row) => row.id)).toEqual([treatmentId]);
    expect(listed.rows[0]?.service_title).toEqual({
      sq: "Implante dentare",
      en: "Dental implants",
    });

    await repos.services.deleteService(serviceId);

    const orphan = await repos.treatments.getTreatment(treatmentId);
    expect(orphan).not.toBeNull();
    expect(orphan?.service_id).toBeNull();
  });

  it("keeps a patient's history readable after the treatment is deleted", async () => {
    const patientId = await repos.patients.createPatient({
      fullName: "Pacient",
      phone: null,
      email: null,
      dateOfBirth: null,
      address: null,
      notes: null,
    });
    const treatmentId = (await repos.treatments.listTreatments()).rows[0]?.id as string;

    await repos.patients.addPatientTreatment({
      patientId,
      treatmentId,
      appointmentId: null,
      label: "Kurorë zirkoni",
      performedOn: "2026-02-02",
      costText: null,
      notes: null,
    });

    await repos.treatments.deleteTreatment(treatmentId);

    const history = await repos.patients.patientTreatments(patientId);
    expect(history).toHaveLength(1);
    /* The label is stored alongside the link precisely for this. */
    expect(history[0]?.label).toBe("Kurorë zirkoni");
    expect(history[0]?.treatment_id).toBeNull();
  });
});

describeDb("team", () => {
  beforeAll(reset);

  it("round-trips a member, including the social links object", async () => {
    const id = await repos.team.createTeamMember({
      name: "Dr. Spec. Arbëreshë Korçaj",
      slug: "arberesh-korcaj",
      role: { sq: "Mjeke specialiste", en: "Specialist dentist" },
      bio: { sq: "Biografia" },
      qualifications: [{ sq: "Specializim në protetikë" }],
      specialties: [{ sq: "Protetikë" }, { sq: "Implantologji" }],
      photoId: null,
      socials: { instagram: "https://instagram.com/azalea.dent" },
      isActive: true,
    });

    const row = await repos.team.getTeamMember(id);
    expect(row?.socials).toEqual({ instagram: "https://instagram.com/azalea.dent" });
    expect(row?.specialties).toHaveLength(2);
    expect(row?.qualifications).toEqual([{ sq: "Specializim në protetikë" }]);
  });

  it("hides an inactive member from the public read and from the assignment list", async () => {
    const id = await repos.team.createTeamMember({
      name: "Ish anëtar",
      slug: "ish-anetar",
      role: {},
      bio: {},
      qualifications: [],
      specialties: [],
      photoId: null,
      socials: {},
      isActive: false,
    });

    expect((await repos.team.activeTeam()).map((row) => row.id)).not.toContain(id);
    expect((await repos.team.teamOptions()).map((row) => row.id)).not.toContain(id);
    expect((await repos.team.listTeam()).map((row) => row.id)).toContain(id);
  });

  it("unassigns appointments when a member is deleted, keeping the appointment", async () => {
    const memberId = (await repos.team.teamOptions())[0]?.id as string;
    const appointmentId = await repos.appointments.createAppointment(
      appointmentInput({ teamMemberId: memberId }),
    );

    await repos.team.deleteTeamMember(memberId);

    const row = await repos.appointments.getAppointment(appointmentId);
    expect(row).not.toBeNull();
    expect(row?.team_member_id).toBeNull();
  });
});
