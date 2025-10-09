require("dotenv").config();

const sqsQueues = JSON.parse(process.env.SQS_QUEUES || "{}");

export const config = {
  aws: {
    region: process.env.AWS_REGION,
    secretName: process.env.SECRET_NAME,
  },
  sqs: {
    queueBaseUrl: "https://sqs.us-east-1.amazonaws.com",
    queues: sqsQueues,
    dlQueue: sqsQueues[`${process.env.NODE_ENV}-yourLambdaName`]?.dlq_queue,
  },
};
