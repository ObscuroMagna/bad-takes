#!/usr/bin/env node

/**
 * Bad Takes CLI — manage takes in Firebase from your terminal.
 * Authenticates via Google Sign-In (opens browser, caches token locally).
 *
 * Usage:
 *   node takes-cli.mjs list                     List all takes (no auth needed)
 *   node takes-cli.mjs add "Your hot take"      Add a new take (requires auth)
 *   node takes-cli.mjs remove 5                 Remove take at index 5 (requires auth)
 *   node takes-cli.mjs swap 2 7                 Swap takes at indices 2 and 7 (requires auth)
 *   node takes-cli.mjs count                    Show total take count (no auth needed)
 *   node takes-cli.mjs login                    Sign in with Google
 *   node takes-cli.mjs logout                   Clear saved auth token
 *
 * Setup:
 *   1. Enable Google sign-in in Firebase Console > Authentication > Sign-in method
 *   2. Your .env needs VITE_FIREBASE_API_KEY and VITE_FIREBASE_DATABASE_URL
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { exec } from "child_process";
import { platform } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = resolve(__dirname, ".auth-token.json");

// --- Load env vars from .env ---
function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  let envContent;
  try {
    envContent = readFileSync(envPath, "utf-8");
  } catch {
    console.error("  Could not read .env file. Make sure it exists in the project root.");
    process.exit(1);
  }

  const get = (key) => {
    const match = envContent.match(new RegExp(`${key}\\s*=\\s*['"]?([^\\s'"]+)`));
    return match ? match[1] : null;
  };

  return {
    dbUrl: get("VITE_FIREBASE_DATABASE_URL"),
    apiKey: get("VITE_FIREBASE_API_KEY"),
    authDomain: get("VITE_FIREBASE_AUTH_DOMAIN"),
  };
}

const env = loadEnv();

if (!env.dbUrl) {
  console.error("  VITE_FIREBASE_DATABASE_URL not found in .env");
  process.exit(1);
}
if (!env.apiKey) {
  console.error("  VITE_FIREBASE_API_KEY not found in .env");
  process.exit(1);
}

// --- Open URL in default browser ---
function openBrowser(url) {
  const cmd =
    platform() === "win32" ? `start "" "${url}"` :
    platform() === "darwin" ? `open "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd);
}

// --- Token management ---
function loadToken() {
  if (!existsSync(TOKEN_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    // Check if refresh token exists (ID tokens expire, but we can refresh)
    if (data.refreshToken) return data;
    return null;
  } catch {
    return null;
  }
}

function saveToken(data) {
  writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2));
}

function clearToken() {
  if (existsSync(TOKEN_PATH)) {
    unlinkSync(TOKEN_PATH);
    console.log("  Logged out. Token cleared.\n");
  } else {
    console.log("  No saved token found.\n");
  }
}

// --- Refresh an expired ID token using the refresh token ---
async function refreshIdToken(refreshToken) {
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${env.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const tokenData = {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + parseInt(data.expires_in) * 1000,
  };
  saveToken(tokenData);
  return tokenData.idToken;
}

// --- Google OAuth sign-in via local redirect server ---
async function googleSignIn() {
  return new Promise((resolveAuth, rejectAuth) => {
    const PORT = 9876;

    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);

      // Serve the callback page that extracts the token from the URL fragment
      if (url.pathname === "/callback") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html>
<html><body>
<p>Signing in...</p>
<script>
  // The token is in the URL fragment (#), so we need JS to read it
  const params = new URLSearchParams(window.location.hash.substring(1));
  const idToken = params.get("id_token");
  if (idToken) {
    fetch("/token?id_token=" + encodeURIComponent(idToken))
      .then(() => {
        document.body.innerHTML = "<h2>Signed in! You can close this tab.</h2>";
      });
  } else {
    document.body.innerHTML = "<h2>Sign-in failed. Close this tab and try again.</h2>";
  }
</script>
</body></html>`);
        return;
      }

      // Receive the token from the callback page
      if (url.pathname === "/token") {
        const idToken = url.searchParams.get("id_token");
        if (idToken) {
          res.writeHead(200);
          res.end("ok");

          // Exchange the Google ID token for a Firebase ID token + refresh token
          const fbRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${env.apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postBody: `id_token=${idToken}&providerId=google.com`,
                requestUri: `http://localhost:${PORT}/callback`,
                returnIdpCredential: true,
                returnSecureToken: true,
              }),
            }
          );

          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const tokenData = {
              idToken: fbData.idToken,
              refreshToken: fbData.refreshToken,
              expiresAt: Date.now() + parseInt(fbData.expiresIn) * 1000,
              email: fbData.email,
            };
            saveToken(tokenData);
            console.log(`  Signed in as ${tokenData.email}\n`);
            server.close();
            resolveAuth(tokenData.idToken);
          } else {
            console.error("  Firebase auth exchange failed.");
            server.close();
            rejectAuth(new Error("Firebase auth failed"));
          }
        }
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(PORT, "127.0.0.1", () => {
      // Build the Google OAuth URL that redirects back to our local server
      // Using Firebase Auth's signInWithPopup equivalent via redirect
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${env.apiKey}&` +  // We'll use the Firebase auth handler instead
        `response_type=token&` +
        `scope=openid+email+profile&` +
        `redirect_uri=http://localhost:${PORT}/callback`;

      // Actually, we need to use Firebase's auth handler URL instead
      // Let's use the signInWithRedirect approach via Firebase Auth REST
      const firebaseAuthUrl =
        `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${env.apiKey}`;

      // Simpler approach: use Firebase Auth's built-in Google sign-in widget
      const signInUrl = `https://${env.dbUrl.replace("https://", "").replace(".firebaseio.com", "")}.firebaseapp.com/__/auth/handler`;

      // Most reliable: construct the OAuth URL ourselves
      // First we need the Google OAuth client ID from Firebase
      // The API key works with the Firebase Auth REST API directly

      // Let's use a simpler approach — serve a local page that uses Firebase JS SDK
      const localAuthUrl = `http://localhost:${PORT}/signin`;

      // Actually, simplest reliable approach: serve a page with the Firebase JS SDK
      server.removeAllListeners("request");
      server.on("request", async (req2, res2) => {
        const url2 = new URL(req2.url, `http://localhost:${PORT}`);

        if (url2.pathname === "/" || url2.pathname === "/signin") {
          res2.writeHead(200, { "Content-Type": "text/html" });
          res2.end(`<!DOCTYPE html>
<html><head><title>Bad Takes — Sign In</title></head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f0f0f; color: #f5f5f0;">
<div style="text-align: center;">
  <h1>Bad Takes Admin</h1>
  <p>Sign in with Google to manage takes.</p>
  <button id="signin" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 8px; border: none; background: #4285f4; color: white; font-weight: bold;">
    Sign in with Google
  </button>
  <p id="status" style="color: #888;"></p>
</div>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script>
  firebase.initializeApp({
    apiKey: "${env.apiKey}",
    authDomain: "${env.authDomain}",
  });

  document.getElementById("signin").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    document.getElementById("status").textContent = "Opening Google sign-in...";
    firebase.auth().signInWithPopup(provider)
      .then(async (result) => {
        const idToken = await result.user.getIdToken();
        const refreshToken = result.user.refreshToken;
        // Send tokens back to the CLI server
        await fetch("/auth-complete?" + new URLSearchParams({
          idToken,
          refreshToken,
          email: result.user.email,
          expiresIn: "3600",
        }));
        document.getElementById("status").textContent = "Signed in! You can close this tab.";
        document.getElementById("signin").style.display = "none";
      })
      .catch((err) => {
        document.getElementById("status").textContent = "Error: " + err.message;
      });
  });
</script>
</body></html>`);
          return;
        }

        if (url2.pathname === "/auth-complete") {
          const idToken = url2.searchParams.get("idToken");
          const refreshToken = url2.searchParams.get("refreshToken");
          const email = url2.searchParams.get("email");

          res2.writeHead(200);
          res2.end("ok");

          if (idToken && refreshToken) {
            const tokenData = {
              idToken,
              refreshToken,
              expiresAt: Date.now() + 3600 * 1000,
              email,
            };
            saveToken(tokenData);
            console.log(`  Signed in as ${email}\n`);
            server.close();
            resolveAuth(idToken);
          } else {
            server.close();
            rejectAuth(new Error("Missing tokens"));
          }
          return;
        }

        res2.writeHead(404);
        res2.end();
      });

      console.log("\n  Opening browser for Google sign-in...");
      openBrowser(`http://localhost:${PORT}/signin`);

      // Timeout after 2 minutes
      setTimeout(() => {
        server.close();
        rejectAuth(new Error("Sign-in timed out"));
      }, 120000);
    });
  });
}

// --- Get a valid auth token (from cache, refresh, or new sign-in) ---
async function getAuthToken() {
  const saved = loadToken();

  if (saved) {
    // If token hasn't expired, use it
    if (saved.expiresAt && Date.now() < saved.expiresAt - 60000) {
      return saved.idToken;
    }

    // Try refreshing
    if (saved.refreshToken) {
      console.log("  Refreshing auth token...");
      const newToken = await refreshIdToken(saved.refreshToken);
      if (newToken) return newToken;
    }
  }

  // Need fresh sign-in
  return googleSignIn();
}

// --- Firebase REST helpers ---
async function fbGet(path) {
  const res = await fetch(`${env.dbUrl}/${path}.json`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function fbPut(path, data) {
  const token = await getAuthToken();

  const res = await fetch(`${env.dbUrl}/${path}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PUT ${path} failed: ${res.status} — ${body}`);
  }
  return res.json();
}

// --- Commands ---
async function listTakes() {
  const takes = await fbGet("takes");
  if (!takes || takes.length === 0) {
    console.log("  No takes found.");
    return;
  }
  console.log(`\n  Bad Takes (${takes.filter(Boolean).length} total)\n`);
  takes.forEach((take, i) => {
    if (take) {
      console.log(`  [${i}]  ${take}`);
    }
  });
  console.log();
}

async function addTake(text) {
  if (!text) {
    console.error('  Usage: node takes-cli.mjs add "Your hot take here"');
    process.exit(1);
  }

  const takes = (await fbGet("takes")) || [];
  const cleaned = takes.filter(Boolean);

  if (cleaned.some((t) => t.toLowerCase() === text.toLowerCase())) {
    console.error("  That take already exists!");
    process.exit(1);
  }

  cleaned.push(text);
  await fbPut("takes", cleaned);
  console.log(`  Added: "${text}"`);
  console.log(`  Total takes: ${cleaned.length}\n`);
}

async function removeTake(indexStr) {
  const index = parseInt(indexStr, 10);
  if (isNaN(index)) {
    console.error("  Usage: node takes-cli.mjs remove <index>");
    console.error("  Run 'node takes-cli.mjs list' to see indices.");
    process.exit(1);
  }

  const takes = (await fbGet("takes")) || [];
  const cleaned = takes.filter(Boolean);

  if (index < 0 || index >= cleaned.length) {
    console.error(`  Index ${index} out of range. Valid: 0-${cleaned.length - 1}`);
    process.exit(1);
  }

  const removed = cleaned[index];
  cleaned.splice(index, 1);
  await fbPut("takes", cleaned);
  console.log(`  Removed [${index}]: "${removed}"`);
  console.log(`  Total takes: ${cleaned.length}\n`);
}

async function swapTakes(aStr, bStr) {
  const a = parseInt(aStr, 10);
  const b = parseInt(bStr, 10);
  if (isNaN(a) || isNaN(b)) {
    console.error("  Usage: node takes-cli.mjs swap <index1> <index2>");
    process.exit(1);
  }

  const takes = (await fbGet("takes")) || [];
  const cleaned = takes.filter(Boolean);
  const max = cleaned.length - 1;

  if (a < 0 || a > max || b < 0 || b > max) {
    console.error(`  Indices out of range. Valid: 0-${max}`);
    process.exit(1);
  }

  [cleaned[a], cleaned[b]] = [cleaned[b], cleaned[a]];
  await fbPut("takes", cleaned);
  console.log(`  Swapped [${a}] and [${b}]`);
  console.log(`  [${a}]  ${cleaned[a]}`);
  console.log(`  [${b}]  ${cleaned[b]}\n`);
}

async function countTakes() {
  const takes = (await fbGet("takes")) || [];
  const count = takes.filter(Boolean).length;
  console.log(`\n  Total takes: ${count}\n`);
}

async function tallyVotes() {
  const [takes, votes] = await Promise.all([fbGet("takes"), fbGet("votes")]);
  const takeList = (takes || []).filter(Boolean);

  if (!votes || Object.keys(votes).length === 0) {
    console.log("\n  No votes recorded yet.\n");
    return;
  }

  // Build hash-to-take lookup
  const hashToTake = {};
  for (const take of takeList) {
    const h = hashTake(take);
    hashToTake[h] = take;
  }

  let totalUp = 0;
  let totalDown = 0;
  const rows = [];

  for (const [hash, counts] of Object.entries(votes)) {
    const up = counts.up || 0;
    const down = counts.down || 0;
    totalUp += up;
    totalDown += down;
    const label = hashToTake[hash] || `[unknown: ${hash}]`;
    rows.push({ label, up, down, total: up + down });
  }

  // Sort by total votes descending
  rows.sort((a, b) => b.total - a.total);

  console.log(`\n  Vote Tally\n`);
  console.log(`  ${"Take".padEnd(45)} 👍   👎   Total`);
  console.log(`  ${"—".repeat(45)} ———  ———  —————`);

  for (const row of rows) {
    const name = row.label.length > 42 ? row.label.slice(0, 42) + "..." : row.label;
    console.log(
      `  ${name.padEnd(45)} ${String(row.up).padStart(3)}  ${String(row.down).padStart(3)}  ${String(row.total).padStart(5)}`
    );
  }

  console.log(`\n  Total:${" ".repeat(38)} ${String(totalUp).padStart(3)}  ${String(totalDown).padStart(3)}  ${String(totalUp + totalDown).padStart(5)}`);
  console.log();
}

// Hash function matching the frontend (src/App.jsx hashTake)
function hashTake(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36).padStart(6, "0");
}

// --- Main ---
const [, , command, ...args] = process.argv;

switch (command) {
  case "list":
  case "ls":
    await listTakes();
    break;
  case "add":
    await addTake(args.join(" "));
    break;
  case "remove":
  case "rm":
    await removeTake(args[0]);
    break;
  case "swap":
    await swapTakes(args[0], args[1]);
    break;
  case "count":
    await countTakes();
    break;
  case "tally":
  case "votes":
    await tallyVotes();
    break;
  case "login":
    await googleSignIn();
    break;
  case "logout":
    clearToken();
    break;
  default:
    console.log(`
  Bad Takes CLI

  Commands:
    list                     List all takes with indices
    add "Your hot take"      Add a new take
    remove <index>           Remove a take by index
    swap <i1> <i2>           Swap two takes
    count                    Show total count
    tally                    Show vote totals per take
    login                    Sign in with Google
    logout                   Clear saved auth token

  Examples:
    node takes-cli.mjs login
    node takes-cli.mjs list
    node takes-cli.mjs add "Water is just boneless ice"
    node takes-cli.mjs remove 3
    node takes-cli.mjs swap 0 5

  Auth: add/remove/swap will prompt sign-in if needed.
  Token is cached in .auth-token.json and auto-refreshes.
`);
}
