# Tavus B2B Video Lead Agent — MVP + n8n Automation

Website video-call agent (Zain) built on Tavus CVI. The Next.js app creates
PAL-based conversations server-side, receives Tavus lifecycle webhooks, and
forwards each event to n8n for lead extraction, qualification, storage, and
follow-up.

## How it fits together

```
Visitor clicks "Start video conversation"
        ↓
Next.js POST /api/conversations → Tavus creates a PAL conversation
        ↓
Visitor talks to Zain in the embedded conversation iframe
        ↓
Tavus POSTs lifecycle events to /api/webhooks/tavus
        ↓
This app validates and forwards the raw event to n8n
        ↓
n8n verifies the secret → fetches the transcript → Claude extracts and
qualifies the lead → Google Sheets / Gmail / Google Calendar follow-up
```

## 1. Set up Tavus

1. Create the public-site default PAL in Tavus once, then add its `pal_id`
   below. After the app is deployed, use **/dashboard** to manage its PALs;
   dashboard changes are proxied directly to Tavus.
2. If the PAL requires a particular face, copy its `face_id`; otherwise leave
   `TAVUS_FACE_ID` blank.
3. Create a deployment for the PAL. In its **Limits & security** panel, add
   your production site to **Allowed Websites** and set appropriate call
   limits before sharing the site publicly.
4. Copy `.env.example` to `.env.local`, then set `TAVUS_API_KEY`,
   `TAVUS_PAL_ID`, and (optionally) `TAVUS_FACE_ID`. Do not expose the API key
   in browser code.

## 2. Run the Next.js app

```bash
npm install
cp .env.example .env.local
npm run dev
```

For local webhook testing, expose the app with:

```bash
ngrok http 3000
```

Copy the forwarding URL and set:

```bash
TAVUS_CALLBACK_URL=https://your-ngrok-forwarding-url/api/webhooks/tavus
```

Restart the dev server after changing environment variables. Use a stable,
HTTPS production URL for `TAVUS_CALLBACK_URL` when deploying.

## 2a. Set up Supabase for the PAL dashboard

1. Create a Supabase project, then open its SQL Editor and run
   `supabase/migrations/0001_init.sql` from this repository.
2. Copy the project URL and anon key into `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. For local development, turn off **Confirm email** in
   **Authentication → Settings**. Keep it enabled for a production app unless
   you have completed the email confirmation flow.
4. Create an account at `/signup`, sign in at `/login`, and open `/dashboard`.

## 3. Set up n8n

1. In n8n, choose **Workflows → Import from File** and select
   `n8n/tavus-lead-automation.json`.
2. Set these n8n environment variables: `WEBHOOK_SHARED_SECRET`,
   `TAVUS_API_KEY`, and `ANTHROPIC_API_KEY`.
3. Open **Save Lead to Google Sheets**, connect Google, replace the placeholder
   spreadsheet ID, and ensure its `Leads` sheet has headers matching the
   mapped columns.
4. Open **Notify Sales Team**, connect Gmail, and replace the placeholder
   sales recipient address.
5. Connect Google Calendar and Gmail for **Create Google Meet Event** and
   **Send Meeting Confirmation to Lead**. Calendar must have permission to
   create conference data so it can attach a Google Meet link.
6. Activate the workflow and copy its production webhook URL into
   `N8N_WEBHOOK_URL` in `.env.local`.
7. Use the exact same `WEBHOOK_SHARED_SECRET` in n8n and `.env.local`.

The workflow accepts the app's forwarded webhook, verifies the shared secret,
processes only `application.transcription_ready` events, fetches the full
Tavus transcript, calls Anthropic's `claude-sonnet-4-6`, stores the parsed lead
in Google Sheets, notifies sales for leads whose status is not `unqualified`,
and creates a Google Meet plus confirmation email when a visitor requested a
meeting and supplied an email address.

## 4. Test end to end

1. Start the app, click **Start video conversation**, and talk to Zain.
2. End the conversation and confirm the transcription-ready event reaches the
   Next.js webhook and n8n execution log.
3. Confirm a lead row appears in Google Sheets.
4. For a qualified lead, confirm the sales notification arrives. For a meeting
   request with an email address, confirm the calendar event and email.

## Meeting-booking limitation

The imported workflow uses tomorrow from 10:00–10:30 as an MVP placeholder.
Before production, replace it with a real availability check or a scheduling
tool so meetings cannot be double-booked.

## Operational notes

- The in-memory rate limiter and webhook idempotency cache reset on server
  restart and are per-instance. Use Redis or a database before scaling.
- Webhook forwarding failures are logged and acknowledged to Tavus to avoid
  retry loops. Add monitoring or a dead-letter queue for production recovery.
- `ANTHROPIC_API_KEY` belongs in n8n's environment; this Next.js app does not
  read it.

## File map

```
app/page.tsx                     Landing page and Tavus conversation iframe
app/api/conversations/route.ts   Creates PAL conversations server-side
app/api/webhooks/tavus/route.ts  Validates and forwards Tavus events to n8n
lib/tavus.ts                     Tavus PAL Conversations API client
n8n/tavus-lead-automation.json   Importable lead-processing workflow
.env.example                     Required environment-variable template
```
