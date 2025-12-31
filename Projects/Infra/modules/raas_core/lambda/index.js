import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const ec2 = new EC2Client({ region: "us-east-1" });

export const handler = async () => {
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2.send(command);

    const instances = [];

    response.Reservations?.forEach(reservation => {
      reservation.Instances?.forEach(instance => {
        instances.push({
          instanceId: instance.InstanceId,
          state: instance.State?.Name,
          type: instance.InstanceType
        });
      });
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(instances)
    };

  } catch (err) {
    console.error("Lambda error:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};

