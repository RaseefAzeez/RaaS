const AWS = require("aws-sdk");

const ec2 = new AWS.EC2({ region: "us-east-1" });

exports.handler = async () => {
  try {
    const data = await ec2.describeInstances().promise();

    const instances = [];

    if (data.Reservations) {
      data.Reservations.forEach(res => {
        res.Instances.forEach(inst => {
          instances.push({
            instanceId: inst.InstanceId,
            state: inst.State.Name,
            type: inst.InstanceType
          });
        });
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(instances)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
