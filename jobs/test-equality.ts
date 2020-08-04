import * as aws from "@pulumi/aws";

// Because step functions sucks and can't compare two inputs
export const lambda = new aws.lambda.CallbackFunction("jobs-test-equality", {
    callback: async ({ left, right }: { left: any; right: any }) =>
        left == right,
});
