# 🚀 SplitStay - Shared Expense & Roommate Balance Tracker

SplitStay is a modern web application for tracking shared household expenses, roommate balance settlements, and automated WhatsApp notifications powered by Supabase Edge Functions and Twilio.

---

## 🛠️ Stack Architecture

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Authentication**: Clerk (`@clerk/clerk-react`)
- **Backend / Edge Functions**: Supabase (`@supabase/supabase-js`), Deno Edge Functions
- **WhatsApp Notifications**: Twilio Messages API

---

## 🌐 Deploying Frontend to Vercel

1. **Push to GitHub**:
   - Create a new GitHub repository named `split-stay`.
   - Push all project files to GitHub.

2. **Deploy on Vercel**:
   - Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
   - Select your `split-stay` GitHub repository.
   - Set **Build Command**: `npm run build`
   - Set **Output Directory**: `dist`
   - Add Environment Variables in Vercel settings (copy actual values from your local `.env`, never commit them):
     ```env
     VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Click **Deploy**.

---

## ⚡ Backend / Edge Functions Deployment (Supabase)

Your backend WhatsApp Edge function is located at `supabase/functions/send-whatsapp/index.ts`.

- **Deploy command**:
  ```bash
  npx supabase functions deploy send-whatsapp
  ```
- **Set Twilio Secrets in Supabase** (never hardcode these anywhere in the repo):
  ```bash
  npx supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_account_sid
  npx supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_auth_token
  npx supabase secrets set TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
  ```

---

## 💻 Local Development

```bash
# 1. Copy the example env file and fill in your real values
cp .env.example .env

# 2. Install Dependencies
npm install

# 3. Start Vite Local Development Server
npm run dev

# 4. Build for Production
npm run build
```
