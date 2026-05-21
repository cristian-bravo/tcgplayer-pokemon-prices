import pino from "pino";

export function createLogger(verbose = false): pino.Logger {
  return pino({
    level: verbose ? "debug" : "info"
  });
}
