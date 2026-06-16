# Supabase Integration Guide for Trip Buddy

This guide explains how to connect your own Supabase instance to **Trip Buddy** to enable real user authentication, cloud trip saving, and photo-supported place reviews.

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in or sign up.
2. Click **New Project** and select your organization.
3. Configure your project:
   - **Name**: `Trip Buddy`
   - **Database Password**: Enter a secure password (make sure to remember it).
   - **Region**: Select a region close to your target audience (e.g., `Mumbai (ap-south-1)` for India).
   - **Pricing Plan**: Choose the **Free** tier (or whichever fits your needs).
4. Click **Create new project** and wait a few minutes for your database to provision.

---

## Step 2: Copy API Credentials

1. Once your project is ready, click on the **Project Settings** (gear icon) in the bottom-left corner of the sidebar.
2. Navigate to the **API** tab.
3. Copy the following credentials:
   - **Project URL** (under the "Project URL" section)
   - **anon public API Key** (under the "Project API keys" section)

---

## Step 3: Configure Environment Variables

1. Open your local project's [`.env`](file:///c:/Users/shubh/OneDrive/Desktop/Trip%20Buddy/.env) file.
2. Replace the placeholder values on lines 6 and 7:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   with your copied **Project URL** and **anon public API Key** from Step 2:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-copied-anon-key>
   ```
3. Save the `.env` file.

---

## Step 4: Run the Database Schema

1. Go to the **SQL Editor** tab (the `SQL` terminal icon) on the left sidebar of your Supabase Dashboard.
2. Click **New Query** -> **Blank query**.
3. Open the [`supabase/schema.sql`](file:///c:/Users/shubh/OneDrive/Desktop/Trip%20Buddy/supabase/schema.sql) file in your project.
4. Copy the entire contents of `schema.sql` and paste it into the Supabase SQL editor.
5. Click **Run** (or press Ctrl + Enter).
   - This automatically creates the following tables:
     - `places`: Caches details of recommended hotels, cafes, tourist spots, etc.
     - `trips`: Stores user-saved travel plans.
     - `trip_recommendations`: Connects places to specific user trips.
     - `feedback`: Stores user ratings, reviews, and feedback.
     - `feedback_photos`: Maps photo URLs to their corresponding feedback.
   - It also enables Row-Level Security (RLS) policies so users can only manage their own trips and feedback.

---

## Step 5: Set Up Storage for Feedback Photos

To allow travelers to upload photos with their reviews, you must set up a Supabase Storage bucket:

1. Click on the **Storage** tab (the bucket icon) on the left sidebar of your Supabase Dashboard.
2. Click **New bucket**.
3. Name the bucket exactly: `feedback-photos`
4. **Important**: Turn ON the **Public bucket** toggle. This allows everyone to view review images.
5. Click **Create bucket**.
6. Set up policies to allow uploads:
   - In the storage list, select `feedback-photos` and click **Policies** (or **Add policies**).
   - Under **Allowed operations**, click **New policy** -> **For full customization**.
   - Name the policy `Allow authenticated uploads`.
   - Set **Allowed operations** to check `INSERT` (and optionally `SELECT`).
   - Under **Target roles**, select `authenticated`.
   - Set the policy expression to `true` (or use the built-in wizard to authorize authenticated users).
   - Save the policy.

---

## Step 6: Restart Server & Test

1. Stop your local development server if it is running (Ctrl + C in your terminal).
2. Start the server again:
   ```bash
   npm run dev
   ```
3. Notice that the warning banner `"Supabase is not configured yet..."` on the login screen has now vanished!
4. **Test Authentication**:
   - Register a new account with email/password (or sign in).
   - Plan a trip, click **Save Trip** (it will save directly to your live database).
   - View your trips in **My Trips** (fetched directly from Supabase).
   - Leave a review with ratings and uploaded photos under a place details page and check your Supabase Storage bucket and `feedback` database tables to confirm the records appear!

---

## (Optional) Step 7: Configure Google Authentication

If you want the **"Continue with Google"** button to function in production:
1. Set up OAuth credentials in the Google Cloud Console.
2. Go to **Authentication** > **Providers** > **Google** on your Supabase Dashboard.
3. Toggle Google **Enabled** and paste your **Client ID** and **Client Secret**.
4. Copy the **Redirect URI** provided by Supabase and paste it into Google Cloud Console's authorized redirect URIs.

---

## 🛠️ Troubleshooting: "Email Rate Limit Exceeded"

If you see the error **"email rate limit exceeded"** during signup or login, it is because Supabase has a strict rate limit of 3-4 signup/login confirmation emails per hour by default.

To resolve this immediately:
1. **Disable Email Confirmation (Recommended for testing)**:
   * Go to **Authentication** > **Providers** > **Email** in your Supabase Dashboard.
   * Toggle off **Confirm email** (this allows users to register and sign in instantly without having to click a confirmation link in their email inbox).
   * Click **Save**.
2. **Increase Rate Limits**:
   * Go to **Settings** (gear icon) > **Authentication** > **Rate Limits** section.
   * Under **Rate Limits**, you can increase the **Max Emails Sent per hour** (or adjust other IP rate limits) to a higher value.

