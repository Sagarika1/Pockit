# Pockit

**Get your members paid back in minutes, not weeks.**

Pockit is a reimbursement tool for student clubs, volunteer groups and small nonprofits. A member snaps a photo of a receipt. AI reads it, the organization's own rules decide what happens, and approved requests are paid through PayPal, with a text message about every outcome. Treasurers only handle the exceptions.

Built for the PayPal AI hackathon. All payments run in the **PayPal sandbox** (test accounts, no real money).

## Why it exists

In clubs and volunteer groups, the people who run events pay out of pocket and then wait weeks to be repaid. Treasurers chase receipts from texts, email and paper, check each one by hand, and send payments one at a time. Pockit turns that into: snap a receipt, get a decision, get paid.

## Try it

### Option A: hosted demo (nothing to install)

> **Demo URL:** `https://YOUR-APP.onrender.com` (add the real link here before submitting)

| Role | Email | Password | Log in on the tab |
| --- | --- | --- | --- |
| Treasurer | `demo-treasurer@pockit.demo` | `pockit-demo-2026` | Organization |
| Member (approved) | `demo-member@pockit.demo` | `pockit-demo-2026` | Member |
| Applicant (waiting to join) | `demo-applicant@pockit.demo` | `pockit-demo-2026` | Member |

The hosted demo uses the **real AI**: Claude reads any receipt photo you upload, and any policy document on the Rules page. You can also try the 8 test receipts in [`sample-receipts/`](sample-receipts) (download them from this repo). Payments go to the PayPal sandbox (test money). The first visit can take about a minute while the free host wakes up. The host resets its files when it restarts, and the demo accounts come back by themselves.

### Option B: run it yourself (about 5 minutes)

You need **Node.js 20.9 or newer** and a free **PayPal sandbox app** (steps below). An Anthropic key is optional: without one the app runs in demo mode. The hosted demo above is the easiest way to see the real AI.

```bash
git clone https://github.com/Sagarika1/Pockit.git
cd Pockit
npm install
cp .env.example .env.local      # on Windows: copy .env.example .env.local
```

Open `.env.local` and fill in:

1. `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (see "PayPal sandbox setup")
2. `SESSION_SECRET`: any long random text (32+ characters)
3. `DEMO_MEMBER_PAYPAL_EMAIL`: the email of one of your sandbox **personal** accounts, so you can watch the payment arrive

Leave `ANTHROPIC_API_KEY` empty for **demo mode**, and keep `SEED_DEMO=true`. Then:

```bash
npm run dev
```

Open http://localhost:3000 and log in with the demo accounts above.

**Demo mode:** with no Anthropic key, Pockit reads the 8 receipts in `sample-receipts/` from saved answers instead of calling the AI. Everything after that is real: the rules, partial payments, approvals, text messages and PayPal sandbox payouts. Add an `ANTHROPIC_API_KEY` to read any receipt photo and any policy document.

## A 3-minute walkthrough

1. **Member:** log in as the demo member. Upload `meals-over-cap.png`. It's a $109.02 dinner and the meals limit is $50, so Pockit pays **$50** and explains why. A text message is sent.
2. Upload `hotel.png`. Hotels need approval, so it waits for the treasurer.
3. **Treasurer:** log in on the Organization tab. Under "Needs your decision", press **Approve and pay**. Pockit asks "Are you sure?" and lets you pay less than the full amount. Confirm. The member is texted.
4. Look at the **audit log**: every request, why it was decided, who decided, and what was paid. Search, sort, filter and export it.
5. Open **People**: approve the applicant, or add someone yourself.
6. Open **Rules**: change the limits, or upload a policy document and review what Pockit suggests.

## How it works

```
Member photo  ->  AI reads the receipt  ->  Your rules decide  ->  PayPal pays  ->  Text message
(shrunk in the      (Claude vision,         (plain code, not       (sandbox         (Twilio, or
 browser first)      structured output)      the AI)                Payouts API)     demo log)
                                                  |
                                    Not sure? Treasurer approves or denies
```

- **AI reads, rules decide.** Claude only extracts the facts (store, date, total, type, alcohol). A plain, tested rules engine makes every payment decision, so the AI can never approve money by itself.
- **Tamper-proof.** The receipt data is signed on the server. Editing the numbers before submitting is rejected.
- **Partial payments.** Spent $60 against a $50 limit? The member is paid $50 (an organization can turn this off). Treasurers can also pay less than the full amount.
- **Safety checks.** Alcohol, dates outside the event, receipts dated in the future, duplicate receipts and non-USD receipts never pay automatically.
- **Per-organization rules.** Limits per category, event dates, an automatic payment ceiling and more. A treasurer can upload a policy document and the AI suggests the rules. The treasurer reviews and saves them.

### Where the sponsor tools are used

| Tool | How Pockit uses it |
| --- | --- |
| **PayPal (sandbox)** | Payouts API sends every approved reimbursement. Sandbox accounts only. |
| **Anthropic Claude** | Vision reads receipts. Document understanding turns a policy file into suggested rules. Both use structured tool output. |
| **AG Grid** | The treasurer's audit log: sorting, filtering, quick search and CSV export. |
| **Render** | Hosting (`render.yaml` included). |
| Twilio (optional) | Text messages for every decision. Without keys they appear in a "Text messages" panel instead. |

## PayPal sandbox setup

1. Go to https://developer.paypal.com and log in (it's free).
2. **Apps & Credentials**, make sure **Sandbox** is selected, then **Create App**. Copy the **Client ID** and **Secret** into `.env.local`.
3. **Testing Tools > Sandbox Accounts**: use (or create) a **Personal** account and put its email in `DEMO_MEMBER_PAYPAL_EMAIL`. Log in to that account at https://www.sandbox.paypal.com to watch payments arrive.
4. Keep `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`.

Payments are drawn from the sandbox business account that owns the app. Per-organization PayPal funding is not part of this prototype.

## Settings reference

| Variable | Needed? | What it does |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Yes | PayPal sandbox app credentials |
| `PAYPAL_API_BASE` | Yes | `https://api-m.sandbox.paypal.com` |
| `SESSION_SECRET` | Yes | Signs login cookies and receipt data (32+ random characters) |
| `ANTHROPIC_API_KEY` | No | Real AI reading. Leave empty for demo mode |
| `SEED_DEMO` | No | `true` creates the demo accounts when the app starts with none |
| `DEMO_MEMBER_PAYPAL_EMAIL` | No | Where the demo member's payments go |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | No | Send real text messages |
| `APP_URL` | No | Link used in text messages |

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New > Blueprint**, choose the repo. `render.yaml` sets everything up.
3. Add the secret values it asks for: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `ANTHROPIC_API_KEY` (this turns on the real AI) and `DEMO_MEMBER_PAYPAL_EMAIL`.
4. Anyone with the URL can use the demo accounts above. Use a separate Anthropic key with a low spending limit.

## Project layout

```
app/                  pages and API routes (Next.js App Router)
  api/auth, api/me    sign up, log in, who am I
  api/claims          submit, list and decide reimbursements
  api/parse-receipt   AI receipt reader (demo mode: saved answers)
  api/rules           per-organization rules, plus the policy upload
  treasurer/          overview, audit log (AG Grid), people, rules
  submit/             member screen
lib/
  policy.ts           the rules engine (pure, tested)
  rules.ts            rule settings and plain-language summaries
  paypal.ts           PayPal sandbox payouts
  sms.ts, notify.ts   text messages
  demoReader.ts       demo mode
  seed.ts             demo accounts
sample-receipts/      8 test receipts (made-up businesses)
```

## What we built during the hackathon

Pockit began as a single-page receipt checker with one PayPal payout. During the hackathon we added: organization and member accounts with logins, the join and approve flow, treasurers adding people, per-organization rules with a policy-document upload, partial reimbursements, treasurer approval with a confirmation step and adjustable amount, text messages for every outcome, a redesigned plain-language interface with an audit log, browser-side photo shrinking, demo mode and a hosted deployment.

## Limits (honest list)

- Prototype data is stored in JSON files in `data/` (git-ignored). Use a real database for production.
- Payouts come from one sandbox business account. Org-level funding with PayPal checkout is future work.
- Real text messages need Twilio. A Twilio trial can only text verified numbers.
- Accounts have no password reset or profile editing yet.

## License

[MIT](LICENSE)
