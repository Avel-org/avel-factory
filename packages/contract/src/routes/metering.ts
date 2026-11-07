import { CreatePaymentInput, GetMetricsInput, MetricsDto, PaymentDto } from "../dto/metering.js";
import { route } from "./route.js";

const tag = "Metering";

export const metering = {
  metrics: route(
    69,
    "GET",
    "/api/metrics",
    tag,
    "`?missionId=` or by package, and by factory commit",
  )
    .input(GetMetricsInput)
    .output(MetricsDto),
  recordPayment: route(70, "POST", "/api/payments", tag, "Record a payment")
    .input(CreatePaymentInput)
    .output(PaymentDto),
};
