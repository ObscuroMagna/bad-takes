# Bad Takes

A clapperboard app that reveals terrible takes one at a time with a satisfying snap animation. Vote them up or down — votes sync in real time across all viewers.

Click the clapperboard (or shake your phone) to cycle through takes in a random, non-repeating order.

## Getting Started

### 1. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. In Project Settings, add a **Web app** and copy the config values
3. Go to **Realtime Database** → Create Database
4. Go to **Authentication** → Sign-in method → enable **Google**
5. Copy `.env.example` to `.env` and fill in your Firebase config values

### 2. Firebase Security Rules

In **Realtime Database → Rules**, set:

```json
{
  "rules": {
    "takes": {
      ".read": true,
      ".write": "auth != null && auth.token.email === 'your-email@gmail.com'"
    },
    "votes": {
      ".read": true,
      ".write": true
    }
  }
}
```

Replace with your Google account email. This means anyone can read and vote, but only you can manage takes.

### 3. Install and Run

```
npm install
npm run dev
```

## Managing Takes

Takes are stored in Firebase and can be managed without redeploying.

### CLI Tool

```
node takes-cli.mjs login                    # Sign in with Google
node takes-cli.mjs list                     # List all takes with indices
node takes-cli.mjs add "Your hot take"      # Add a new take
node takes-cli.mjs remove 3                 # Remove take at index 3
node takes-cli.mjs swap 0 5                 # Swap two takes
node takes-cli.mjs count                    # Show total take count
node takes-cli.mjs tally                    # Show vote totals per take
node takes-cli.mjs logout                   # Clear saved auth token
```

The CLI requires Google OAuth. On first use, it opens a browser for sign-in and caches your token locally in `.auth-token.json`.

### Fallback Takes

If Firebase is unreachable, the app falls back to the hardcoded list in `src/takes.js`.

## Deployment

Any static host that supports Vite + environment variables works (Vercel, Netlify, Cloudflare Pages, etc.). Set the same `VITE_FIREBASE_*` variables from your `.env` in your host's environment settings.

## Built With

React + Vite + Firebase Realtime Database

## License

Bad Takes is dual-licensed:

- **[AGPL-3.0](LICENSE)** — free for personal use, self-hosting, and any
  project you're willing to also release as open source under AGPL-3.0.
- **Commercial license** — required if you want to use Bad Takes in a
  closed-source or proprietary product, or run a modified hosted version
  without releasing your changes.

See [LICENSING.md](LICENSING.md) for the full explanation. For commercial
license inquiries, open a [Commercial License Inquiry issue](https://github.com/ObscuroMagna/bad-takes/issues/new?template=commercial-license.yml).

Copyright © 2026 Obscuromagna.
