import { BusinessError } from "./base.error";

export class BusinessErrors {
  public static InvalidRequest(errors: string) {
    return new BusinessError(
      "InvalidRequest",
      `The request is invalid: ${errors}`
    );
  }

  // Add your custom business errors here
  // Example:
  // public static ResourceNotFound(resourceId: string) {
  //   return new BusinessError(
  //     "ResourceNotFound",
  //     `Resource ${resourceId} was not found`
  //   );
  // }
}
