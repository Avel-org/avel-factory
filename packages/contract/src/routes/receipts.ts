import {
  DeliveryArchiveDto,
  DeliveryIdInput,
  GetReceiptInput,
  ReceiptArtifactBody,
  ReceiptArtifactInput,
  ReceiptViewDto,
} from "../dto/receipts.js";
import { receiptErrorMap } from "../errors.js";
import { route } from "./route.js";

const tag = "Receipts and delivery";

export const receipts = {
  get: route(61, "GET", "/api/receipts/{receiptId}", tag, "`?verify=1` rechecks the hash")
    .errors(receiptErrorMap)
    .input(GetReceiptInput)
    .output(ReceiptViewDto),
  /** CR-W21 section 1: one proof file's bytes, which the browser hashes itself. */
  artifact: route(
    null,
    "GET",
    "/api/receipts/{receiptId}/artifacts/{key}",
    tag,
    "One proof file's bytes, at most 2 MB (CR-W21)",
  )
    .errors(receiptErrorMap)
    .input(ReceiptArtifactInput)
    .output(ReceiptArtifactBody),
};

export const deliveries = {
  archive: route(62, "GET", "/api/deliveries/{deliveryId}/archive", tag, "The zip")
    .input(DeliveryIdInput)
    .output(DeliveryArchiveDto),
};
