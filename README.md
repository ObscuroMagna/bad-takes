# Bad Takes

A clapperboard app that reveals terrible takes one at a time with a satisfying snap animation. Vote them up or down — votes sync in real time across all viewers.

Click the clapperboard (or shake your phone) to cycle through the takes.

## Getting started

### 1. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. In Project Settings, add a **Web app** and copy the config values
3. Go to **Realtime Database** → Create Database → Start in **test mode**
4. Paste your config into `src/firebase.js`

### 2. Install and run

```
npm install
npm run dev
```

## Adding your own takes

Edit `src/takes.js` — it's just an array of strings:

```js
const takes = [
  "Your hot take here",
  "Another scorching opinion",
];

export default takes;
```

## Firebase security rules (optional)

For production, replace the default test rules with something like:

```json
{
  "rules": {
    "votes": {
      "$takeIndex": {
        "$direction": {
          ".read": true,
          ".write": true,
          ".validate": "newData.isNumber() && newData.val() === data.val() + 1"
        }
      }
    }
  }
}
```

This allows anyone to read votes but only increment by 1.

## Built with

React + Vite + Firebase Realtime Database
