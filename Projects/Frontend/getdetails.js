/* -------------------------------------------------------
   CONFIG — UPDATE THESE VALUES
--------------------------------------------------------- */

const COGNITO_DOMAIN = "https://us-east-1ddyxzzaiw.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "1u04hicg0bnlu48jg4nr701iid";
const REDIRECT_URI = "http://localhost:5500/callback.html";
const LOGOUT_URI = "http://localhost:5500";
const API_URL = "https://73ywsbsgmd.execute-api.us-east-1.amazonaws.com/dev-stage";


/* -------------------------------------------------------
   PKCE Utilities
--------------------------------------------------------- */

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(str) {
  const encoded = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


/* -------------------------------------------------------
   Login — Cognito Hosted UI
--------------------------------------------------------- */

async function login() {
  const verifier = randomString();
  localStorage.setItem("pkce_verifier", verifier);

  const challenge = await sha256(verifier);

  const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);

  window.location.href = url.toString();
}


/* -------------------------------------------------------
   Exchange Authorization Code for Tokens
--------------------------------------------------------- */

async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem("pkce_verifier");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await res.json();

  if (data.error) {
    console.error("Token exchange failed:", data);
    alert("Authentication failed");
    return;
  }

  localStorage.setItem("tokens", JSON.stringify(data));
  localStorage.removeItem("pkce_verifier");
}


/* -------------------------------------------------------
   Token Helpers (ID TOKEN IS USED)
--------------------------------------------------------- */

function getIdToken() {
  const tokens = JSON.parse(localStorage.getItem("tokens") || "{}");
  return tokens.id_token;
}

function isAuthenticated() {
  return !!getIdToken();
}


/* -------------------------------------------------------
   Logout
--------------------------------------------------------- */

function logout() {
  localStorage.removeItem("tokens");
  localStorage.removeItem("pkce_verifier");

  window.location.href =
    `${COGNITO_DOMAIN}/logout` +
    `?client_id=${CLIENT_ID}` +
    `&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
}


/* -------------------------------------------------------
   Render Auth Buttons
--------------------------------------------------------- */

function renderAuthButtons() {
  const el = document.getElementById("auth-buttons");
  if (!el) return;

  if (isAuthenticated()) {
    el.innerHTML = `
      <button onclick="logout()"
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
        Logout
      </button>
    `;
  } else {
    el.innerHTML = `
      <button onclick="login()"
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        Login with SSO
      </button>
    `;
  }
}


/* -------------------------------------------------------
   API Caller (JWT attached)
--------------------------------------------------------- */

async function callApi(method, path, body = null) {
  if (!isAuthenticated()) {
    alert("Please login first");
    return;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${getIdToken()}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}


/* -------------------------------------------------------
   UI Event Handlers
--------------------------------------------------------- */

// GET /instances
document.getElementById("btn-status")?.addEventListener("click", async () => {
  const output = document.getElementById("status-output");
  output.textContent = "Loading...";

  try {
    const data = await callApi("GET", "/instances");
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = err.message;
  }
});

// POST /reboot
document.getElementById("btn-reboot")?.addEventListener("click", async () => {
  const output = document.getElementById("reboot-output");
  const instanceId = document.getElementById("instance-id").value.trim();

  if (!instanceId) {
    output.textContent = "Enter instance ID.";
    return;
  }

  output.textContent = "Rebooting...";

  try {
    const data = await callApi("POST", "/reboot", { instance_id: instanceId });
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = err.message;
  }
});


/* -------------------------------------------------------
   Handle OAuth Callback
--------------------------------------------------------- */

(async function () {
  renderAuthButtons();

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    await exchangeCodeForToken(code);
    window.history.replaceState({}, "", "/");
    renderAuthButtons();
  }
})();
