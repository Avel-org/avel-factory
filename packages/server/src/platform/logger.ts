import { Cause, Logger, References } from "effect";

/**
 * Our JSON logger in Effect's logger slot: one JSON line per log call, with the request ID
 * the request's program was annotated with.
 */
export function jsonLogger(write: (line: string) => void) {
  return Logger.make<unknown, void>(({ message, logLevel, cause, fiber, date }) => {
    const annotations = fiber.getRef(References.CurrentLogAnnotations);
    write(
      JSON.stringify({
        level: logLevel,
        time: date.toISOString(),
        message: Array.isArray(message) && message.length === 1 ? message[0] : message,
        requestId: annotations.requestId,
        ...(cause.reasons.length > 0 ? { cause: Cause.pretty(cause) } : {}),
      }),
    );
  });
}

export const stdoutLogLine = (line: string) => {
  process.stdout.write(`${line}\n`);
};
