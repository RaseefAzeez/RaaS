// ===============================
// API CONFIG (HTTP API invoke URL)
// ===============================
const API_URL =
  "https://73ywsbsgmd.execute-api.us-east-1.amazonaws.com/dev-stage";

// ===============================
// BUTTON HANDLERS
// ===============================
document.getElementById("btn-status")
  ?.addEventListener("click", getInstances);

document.getElementById("btn-reboot")
  ?.addEventListener("click", rebootInstance);

// ===============================
// FETCH EC2 INSTANCES
// ===============================
async function getInstances() {
  const token = sessionStorage.getItem("id_token");
  const output = document.getElementById("status-output");

  if (!token) {
    output.textContent = "Please login first.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/instances`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);

  } catch (err) {
    console.error("Fetch instances failed:", err);
    output.textContent = "Failed to fetch EC2 instances.";
  }
}

// ===============================
// REBOOT INSTANCE
// ===============================
async function rebootInstance() {
  const token = sessionStorage.getItem("id_token");
  const instanceId =
    document.getElementById("instance-id").value.trim();
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
    console.error("Reboot failed:", err);
    output.textContent = "Failed to reboot instance.";
  }
}
