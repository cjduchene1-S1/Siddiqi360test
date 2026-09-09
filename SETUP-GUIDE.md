# Siddiqi 360 — Backend & Build Setup Guide

This covers two independent things that were just added. Do them in either
order, or in parallel.

---

## Part A — Access codes (Supabase + Netlify Functions)

**What you're setting up:** a real database of valid access codes, plus an
admin page (`admin.html`) for office staff to generate and revoke them. Until
this is live, the sign-in screen will fail every code (the app now actually
checks, instead of accepting anything) — so do this before pushing to
patients.

1. **Create a free Supabase account** at supabase.com → New Project. Pick any
   project name (e.g. "siddiqi360") and a strong database password (save it
   somewhere — you won't need it day-to-day, but Supabase asks for it once).

2. **Run the schema.** In the Supabase dashboard, go to the SQL Editor → New
   query, paste in the entire contents of `supabase-schema.sql` from this
   folder, and click Run. This creates the `access_codes` table.

3. **Grab two keys.** In the Supabase dashboard, go to Project Settings → API.
   You need:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role key** (NOT the "anon" key — the service_role one; it's
     labeled clearly and Supabase warns you it's secret, which is correct,
     keep it private)

4. **Add those to Netlify.** In your Netlify site dashboard → Site
   configuration → Environment variables, add:
   - `SUPABASE_URL` = the Project URL from step 3
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key from step 3
   - `ADMIN_SECRET` = make up a strong password of your own — this is what
     protects `admin.html` from randoms on the internet. Treat it like a
     shared office password (e.g. store it in whatever the practice already
     uses for shared logins).

5. **Push the new files to GitHub** — `supabase-schema.sql` doesn't need to
   go live (it's just the one-time setup script), but everything else does:
   `admin.html`, the whole `netlify/functions/` folder, and the updated
   `index.html`. Same drag-and-drop process as always; just make sure the
   `netlify` folder's structure (`netlify/functions/*.js`) is preserved,
   the same way the `images` folder needed to stay a real folder.

6. **Netlify auto-detects the functions folder** and deploys each `.js` file
   in it as a live serverless endpoint — no extra configuration needed there.

7. **Test it:** visit `yoursite.netlify.app/admin.html`, enter the
   `ADMIN_SECRET` you set in step 4, generate a test code, then try signing
   into the actual app with that code on another tab. If it works, you're
   live. Bookmark `/admin.html` somewhere the front-desk staff can find it —
   it's not linked from the patient-facing app on purpose.

---

## Part B — Building the native app without a Mac (Codemagic)

**What you're setting up:** a pipeline that turns the existing web app into a
real iOS/Android app, entirely in the cloud.

1. **Push everything to GitHub** if it isn't already there — `package.json`,
   `capacitor.config.json`, and `codemagic.yaml` all need to be at the root
   of the repo alongside `index.html`.

2. **Create a free Codemagic account** at codemagic.io, sign in with GitHub,
   and add this repository. Codemagic will detect `codemagic.yaml`
   automatically and show the two workflows (`ios-workflow`,
   `android-workflow`) already defined in it.

3. **Connect Apple.** In Codemagic → your app → Settings → Integrations →
   App Store Connect, follow their prompts to add an App Store Connect API
   key (generated from your Apple Developer account once that's set up —
   this is a few clicks in App Store Connect, no Xcode involved). Name the
   integration `siddiqi360_appstore` to match what's referenced in
   `codemagic.yaml`, or update that name in the file to match whatever you
   called it.

4. **Connect Google Play** the same way, under a service account credential,
   if you're ready for Android too — this can wait until iOS is working if
   you'd rather do them one at a time.

5. **Kick off a build.** Codemagic builds are triggered by pushing a Git tag
   matching the patterns in `codemagic.yaml` (`ios-*` or `android-*`) — for
   example, running `git tag ios-1 && git push --tags` from wherever your
   repo lives (this can be done right from GitHub's web interface too, under
   Releases → Create a new tag, no command line needed). Or, in the
   Codemagic dashboard, you can just click "Start new build" manually on a
   workflow without needing a tag at all — that's the simpler way to do your
   first test build.

6. **Watch it build.** Codemagic spins up a real Mac in their cloud, runs
   through the steps in `codemagic.yaml` (installs Capacitor, adds the native
   iOS project, builds, signs, and uploads to TestFlight), and shows you
   live logs the whole time. A typical build takes several minutes.

7. **First build will likely need a couple of iterations** — this is normal
   for any first-time native app setup, Mac or no Mac. Common early hiccups:
   missing signing certificate (Codemagic can auto-generate one through the
   App Store Connect integration), or a plugin needing a version bump. The
   build logs tell you exactly what failed.

Once a build succeeds, it lands in TestFlight automatically (per the
`submit_to_testflight: true` line in `codemagic.yaml`) — from there, follow
Phase 3 of the original strategic plan (add Dr. Siddiqi and a nurse as
TestFlight testers, gather feedback, then submit for real App Store review).

---

## What's still manual / needs a human decision

- The exact notification wording and daily reminder time (currently set to
  9:00 AM, generic text) can be adjusted in `index.html`'s
  `scheduleLocalNotifications()` function once you've seen it in action.
- The admin page's `ADMIN_SECRET` should be treated as sensitive — anyone
  with it can generate or revoke codes. Rotate it if you ever suspect it's
  leaked, by just changing the Netlify environment variable.
- Google Play's one-time $25 fee and Apple's $99/year are still the two real
  costs in this whole setup, as covered in the strategic plan.
