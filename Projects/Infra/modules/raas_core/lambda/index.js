const AWS = require("aws-sdk");
const ec2 = new AWS.EC2({ region: "us-east-1" });

exports.handler = async (event) => {
  try {
    // ===============================
    // BASIC REQUEST INFO
    // ===============================
    const route = event.requestContext?.http?.path || "";
    const method = event.requestContext?.http?.method || "";

    // ===============================
    // AUTH / GROUP INFO
    // ===============================
    const claims = event.requestContext?.authorizer?.jwt?.claims || {};
    const groups = claims["cognito:groups"] || [];

    if (!groups.length) {
      return response(403, { message: "User has no group assigned" });
    }

    const isDevOps = groups.includes("devops");
    const userGroup = groups[0]; // java / ui / devops

    // ===============================
    // GET /instances
    // ===============================
    if (route.endsWith("/instances") && method === "GET") {
      const data = await ec2.describeInstances().promise();
      const instances = [];

      data.Reservations?.forEach(res => {
        res.Instances?.forEach(inst => {
          const ownerTag = inst.Tags?.find(
            t => t.Key === "OwnerGroup"
          );

          // RBAC + ABAC enforcement
          if (isDevOps || ownerTag?.Value === userGroup) {
            instances.push({
              instanceId: inst.InstanceId,
              state: inst.State?.Name,
              type: inst.InstanceType,
              ownerGroup: ownerTag?.Value || "unknown"
            });
          }
        });
      });

      return response(200, instances);
    }

    // ===============================
    // POST /reboot
    // ===============================
    if (route.endsWith("/reboot") && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const instanceId = body.instanceId;

      if (!instanceId) {
        return response(400, { message: "instanceId is required" });
      }

      // Fetch instance to validate ownership
      const desc = await ec2.describeInstances({
        InstanceIds: [instanceId]
      }).promise();

      const instance =
        desc.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        return response(404, { message: "Instance not found" });
      }

      const ownerTag = instance.Tags?.find(
        t => t.Key === "OwnerGroup"
      );

      // Authorization check
      if (!isDevOps && ownerTag?.Value !== userGroup) {
        return response(403, {
          message: "Not authorized to reboot this instance"
        });
      }

      await ec2.rebootInstances({
        InstanceIds: [instanceId]
      }).promise();

      // Audit log (recommended)
      console.log({
        user: claims.sub,
        group: userGroup,
        action: "reboot",
        instanceId
      });

      return response(200, {
        message: `Reboot triggered for ${instanceId}`
      });
    }

    // ===============================
    // FALLBACK
    // ===============================
    return response(404, { message: "Route not found" });

  } catch (err) {
    console.error("Lambda error:", err);
    return response(500, { error: err.message });
  }
};

// ===============================
// RESPONSE HELPER
// ===============================
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
