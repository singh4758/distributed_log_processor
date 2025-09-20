import { LoggerConfig } from "./config.js";
import { Logger } from "./Logger.js";
import { LOG_LEVELS, type LOG_LEVELS_KEY } from "./core/types.js";
import { CommonDateFormatterAdapter, CommonFileSystemAdapter, SystemClock } from "./adapters/common.adapters.js";
import { LogLevelHelperAdapter } from "./adapters/level_helper.adapter.js";

function main() {
  const logger_config = LoggerConfig.getInstance();
  const log_level_helper = new LogLevelHelperAdapter();
  const file_handler = new CommonFileSystemAdapter();
  const date_format = new CommonDateFormatterAdapter();
  const clock = new SystemClock();

  const log_level = new Logger(
    logger_config,
    log_level_helper,
    file_handler,
    date_format,
    clock
  );

  log_level.log(LOG_LEVELS[LOG_LEVELS.INFO] as LOG_LEVELS_KEY, "Hello everyone");
}

main();

