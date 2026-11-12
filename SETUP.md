# Pockit update: logins, orgs, SMS, rules, new homepage

## Before you start
1. Tell your partner you're about to change these files, then run `git pull` so you have her latest.
2. Unzip this folder **on top of your project root** (the folder with `package.json`). Say yes to "replace files".

## Files this REPLACES (existing files)
- lib/policy.ts, lib/store.ts, lib/rules.ts is new (default event dates are now Nov 5 to Nov 8, 2026)
- app/page.tsx (the homepage is now the landing page; the receipt upload moved to /submit)
- app/api/claims/route.ts, app/api/parse-receipt/route.ts
- app/treasurer/page.tsx, app/treasurer/AuditGrid.tsx
- components/StatusChip.tsx, PoweredByPayPal.tsx, SiteHeader.tsx, SiteFooter.tsx
- public/paypal-logo-color.png (trimmed so it shows bigger)

Everything else in the zip is new. No new npm packages are needed.

## One new setting in .env.local
Add this line (any long random text, 32+ characters). It signs the login cookies:

    SESSION_SECRET=paste-a-long-random-string-here

Optional: `APP_URL=http://localhost:3000` (used in the text message links).

## Text messages (optional)
With no Twilio settings, Pockit runs in demo mode: texts are not sent, they show in the
"Text messages we've sent" box on the treasurer page. To send real texts add:

    TWILIO_ACCOUNT_SID=...
    TWILIO_AUTH_TOKEN=...
    TWILIO_FROM=+1XXXXXXXXXX

A Twilio trial account can only text phone numbers you've verified in Twilio.

## Then
    npm run dev
Try it: /signup/org (create a club) -> /signup/member in a private window (ask to join)
-> approve on People -> upload a receipt on /submit.

## Good to know
- Accounts live in the `data/` folder, which git ignores. Each computer has its own accounts.
- Old claims saved before this update won't show up (they have no organization).
- Payments still come from your one PayPal sandbox business account. Each org's PayPal email is stored but not charged.

## Sample receipts
`sample-receipts/` has 8 redrawn receipts dated Nov 5 to Nov 8, 2026, so they pass the
"not in the future" check and match the default event dates. Copy them over the old ones.
If you already created an org, its rules still have the old dates. Open Rules and set the
event dates to Nov 5 and Nov 8 (or delete the `data` folder to start fresh).
