import moment from "moment-timezone";
import { createLogger, transports, format } from "winston";
const { combine, timestamp, json } = format;

export const logger = createLogger({
  transports: [new transports.Console()],
  format: combine(
    timestamp({
      format: () =>
        moment().tz("America/Guatemala").format("YYYY-MM-DD hh:mm:ss.SSS A"),
    }),
    json()
  ),
});
