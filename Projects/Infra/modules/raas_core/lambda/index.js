const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();

/*
  RaaS Lambda – Cognito + API Gateway HTTP API v2
  -----------------------------------------------
  - Uses JWT authorizer from Cognito User Pool
  - Extracts claims from requestContext.authorizer.jwt.claims
  - Cognito groups come in: cognito:groups
  - RBAC via EC2 team tag
  - Supports:
        GET  /instances
        POST /reboot
*/

exports.handler = async (event) => {
  try {

    /* =======================================
       A. Load RBAC Configuration from env vars
       =======================================*/
    const RBAC_MAP  = JSON.parse(process.env.RBAC_MAP || "{}");
    const GROUP_MAP = JSON.parse(process.env.GROUP_MAP || "{}");

    /* ===================================
       B. Extract identity from JWT claims
       ===================================*/
    const claims = event?.requestContext?.authorizer?.jwt?.claims;

    if (!claims) {
      return response(401, "Missing JWT claims");
    }

    // Cognito groups appear as "cognito:groups"
    let userGroups = claims["cognito:groups"];

    if (typeof userGroups === "string") {
      userGroups = [userGroups];
    }

    if (!userGroups || userGroups.length === 0) {
      return response(403, "User not assigned to any Cognito groups");
    }

    /* =========================================
       C. Map Cognito groups → RBAC teams
       =========================================*/
    const allowedTeams = [];

    for (const group of userGroups) {
      const team = GROUP_MAP[group];
      if (team) {
        allowedTeams.push(team);
      }
    }

    if (allowedTeams.length === 0) {
      return response(403, "User not mapped to any RBAC team");
    }

    console.log("Allowed teams:", allowedTeams);

    /* =========================================
       D. Route based on HTTP API v2 event format
       ==========================================*/
    const method = event.requestContext.http.method;
    const path   = event.rawPath;

    if (method === "GET" && path === "/instances") {
      const instances = await listInstancesForTeams(allowedTeams);
      return response(200, { instances });
    }

    if (method === "POST" && path === "/reboot") {
      const body = JSON.parse(event.body || "{}");

      const instanceId = body.instance_id || body.instanceId;

      if (!instanceId) {
        return response(400, "Missing instance_id");
      }

      await rebootInstanceWithRBAC(instanceId, allowedTeams);

      return response(200, {
        message: "Instance reboot initiated",
        instanceId
      });
    }

    return response(404, "Route not found");

  } catch (err) {
    console.error("Unhandled error:", err);
    return response(500, "Internal server error");
  }
};


/* =======================================================
   Helper: Return EC2 instances user is allowed to see
   =======================================================*/
async function listInstancesForTeams(allowedTeams) {
  const result = await ec2.describeInstances().promise();
  const visible = [];

  for (const reservation of result.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      const tags = instance.Tags || [];
      const teamTag = tags.find(t => t.Key === "team");

      if (teamTag && allowedTeams.includes(teamTag.Value)) {
        visible.push({
          instanceId: instance.InstanceId,
          state: instance.State?.Name,
          team: teamTag.Value,
        });
      }
    }
  }

  return visible;
}


/* =======================================================
   Helper: Reboot EC2 instance after RBAC verification
   =======================================================*/
async function rebootInstanceWithRBAC(instanceId, allowedTeams) {
  const result = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();

  const instance = result.Reservations?.[0]?.Instances?.[0];
  if (!instance) {
    throw new Error("Instance not found");
  }

  const teamTag = instance.Tags?.find(t => t.Key === "team")?.Value;

  if (!teamTag || !allowedTeams.includes(teamTag)) {
    throw new Error("RBAC violation: reboot not allowed");
  }

  await ec2.rebootInstances({ InstanceIds: [instanceId] }).promise();
}


/* ===========================================
   Response helper (API Gateway HTTP API v2)
   ===========================================*/
function response(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(
      typeof body === "string" ? { error: body } : body
    ),
    headers: {
      "Content-Type": "application/json"
    }
  };
}
