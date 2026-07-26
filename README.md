# ◆ Ledger — your personal finance app

A private financial ledger: accounts, transactions, budgets, reports,
recurring transactions, and savings goals. Built with Next.js 16 +
Supabase (database + login). Your data is protected by Row-Level
Security, so only you can ever read your own records.

---

## What you need to do (about 10 minutes)

Everything is coded and ready. To make it *run*, we need to connect it to
your own free database. Follow these steps in order.

### Step 1 — Create a free Supabase project

1. Go to **https://supabase.com** and click **Start your project** (sign in
   with GitHub or email — it's free).
2. Click **New project**.
   - **Name:** `ledger` (anything is fine)
   - **Database Password:** click *Generate a password* and **save it**
     somewhere safe (you won't need it day-to-day, but keep it).
   - **Region:** pick the one closest to you.
3. Click **Create new project** and wait ~2 minutes while it sets up.

### Step 2 — Copy your two keys into the app

1. In your Supabase project, open **Project Settings** (gear icon) →
   **API** (or **API Keys**).
2. Find these two values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon / public key** (a long string, safe to use in a browser)
3. Open the file **`.env.local`** in this project and replace the
   placeholders:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key
   ```

   Save the file.

### Step 3 — Create the database tables

1. In Supabase, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open **`supabase/schema.sql`** from this project, copy the **entire**
   contents, paste it into the editor, and click **Run**.
4. You should see "Success. No rows returned." That's correct — it just
   built your tables and security rules.

### Step 4 — (Recommended for personal use) Turn off email confirmation

So you can log in immediately without clicking a confirmation email:

1. In Supabase: **Authentication** → **Sign In / Providers** (or
   **Providers → Email**).
2. Turn **off** "Confirm email".
3. Save.

> If you leave it on, after signing up you'll need to click a link in your
> email before you can log in. Either way works.

### Step 5 — Run it on your computer

In a terminal, from this folder:

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser. Sign up, log in, and
start adding accounts and transactions!

---

## Step 6 — Put it online (so you can use it from your phone)

Once it works locally, deploy it free with Vercel:

1. Create a free account at **https://vercel.com** (sign in with GitHub).
2. Push this project to a **private** GitHub repository:
   ```bash
   git add .
   git commit -m "My finance ledger"
   # create an empty repo on github.com first, then:
   git remote add origin https://github.com/YOUR-USERNAME/ledger.git
   git push -u origin main
   ```
3. In Vercel: **Add New… → Project**, import your `ledger` repo.
4. Before deploying, expand **Environment Variables** and add the same two
   values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. In ~1 minute you'll get a URL like
   `https://ledger-yourname.vercel.app` — open it on any device and log in.

> **Tip:** After deploying, go to Supabase → **Authentication → URL
> Configuration** and add your Vercel URL as a **Site URL** / redirect URL.

---

## How the app is organized (for your learning)

```
src/
├─ app/
│  ├─ page.tsx              Landing page
│  ├─ login/, signup/       Auth pages
│  ├─ auth/actions.ts       Login / signup / logout logic
│  └─ (app)/                The logged-in app (protected)
│     ├─ layout.tsx         Sidebar + top bar shell
│     ├─ dashboard/         Overview: net worth, cash flow
│     ├─ accounts/          Manage accounts
│     ├─ transactions/      Add / edit / delete transactions
│     ├─ budgets/           Monthly budgets per category
│     ├─ reports/           Charts
│     ├─ recurring/         Repeating transactions
│     └─ goals/             Savings goals
├─ components/              Reusable UI pieces
├─ lib/
│  ├─ supabase/             Database connection helpers
│  ├─ auth.ts               "Is the user logged in?" helper
│  ├─ types.ts              Shapes of our data
│  └─ format.ts             Money & date formatting
└─ proxy.ts                 Keeps you logged in + guards private pages

supabase/schema.sql         The database blueprint (run once, Step 3)
```

### Key ideas
- **Server Components** fetch your data securely on the server before the
  page loads.
- **Server Actions** (the `actions.ts` files) handle saving/editing data.
- **Row-Level Security** in the database is the real lock on your data —
  even if the app had a bug, the database refuses to hand your rows to
  anyone else.

---

## Common commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run locally for development (http://localhost:3000) |
| `npm run build` | Make a production build (checks everything compiles) |
| `npm start` | Run the production build locally |
