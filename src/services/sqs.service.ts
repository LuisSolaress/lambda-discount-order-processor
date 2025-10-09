import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../common";

const {
  aws: { region },
} = config;

export const sendMessage = async (
  queueUrl: string,
  messageBody: string
): Promise<void> => {
  const client = new SQSClient({ region });

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  });

  await client.send(command);
};
