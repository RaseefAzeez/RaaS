/* -------------------------------------------------------
   CONFIG — UPDATE THESE VALUES
--------------------------------------------------------- */

const COGNITO_DOMAIN = "https://us-east-1ddyxzzaiw.auth.us-east-1.amazoncognito.com";
const CLIENT_ID      = "1u04hicg0bnlu48jg4nr701iid";
const REDIRECT_URI   = "http://localhost:5500/callback";   // Must match Cognito app callback URL
const API_URL        = "https://73ywsbsgmd.execute-api.us-east-1.amazonaws.com/dev-stage";  // Example: https://abc123.execute-api.us-east-1.amazonaws.com/dev-stage


/* -------------------------------------------------------
   PKCE Utilities
--------------------------------------------------------- */
function randomString(length = 64){
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(str){
  const encoded = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


/* -------------------------------------------------------
   Login — Launch Cognito Hosted UI
--------------------------------------------------------- */
async function login(){
  const verifier = randomString();
  localStorage.setItem("pkce_verifier", verifier);

  const challenge = await sha256(verifier);

  const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location = url.toString();
}


/* -------------------------------------------------------
   Exchange Code for Tokens
--------------------------------------------------------- */
async function exchangeCodeForToken(code){
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
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body
  });

  const data = await res.json();
  localStorage.setItem("tokens", JSON.stringify(data));
}


/* -------------------------------------------------------
   Token helpers
--------------------------------------------------------- */
function getAccessToken(){
  const tokens = JSON.parse(localStorage.getItem("tokens") || "{}");
  return tokens.access_token;
}

function isAuthenticated(){
  return !!getAccessToken();
}

function logout(){
  localStorage.removeItem("tokens");
  localStorage.removeItem("pkce_verifier");

  window.location = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent("https://localhost")}`;
}


function renderAuthButtons(){
  const el = document.getElementById("auth-buttons");

  // Base classes for both buttons: transition, rounded, font-semibold
  const baseClasses = "px-4 py-2 rounded font-semibold transition duration-300 transform active:scale-95 shadow-md";

  if(isAuthenticated()){
    el.innerHTML = `
      <button class="${baseClasses} bg-gray-300 text-gray-800 hover:bg-gray-400 hover:shadow-lg focus:ring-2 focus:ring-gray-500" onclick="logout()">
        Logout
      </button>`;
  } else {
    // Uses the custom 'maroon-600' color for strong primary branding
    el.innerHTML = `
      <button class="${baseClasses} bg-green-600 text-white hover:bg-green-900 hover:shadow-xl hover:scale-[1.03] focus:ring-2 focus:ring-maroon-900" onclick="login()">
        Login with SSO
      </button>`;
  }
}

// NOTE: You must ensure 'isAuthenticated()', 'logout()', and 'login()' functions are defined 
// in your 'index.js' file for this code to be functional.


/* -------------------------------------------------------
   API Caller
--------------------------------------------------------- */
async function callApi(method, path, body=null){
  if(!isAuthenticated()) return alert("Please login to proceed further..");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Authorization": "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  return res.json();
}


/* -------------------------------------------------------
   UI Events
--------------------------------------------------------- */

// GET /instances
document.getElementById("btn-status").addEventListener("click", async () => {
  const output = document.getElementById("status-output");
  output.textContent = "Loading...";

  const data = await callApi("GET", "/instances");
  output.textContent = JSON.stringify(data, null, 2);
});

// POST /reboot
document.getElementById("btn-reboot").addEventListener("click", async () => {
  const output = document.getElementById("reboot-output");
  const instanceId = document.getElementById("instance-id").value.trim();

  if(!instanceId){
    output.textContent = "Enter instance ID.";
    return;
  }

  output.textContent = "Rebooting...";

  const data = await callApi("POST", "/reboot", { instance_id: instanceId });
  output.textContent = JSON.stringify(data, null, 2);
});


/* -------------------------------------------------------
   Handle Cognito Callback
--------------------------------------------------------- */
(async function(){
  renderAuthButtons();

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if(code){
    await exchangeCodeForToken(code);

    // cleanup URL
    window.history.replaceState({}, "", "/");
    renderAuthButtons();
  }
})();
