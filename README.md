# BDLTA Web Frontend

This is the official frontend for the Bhagalpur District Lawn Tennis Association (BDLTA). It is built with Next.js and supports the public website, player registration and portal, administrative workflows, tournament registration, and payment flows.

## Overview

The platform helps BDLTA manage:

- Public content and announcements
- Player membership and profile management
- Tournament listings and registrations
- Court fee and membership payments via Razorpay
- Admin dashboards for players, tournaments, memberships, and reports
- Email communications using Resend
- Player card generation and sending

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication, storage, and database access
- Razorpay for online payments
- Resend for email sending

## Features

- Visitor-facing landing page and association information
- Tournament pages and registration flow
- Player dashboard with memberships and fee status
- Admin pages for management and moderation
- Secure auth integration with Supabase
- Payment verification for tournament, court fee, and membership transactions
- Email and PDF-based player card workflows

## Project Structure

```bash
app/
  admin/
  api/
  auth/
  login/
  player/
  tournaments/
  signup/
src/
  components/
  lib/
    email/
    supabase/
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20+
- npm or pnpm
- A Supabase project
- A Razorpay account
- A Resend account

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

If there is no `.env.example` in the repo, create `.env.local` manually with the variables below.

## Environment Variables

Create a `.env.local` file with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="BDLTA <your-email@domain.com>"
```

> These values are required for Supabase auth, payment verification, and email delivery.

## Running the App

Development mode:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev     # start local development server
npm run build   # create production build
npm run start   # run production build locally
npm run lint    # run ESLint checks
```

## Production Build

```bash
npm run build
npm run start
```

## Deployment

This app is ready to be deployed on a platform like Vercel, provided all environment variables are configured in the deployment environment.

For Vercel deployment:

1. Import the repository to Vercel
2. Set the environment variables listed above
3. Deploy the app

## Notes

- The app uses App Router conventions under the `app/` directory.
- Payment-related endpoints live under `app/api/*` and rely on Razorpay signature verification.
- Supabase is used for user authentication, database access, and storage.
- The project is designed for a tennis association workflow and may require matching Supabase database schema and permissions for all admin and player features to work correctly.

## Contributing

Contributions are welcome. Please keep changes focused, test locally, and update documentation when app behavior changes.

## License

This project is private and intended for the BDLTA organization.
