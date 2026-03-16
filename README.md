# CommissionHQ

Commission management for sales reps: deal tracking, payouts, and Active Clients. Integrates with GoHighLevel via webhook.

## Development (Cursor / local)

**Requirements:** Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:8080`.

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deploying

Deploy to **Vercel** (recommended for the webhook API):

```sh
npx vercel
```

Or connect your repo to [Vercel](https://vercel.com) for automatic deploys on push.

Your app URL will be something like `https://your-project.vercel.app`.

## GoHighLevel Webhook

When a rep tags a contact in HighLevel, the webhook sends the contact data to this app.

1. **Deploy** the app (e.g. to Vercel)
2. **Webhook URL:** `https://YOUR_DOMAIN/api/webhook`
   - Example: `https://commission-hq.vercel.app/api/webhook`
3. **In GoHighLevel**, create a webhook trigger (e.g. when a contact is tagged), set the URL above, and use this payload with merge tags:

```json
{
  "contact_id": "{{contact.id}}",
  "company_name": "{{contact.company_name}}",
  "contact_email": "{{contact.email}}",
  "contact_phone": "{{contact.phone}}",
  "assigned_rep_email": "{{contact.rep_email}}"
}
```

## Renaming the project folder

The folder name (e.g. `rep-rally-space-main`) is only the directory on disk. Renaming it has no effect on:

- The app code
- `package.json` (which has its own `name` field)
- Build output or deployment

You can safely rename the folder to something like `commission-hq` or `commission-hq-main`. Nothing in the project depends on the folder name.

If you use Git and the remote repo is also named `rep-rally-space-main`, the remote URL stays the same; only your local folder name changes.
