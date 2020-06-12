import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const api = new awsx.apigateway.API("api", {
    routes: [
        {
            path: "/",
            target: {
                type: "aws",
                uri:
                    "arn:aws:apigateway:us-west-2:states:action/StartExecution",
            },
        },
    ],
});

export const url = api.url;
