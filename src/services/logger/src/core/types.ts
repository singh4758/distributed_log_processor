export enum LOG_LEVELS {
  DEBUG = 10,
  INFO = 20,
  WARNING = 30,
  ERROR = 40,
  CRITICAL = 50
}

export type LOG_LEVELS_KEY = keyof typeof LOG_LEVELS;
export type LOG_LEVELS_VALUE = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export type LogEntry = {
  timestamp: Date;
  level: LOG_LEVELS_KEY;
  message: string;
};
