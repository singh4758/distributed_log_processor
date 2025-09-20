import { LOG_LEVELS, type LOG_LEVELS_KEY, type LOG_LEVELS_VALUE } from "./core/types.js";


class LoggerConfig {
  log_level: LOG_LEVELS_KEY;
  log_frequency: number;
  log_to_file: boolean;
  log_file_path: string;
  log_max_size: number;
  console_format: string;
  file_format: string;
  web_host: string;
  web_port: number;
  max_logs_to_display: number;

  private static instance: LoggerConfig;

  private constructor() {
    const envLogLevel = process.env.LOG_LEVEL;
    this.log_level = (envLogLevel && Object.prototype.hasOwnProperty.call(LOG_LEVELS, envLogLevel) ? envLogLevel : "INFO") as LOG_LEVELS_KEY;
    this.log_frequency = Number.parseFloat(process.env.LOG_FREQUENCY ?? "5.0");
    this.log_to_file = (process.env.LOG_TO_FILE ?? "true") === "true";
    this.log_file_path = process.env.LOG_FILE_PATH ?? "logs/logger.log";
    this.log_max_size = Number.parseFloat(process.env.LOG_MAX_SIZE_MB ?? "1.0");
    this.console_format = "[{timestamp}] [{level}] {message}";
    this.file_format = "{timestamp} | {level} | {message}";
    this.web_host = process.env.WEB_HOST ?? "0.0.0.0";
    this.web_port = Number.parseInt(process.env.WEB_PORT ?? "8080");
    this.max_logs_to_display = Number.parseInt(process.env.MAX_LOGS_TO_DISPLAY ?? "100");
  }

  public static getInstance(): LoggerConfig {
    if (!LoggerConfig.instance) {
      LoggerConfig.instance = new LoggerConfig();
    }
    return LoggerConfig.instance;
  }
}

class LogLevelHelper {
  public getLogLevelValue(level: LOG_LEVELS_KEY): LOG_LEVELS_VALUE {
    return LOG_LEVELS[level];
  }

  public isLogEnabled(messageLevel: LOG_LEVELS_KEY, configLevel: LOG_LEVELS_KEY): boolean {
    return this.getLogLevelValue(messageLevel) >= this.getLogLevelValue(configLevel);
  }
}

export { LoggerConfig, LOG_LEVELS, LogLevelHelper, type LOG_LEVELS_KEY, type LOG_LEVELS_VALUE };
