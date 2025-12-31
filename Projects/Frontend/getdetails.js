// ===============================
// API CONFIG
// ===============================
const API_URL =
  "https://73ywsbsgmd.execute-api.us-east-1.amazonaws.com/dev-stage";

// ===============================
// BUTTON HANDLERS
// ===============================
document.getElementById("btn-status")
  ?.addEventListener("click", getStatus);

document.getElementById("btn-reboot")
  ?.addEventListener("click", rebootInstance);

// ===============================
// FETCH EC2 STATUS
// ===============================
async function getStatus() {
  const token = sessionStorage.getItem("access_token"); // ✅ FIXED
  const output = document.getElementById("status-output");

  if (!token) {
    output.textContent = "Please login first.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/instances`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    output.textContent = "Failed to fetch instance status.";
  }
}

// ===============================
// REBOOT INSTANCE
// ===============================
async function rebootInstance() {
  const token = sessionStorage.getItem("access_token"); // ✅ FIXED
  const instanceId =
    document.getElementById("instance-id").value;
  const output =
    document.getElementById("reboot-output");

  if (!token) {
    output.textContent = "Please login first.";
    return;
  }

  if (!instanceId) {
    output.textContent = "Instance ID is required.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/reboot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ instanceId })
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    output.textContent = "Failed to reboot instance.";
  }
}
