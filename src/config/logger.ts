import { createLogger, format, transports, addColors } from "winston";

const loggerLevels = {
  levels: {
    error: 0,
    warn: 1,
    help: 2,
    data: 3,
    info: 4,
    debug: 5,
    prompt: 6,
    verbose: 7,
    input: 8,
    silly: 9,
  },
  colors: {
    error: "red",
    warn: "yellow",
    help: "cyan",
    data: "magenta",
    info: "green",
    debug: "blue",
    prompt: "white",
    verbose: "grey",
    input: "green",
    silly: "rainbow",
  },
};

addColors(loggerLevels.colors);

const logger = createLogger({
  levels: loggerLevels.levels,
  level: "silly",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
  ],
});

export default logger;
