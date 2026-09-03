# Deploying the Azalea Dent website

## Why Vercel

This is a Next.js app that uses server-rendered routes (the appointment API,
on-demand image optimisation, the generated OpenGraph image). A plain static
host would break those. Vercel is built by the Next.js team, runs this app with
zero configuration, gives free automatic HTTPS and a global CDN, and its free
tier is comfortably enough for a clinic website.

Netlify and Cloudflare Workers both run Next.js too, and Docker on any VPS
works via `next build && next start`. Nothing in this repository is
Vercel-specific — you can move later without code changes.

---

## 1. Create the deployment and connect GitHub

1. Sign in at **https://vercel.com** with the GitHub account that owns this
   repository.
2. **Add New… → Project**.
3. Under _Import Git Repository_, pick **`bardhakorqajj/azalea-dent-web`**.
   If it is not listed, click _Adjust GitHub App Permissions_ and grant access.
4. Vercel detects Next.js and fills in everything:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

   Leave all of it as-is.

5. Check the production branch under **Settings → Git → Production Branch**.
   The repository currently has a single branch,
   `claude/dental-clinic-website-i7hpin`, which is therefore its default and
   what Vercel will deploy.

   If you would rather the production branch were called `main`, rename it on
   GitHub first (**Settings → Branches → the pencil icon next to the default
   branch**), then set the same name in Vercel. Renaming is safe: GitHub
   redirects existing links. It is cosmetic, so skip it if you prefer.

## 2. Turn on appointment requests

This is the one part of the site that cannot work until you create an account
somewhere: sending email or SMS needs credentials, and only you can issue them.
Everything else is already wired. Requests go to
**azaleadent@hotmail.com** and **+383 48 306 376** by default, so you only add
the provider keys, not the destinations.

Every channel you configure is used, so a request can arrive as an email _and_
a text at the same time. If one provider fails, the others still deliver.

**For email only, set `RESEND_API_KEY` and nothing else.** The SMS and webhook
channels stay switched off until their variables are present, so there is
nothing to disable.

### Email (start here, free)

**Sign up with `azaleadent@hotmail.com`, not a personal address.** Until a
domain is verified, Resend refuses to deliver anywhere except the address that
owns the Resend account. Signing up as the clinic makes the clinic inbox the
one allowed recipient, which is exactly where requests need to go.

1. Go to **https://resend.com** and sign up using **`azaleadent@hotmail.com`**.
   Confirm the verification email Resend sends to that inbox.
2. **API Keys → Create API Key**. Name it `azalea-dent-web`, permission
   _Sending access_. Copy the `re_…` key now — it is shown once.
3. In Vercel, **Settings → Environment Variables**, add for Production and
   Preview:

   | Name             | Value          |
   | ---------------- | -------------- |
   | `RESEND_API_KEY` | the `re_…` key |

   That is all. Requests go to `azaleadent@hotmail.com`, which is the clinic
   address in `src/content/clinic.ts`. Do not set `APPOINTMENT_TO_EMAIL`.

4. Redeploy (step 9) — environment variables only take effect on a new build.

If you signed up with a different address and see
`403 … You can only send testing emails to your own email address`, that is
this restriction. Either make a new Resend account owned by
`azaleadent@hotmail.com`, or verify the domain as below.

#### Then verify the domain

Testing mode is fine to start, but `onboarding@resend.dev` is a shared sender
and Outlook/Hotmail filters it aggressively, so **check the Junk folder** for
the first few requests. Once the domain is bought (step 4), verify it:

1. Resend → **Domains → Add Domain**, enter `azalea-dent.org`.
2. Add the DKIM and SPF records Resend shows at your DNS provider, alongside
   the Vercel records from step 5. They do not conflict — Vercel's are `A` and
   `CNAME` on `@` and `www`; Resend's are `TXT`/`CNAME` on their own names.
3. Wait for Resend to show the domain as _Verified_, then set:

   | Name                     | Value                                  |
   | ------------------------ | -------------------------------------- |
   | `APPOINTMENT_FROM_EMAIL` | `Azalea Dent <takime@azalea-dent.org>` |

4. Redeploy.

After this, mail is sent from the clinic's own domain, lands in the inbox
rather than Junk, and can be delivered to any address — so a second recipient
can be added later with `APPOINTMENT_TO_EMAIL`.

Note that this sends _from_ `azalea-dent.org` without creating a mailbox there.
Replies still work: each request sets `Reply-To` to the patient's own address,
so hitting reply in Hotmail answers the patient.

**Getting requests on the phone without paying for SMS:** add
`azaleadent@hotmail.com` to the Mail app on the phone and turn on
notifications for it. Every request then arrives as a push notification, at no
cost. Most small clinics do this and never set up SMS at all.

### Text message (optional, costs money per message)

Only worth it if email notifications are not reliable enough for you.

1. Create an account at **https://twilio.com** and buy a number that can send
   to Kosovo (+383). Check Twilio's SMS pricing and geographic permissions for
   Kosovo first: some routes need it enabled explicitly under
   _Messaging → Settings → Geo permissions_.
2. Add:

   | Name                 | Value                                  |
   | -------------------- | -------------------------------------- |
   | `TWILIO_ACCOUNT_SID` | `AC…` from the Twilio console          |
   | `TWILIO_AUTH_TOKEN`  | the auth token                         |
   | `TWILIO_FROM_NUMBER` | the Twilio number, e.g. `+15550100000` |

   Texts go to `+383 48 306 376`. Set `APPOINTMENT_SMS_TO` to change that.

### Anything else

`APPOINTMENT_WEBHOOK_URL` posts each request as JSON to any endpoint, which is
how you would connect Zapier, Make, n8n, a Google Sheet or a clinic CRM.

### Also set

| Name       | Value                     | Environments |
| ---------- | ------------------------- | ------------ |
| `SITE_URL` | `https://azalea-dent.org` | Production   |

This is the address the site calls itself in `sitemap.xml`, in the canonical
tags search engines read, and in the preview card that appears when someone
shares a link on WhatsApp or Facebook. Without it, Vercel falls back to the
`.vercel.app` address, so all of those point at the wrong place.

#### Where the environment variable screen is

1. **vercel.com** → log in.
2. Click the project, **azalea-dent**.
3. Top row of tabs → **Settings** (last one).
4. Menu down the left side → **Environment Variables**.
5. **Key** is the name from the table above, **Value** is the value. Type them
   in without quotes.
6. Under **Environments**, tick the boxes the table names. Production is the
   live site; Preview is the per-branch test deployments.
7. **Save**.

Changing an environment variable does **not** redeploy on its own: trigger a
redeploy afterwards (step 9), or nothing changes on the live site.

#### Checking the variable took effect

Open `https://azalea-dent.org/sitemap.xml` after the redeploy. It is a wall of
XML — that is normal. The only thing to look at is the addresses inside it:

- They read `azalea-dent.org` → it worked.
- They still read `azalea-dent.vercel.app` → the variable was not picked up.
  Check the Key for a typo and that **Production** was ticked, then redeploy
  again.

The name is `SITE_URL`, with no `NEXT_PUBLIC_` prefix. That prefix means "send
this to the browser", and Vercel warns when it sees one on a private variable.
The site only reads this on the server, so it does not need the prefix. If an
older deployment already has `NEXT_PUBLIC_SITE_URL` set, it still works and can
be left alone or renamed at leisure.

### Checking it works

After deploying, send yourself a request from `/appointment`. On success the
form shows a confirmation; if nothing is configured it says plainly that
nothing was sent and offers WhatsApp, Viber and Instagram instead. Vercel's
**Logs** tab records the reason for any delivery that failed.

## 3. Deploy

Click **Deploy**. The first build takes two to three minutes and you get a URL
like `azalea-dent-web.vercel.app`. Check it before connecting the domain.

## 4. Buy and connect the custom domain

### Buying it

`azalea-dent.org` was bought through Vercel itself (**Domains → Buy**), which
means Vercel is both the registrar and the DNS host: there are no nameservers
to point and no records to copy anywhere. Adding the domain to the project is
all that is needed.

Two things to check once, under **Domains → the domain → Edit**: that
**auto-renew** is on, and that **WHOIS privacy** is on so the clinic's details
are not published in the public domain record. A lapsed domain takes the
website and the email sender down together.

Both the apex (`azalea-dent.org`) and `www.azalea-dent.org` should be listed,
each showing _Valid Configuration_, with one of them redirecting to the other
so there is a single canonical address.

### Connecting it

1. **Settings → Domains → Add**.
2. Enter the apex domain: `azalea-dent.org`.
3. Add `www.azalea-dent.org` as well. Vercel will offer to redirect one to the
   other — **redirect `www` → apex** (or the reverse, but pick one and keep it,
   so there is only ever one canonical address).
4. Vercel then shows the exact DNS records to create. **Use the values Vercel
   shows you**, not values from a tutorial — they change over time.

## 5. DNS records

At your domain registrar (where you bought the domain), in its DNS editor:

| Type    | Name / Host                       | Value                  | TTL         |
| ------- | --------------------------------- | ---------------------- | ----------- |
| `A`     | `@` (the apex, `azalea-dent.org`) | `76.76.21.21`          | Auto / 3600 |
| `CNAME` | `www`                             | `cname.vercel-dns.com` | Auto / 3600 |

Notes:

- `@` means the domain itself. Some registrars want it blank or the full domain.
- If your registrar supports **ALIAS** or **ANAME** records, you may point the
  apex at `cname.vercel-dns.com` instead of the A record — slightly better,
  because it survives an IP change.
- **Delete any conflicting records first**: an existing `A`, `AAAA`, `ALIAS` or
  `CNAME` on `@` or `www`, and any parking-page record the registrar added.
- Leave `MX` and `TXT` records alone — those carry your email and domain
  verification, and are unaffected.
- If your DNS is behind Cloudflare, set the proxy status to **DNS only** (grey
  cloud) for these two records. Orange-cloud proxying in front of Vercel causes
  redirect loops.

Propagation is usually minutes, occasionally up to 48 hours. Vercel's Domains
page shows a green _Valid Configuration_ when it is done.

## 6. HTTPS / SSL

Nothing to do. Vercel issues and renews a Let's Encrypt certificate
automatically as soon as the DNS resolves, and redirects HTTP to HTTPS. If it
stays pending for more than an hour, it is almost always a leftover conflicting
DNS record from step 5.

## 7. Automatic deployments

Already configured by connecting the repository:

- A push to the production branch → deploys to production.
- A push to any other branch, or a pull request → a preview deployment with
  its own URL, posted as a comment on the PR.

The GitHub Actions workflow in `.github/workflows/ci.yml` runs typecheck, lint,
tests and a build on every push and pull request, so a broken change is caught
before it reaches the site.

## 8. Updating the site later

```bash
git checkout -b update-opening-hours
# edit src/content/clinic.ts
npm run check          # typecheck + lint + tests
git commit -am "Update opening hours"
git push -u origin update-opening-hours
```

Open a pull request, review the preview URL Vercel comments on it, then merge.
Production updates within a couple of minutes. For a trivial content change you
can commit straight to the production branch instead.

## 9. Redeploying and rolling back

**Redeploy** — needed after every environment variable change, because a
variable only reaches a build made after it was saved:

1. Project → the **Deployments** tab along the top.
2. The newest deployment is the top row. At its right-hand end, click the
   **⋯** (three dots).
3. **Redeploy**, then **Redeploy** again in the dialog that opens. The
   _Use existing Build Cache_ box can be left however it comes.
4. Two to three minutes later the status reads **Ready** and it is live.

**Roll back** — when a deployment turns out to be broken:

1. **Deployments** → find the last row that was working.
2. **⋯ → Promote to Production**.

It goes live in seconds, because Vercel keeps every past build. Then fix the
problem in git at your own pace.

## 10. After going live

- Add the site to **Google Search Console**, verify via the DNS `TXT` record,
  and submit `https://azalea-dent.org/sitemap.xml`.
- Create or claim the **Google Business Profile** for the clinic — for a local
  clinic that drives more traffic than anything on the website itself. Make the
  name, address, phone and opening hours match `src/content/clinic.ts` exactly.
- Add the website link to the Instagram bio.
- Check the structured data with the **Rich Results Test**
  (https://search.google.com/test/rich-results). It reports the clinic as a
  `Dentist` with its treatments and FAQ.
