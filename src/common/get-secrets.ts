import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

import { config } from "../common";

const {
  aws: { region, secretName },
} = config;

export const getSecretValues = async () => {
  const client = new SecretsManagerClient({
    region,
  });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );

  if (!response.SecretString) {
    throw new Error("The secrets are not defined");
  }

  const values = JSON.parse(response.SecretString);

  return values;
};
