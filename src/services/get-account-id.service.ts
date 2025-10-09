import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { config } from "../common";

const {
  aws: { region },
} = config;

export const getAccountId = async (): Promise<string> => {
  const client = new STSClient({ region });
  const command = new GetCallerIdentityCommand({});
  const response = await client.send(command);

  if (!response.Account) {
    throw new Error("Could not retrieve AWS account ID");
  }

  return response.Account;
};
