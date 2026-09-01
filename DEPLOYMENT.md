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

## 2. Configure environment variables

Before the first deploy, open **Settings → Environment Variables** and add:

| Name | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://azaleadent.com` (your real domain) | Production |

Then, once you have chosen how appointment requests should reach the clinic,
add **either** the Resend pair **or** the webhook (see `.env.example`):

| Name | Value | Environments |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_…` from resend.com | Production, Preview |
| `APPOINTMENT_TO_EMAIL` | the clinic inbox | Production, Preview |
| `APPOINTMENT_FROM_EMAIL` | `Azalea Dent <takime@azaleadent.com>` | Production, Preview |

or

| Name | Value | Environments |
| --- | --- | --- |
| `APPOINTMENT_WEBHOOK_URL` | your Zapier/Make/n8n endpoint | Production, Preview |

Changing an environment variable does **not** redeploy on its own — trigger a
redeploy afterwards (step 9).

Until one of these is set the form still works: it tells patients plainly that
online sending is not active and points them to WhatsApp and Instagram.

### Setting up Resend (if you choose email)

1. Create a free account at **https://resend.com**.
2. **Domains → Add Domain**, enter `azaleadent.com`, and add the DKIM/SPF
   records Resend shows you at your DNS provider.
3. **API Keys → Create API Key**, with *Sending access*. Copy it once — it is
   not shown again.
4. Put it in `RESEND_API_KEY` on Vercel.

Without a verified domain, Resend only delivers to the account owner's own
address. That is fine for testing, not for production.

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
