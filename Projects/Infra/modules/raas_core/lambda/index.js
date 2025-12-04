exports.handler = async (event, context) => {

    // Log event and context

    console.log("Received event:", JSON.stringify(event, null, 2));

    console.log("Execution context:", JSON.stringify(context, null, 2));

    // Simple response

    return {

        statusCode: 200,

        body: JSON.stringify({

            message: "RaaS Lambda working!",

            input: event,

        }),

    };

};