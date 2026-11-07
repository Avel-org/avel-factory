import {
  DeliveryArchiveDto,
  DeliveryIdInput,
  GetReceiptInput,
  ReceiptViewDto,
} from "../dto/receipts.js";
import { route } from "./route.js";

const tag = "Receipts and delivery";

export const receipts = {
  get: route(61, "GET", "/api/receipts/{receiptId}", tag, "`?verify=1` rechecks the hash")
    .input(GetReceiptInput)
    .output(ReceiptViewDto),
};

export const deliveries = {
  archive: route(62, "GET", "/api/deliveries/{deliveryId}/archive", tag, "The zip")
    .input(DeliveryIdInput)
    .output(DeliveryArchiveDto),
};
