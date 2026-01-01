const AWS = require("aws-sdk");
const ec2 = new AWS.EC2({ region: "us-east-1" });

exports.handler = async (event) => {
  try {
    // ===============================
    // REQUEST INFO (HTTP API v2)
    // ===============================
    const path = event?.requestContext?.http?.path || "";
    const method = event?.requestContext?.http?.method || "";

    // ===============================
    // AUTH INFO (JWT Authorizer)
    // ===============================
    const claims =
      event?.requestContext?.authorizer?.jwt?.claims || {};

    // ---- Robust Cognito group normalization ----
    let groups = claims["cognito:groups"] || [];

    if (typeof groups === "string") {
      // Handles:
      // "Java-Developers"
      // "Java-Developers,Devops-group"
      groups = groups.split(",").map(g => g.trim());
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return response(403, {
        message: "User has no Cognito group assigned"
      });
    }

    // Admin group (EXACT name)
    const ADMIN_GROUP = "Devops-group";
    const isAdmin = groups.includes(ADMIN_GROUP);

    // ===============================
    // DEBUG (safe to remove later)
    // ===============================
    console.log("AUTH_DEBUG", {
      path,
      method,
      groups,
      isAdmin
    });

    // ===============================
    // GET /instances
    // ===============================
    if (path.includes("/instances") && method === "GET") {
      const data = await ec2.describeInstances().promise();
      const instances = [];

      data.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const ownerTag = instance.Tags?.find(
            t => t.Key === "OwnerGroup"
          );

          console.log("INSTANCE_DEBUG", {
            instanceId: instance.InstanceId,
            ownerTagValue: ownerTag?.Value,
            userGroups: groups
          });

          // RBAC + ABAC enforcement
          if (
            isAdmin ||
            (ownerTag && groups.includes(ownerTag.Value))
          ) {
            instances.push({
              instanceId: instance.InstanceId,
              state: instance.State?.Name,
              type: instance.InstanceType,
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
    if (path.includes("/reboot") && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const instanceId = body.instanceId;

      if (!instanceId) {
        return response(400, {
          message: "instanceId is required"
        });
      }

      const desc = await ec2.describeInstances({
        InstanceIds: [instanceId]
      }).promise();

      const instance =
        desc.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        return response(404, {
          message: "Instance not found"
        });
      }

      const ownerTag = instance.Tags?.find(
        t => t.Key === "OwnerGroup"
      );

      if (
        !isAdmin &&
        (!ownerTag || !groups.includes(ownerTag.Value))
      ) {
        return response(403, {
          message: "Not authorized to reboot this instance"
        });
      }

      await ec2.rebootInstances({
        InstanceIds: [instanceId]
      }).promise();

      console.log("AUDIT_REBOOT", {
        user: claims.sub,
        groups,
        instanceId
      });

      return response(200, {
        message: `Reboot triggered for ${instanceId}`
      });
    }

    // ===============================
    // FALLBACK
    // ===============================
    return response(404, {
      message: "Route not found"
    });

  } catch (err) {
    console.error("LAMBDA_ERROR", err);
    return response(500, {
      error: err.message
    });
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
