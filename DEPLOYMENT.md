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
3. Under *Import Git Repository*, pick **`bardhakorqajj/azalea-dent-web`**.
   If it is not listed, click *Adjust GitHub App Permissions* and grant access.
4. Vercel detects Next.js and fills in everything:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

   Leave all of it as-is.
5. Set the production branch to the branch you merge into (**Settings → Git →
   Production Branch**), usually `main`.

## 2. Turn on appointment requests

This is the one part of the site that cannot work until you create an account
somewhere: sending email or SMS needs credentials, and only you can issue them.
Everything else is already wired. Requests go to
**azaleadent@hotmail.com** and **+383 48 306 376** by default, so you only add
the provider keys, not the destinations.

Every channel you configure is used, so a request can arrive as an email *and*
a text at the same time. If one provider fails, the others still deliver.

### Email (start here, free)

1. Create an account at **https://resend.com**.
2. **API Keys → Create API Key**, with *Sending access*. Copy it once; it is
   not shown again.
3. In Vercel, **Settings → Environment Variables**, add for Production and
   Preview:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the `re_…` key |

   That is enough. Requests arrive at `azaleadent@hotmail.com`.

4. **Before going live**, verify a domain so mail is not filtered as spam:
   **Domains → Add Domain**, enter `azaleadent.com`, add the DKIM and SPF
   records Resend shows you at your DNS provider, then set:

   | Name | Value |
   | --- | --- |
   | `APPOINTMENT_FROM_EMAIL` | `Azalea Dent <takime@azaleadent.com>` |

   Without a verified domain, Resend only delivers to the address that owns the
   Resend account. Fine for testing, not for production.

**Getting requests on the phone without paying for SMS:** add
`azaleadent@hotmail.com` to the Mail app on the phone and turn on
notifications for it. Every request then arrives as a push notification, at no
cost. Most small clinics do this and never set up SMS at all.

### Text message (optional, costs money per message)

Only worth it if email notifications are not reliable enough for you.

1. Create an account at **https://twilio.com** and buy a number that can send
   to Kosovo (+383). Check Twilio's SMS pricing and geographic permissions for
   Kosovo first: some routes need it enabled explicitly under
   *Messaging → Settings → Geo permissions*.
2. Add:

   | Name | Value |
   | --- | --- |
   | `TWILIO_ACCOUNT_SID` | `AC…` from the Twilio console |
   | `TWILIO_AUTH_TOKEN` | the auth token |
   | `TWILIO_FROM_NUMBER` | the Twilio number, e.g. `+15550100000` |

   Texts go to `+383 48 306 376`. Set `APPOINTMENT_SMS_TO` to change that.

### Anything else

`APPOINTMENT_WEBHOOK_URL` posts each request as JSON to any endpoint, which is
how you would connect Zapier, Make, n8n, a Google Sheet or a clinic CRM.

### Also set

| Name | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://azaleadent.com` (your real domain) | Production |

Changing an environment variable does **not** redeploy on its own: trigger a
redeploy afterwards (step 9).

### Checking it works

After deploying, send yourself a request from `/sq/appointment`. On success the
form shows a confirmation; if nothing is configured it says plainly that
nothing was sent and offers WhatsApp, Viber and Instagram instead. Vercel's
**Logs** tab records the reason for any delivery that failed.

## 3. Deploy

Click **Deploy**. The first build takes two to three minutes and you get a URL
like `azalea-dent-web.vercel.app`. Check it before connecting the domain.

## 4. Connect the custom domain

1. **Settings → Domains → Add**.
2. Enter the apex domain: `azaleadent.com`.
3. Add `www.azaleadent.com` as well. Vercel will offer to redirect one to the
   other — **redirect `www` → apex** (or the reverse, but pick one and keep it,
   so there is only ever one canonical address).
4. Vercel then shows the exact DNS records to create. **Use the values Vercel
   shows you**, not values from a tutorial — they change over time.

## 5. DNS records

At your domain registrar (where you bought the domain), in its DNS editor:

| Type | Name / Host | Value | TTL |
| --- | --- | --- | --- |
| `A` | `@` (the apex, `azaleadent.com`) | `76.76.21.21` | Auto / 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto / 3600 |

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
page shows a green *Valid Configuration* when it is done.

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

**Redeploy** (after changing an environment variable):
Vercel dashboard → **Deployments** → the most recent one → **⋯ → Redeploy**.

**Roll back:**
**Deployments** → find the last good deployment → **⋯ → Promote to Production**.
It goes live in seconds, because Vercel keeps every past build. Then fix the
problem in git at your own pace.

## 10. After going live

- Add the site to **Google Search Console**, verify via the DNS `TXT` record,
  and submit `https://azaleadent.com/sitemap.xml`.
- Create or claim the **Google Business Profile** for the clinic — for a local
  clinic that drives more traffic than anything on the website itself. Make the
  name, address, phone and opening hours match `src/content/clinic.ts` exactly.
- Add the website link to the Instagram bio.
- Check the structured data with the **Rich Results Test**
  (https://search.google.com/test/rich-results). It reports the clinic as a
  `Dentist` with its treatments and FAQ.
