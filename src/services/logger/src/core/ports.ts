import type { LOG_LEVELS_KEY } from "./types.js";

export interface IClock {
  now(): Date;
}

export interface IDateFormatter {
  format(date: Date, pattern: string): string;
}

export interface IFileSystem {
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  sizeInMB(path: string): number;
  rename(oldPath: string, newPath: string): void;
}

export interface ILogLevelHelper {
  getValue(level: LOG_LEVELS_KEY): number;
  isEnabled(messageLevel: LOG_LEVELS_KEY, configLevel: LOG_LEVELS_KEY): boolean;
}
