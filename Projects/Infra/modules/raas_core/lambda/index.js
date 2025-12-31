const AWS = require("aws-sdk");
const ec2 = new AWS.EC2({ region: "us-east-1" });

exports.handler = async (event) => {
  try {
    const route = event.requestContext.http.path;
    const method = event.requestContext.http.method;

    // 🔐 Extract Cognito groups from JWT
    const claims = event.requestContext.authorizer.jwt.claims;
    const groups = claims["cognito:groups"] || [];

    if (!groups.length) {
      return response(403, { message: "User has no group assigned" });
    }

    // We use the FIRST group as ownership scope
    const userGroup = groups[0];

    // =====================
    // GET /instances
    // =====================
    if (route === "/instances" && method === "GET") {
      const data = await ec2.describeInstances().promise();

      const instances = [];

      data.Reservations?.forEach(res => {
        res.Instances?.forEach(inst => {
          const ownerTag = inst.Tags?.find(t => t.Key === "OwnerGroup");

          // ✅ Only include instances matching user's group
          if (ownerTag?.Value === userGroup) {
            instances.push({
              instanceId: inst.InstanceId,
              state: inst.State.Name,
              type: inst.InstanceType,
              ownerGroup: ownerTag.Value
            });
          }
        });
      });

      return response(200, instances);
    }

    // =====================
    // POST /reboot
    // =====================
    if (route === "/reboot" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const instanceId = body.instanceId;

      if (!instanceId) {
        return response(400, { message: "instanceId is required" });
      }

      // 🔍 Fetch instance tags
      const desc = await ec2.describeInstances({
        InstanceIds: [instanceId]
      }).promise();

      const instance =
        desc.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        return response(404, { message: "Instance not found" });
      }

      const ownerTag = instance.Tags?.find(t => t.Key === "OwnerGroup");

      // 🔒 Enforce ownership
      if (ownerTag?.Value !== userGroup) {
        return response(403, {
          message: `Not authorized to reboot ${instanceId}`
        });
      }

      await ec2.rebootInstances({
        InstanceIds: [instanceId]
      }).promise();

      return response(200, {
        message: `Reboot triggered for ${instanceId}`
      });
    }

    return response(404, { message: "Route not found" });

  } catch (err) {
    console.error("Lambda error:", err);
    return response(500, { error: err.message });
  }
};

// =====================
// Helper
// =====================
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
