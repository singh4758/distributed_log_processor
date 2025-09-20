import type { ILogLevelHelper } from "../core/ports.js";
import { LogLevelHelper, type LOG_LEVELS_KEY } from "../config.js";

export class LogLevelHelperAdapter implements ILogLevelHelper {
  constructor(private readonly impl: LogLevelHelper = new LogLevelHelper()) {}
  getValue(level: LOG_LEVELS_KEY): number {
    return this.impl.getLogLevelValue(level);
  }
  isEnabled(messageLevel: LOG_LEVELS_KEY, configLevel: LOG_LEVELS_KEY): boolean {
    return this.impl.isLogEnabled(messageLevel, configLevel);
  }
}
