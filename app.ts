import { SQSEvent, SQSRecord } from "aws-lambda";

import { config, errorHandler, logger, validateRequest } from "./src/common";
import { exampleService } from "./src/services/example.service";
import { ExampleRequestDto } from "./src/dto/example-request.dto";
import { getAccountId } from "./src/services/get-account-id.service";
import { sendMessage } from "./src/services/sqs.service";

const {
  sqs: { dlQueue, queueBaseUrl },
} = config;

/**
 * Lambda handler for SQS events
 * Modify this handler according to your needs
 */
module.exports.lambdaHandler = async (event: SQSEvent) => {
  try {
    logger.info("[step] Event received", { event });

    const sqsRecord: SQSRecord = event.Records[0];
    const parsedEvent: ExampleRequestDto = JSON.parse(sqsRecord.body);

    // Validate the request using class-validator
    const validatedDto = await validateRequest(
      ExampleRequestDto,
      parsedEvent
    );

    // Call your service with the validated data
    return await exampleService(validatedDto);
  } catch (error) {
    logger.info(`[step] Sending message to DLQ: ${dlQueue}`);
    const accountId = await getAccountId();

    const dlQueueUrl = `${queueBaseUrl}/${accountId}/${dlQueue}`;
    const dlqMessage = JSON.stringify(event);

    await sendMessage(dlQueueUrl, dlqMessage);
    return errorHandler(error as Error);
  }
};
