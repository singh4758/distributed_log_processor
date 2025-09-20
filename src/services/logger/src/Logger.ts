import type { IClock, IDateFormatter, IFileSystem, ILogLevelHelper } from "./core/ports.js";
import { type LOG_LEVELS_KEY } from "./core/types.js";

export type LoggerConfig = {
  log_level: LOG_LEVELS_KEY;
  log_frequency: number;
  log_to_file: boolean;
  log_file_path: string;
  log_max_size: number; // in MB
  console_format: string; // ex: "[{timestamp}] [{level}] {message}"
  file_format: string; // ex: "{timestamp} | {level} | {message}"
  web_host: string;
  web_port: number;
  max_logs_to_display: number;
};

type InMemoryLog = { timestamp: string; level: LOG_LEVELS_KEY; message: string };

export class Logger {
  private logs: InMemoryLog[] = [];

  constructor(
    private readonly config: LoggerConfig,
    private readonly levelHelper: ILogLevelHelper,
    private readonly fs: IFileSystem,
    private readonly formatter: IDateFormatter,
    private readonly clock: IClock
  ) {}

  public log(level: LOG_LEVELS_KEY, message: string): void {
    if (!this.levelHelper.isEnabled(level, this.config.log_level)) return;

    const now = this.clock.now();
    const ts = this.formatter.format(now, "DD-MM-YYYY HH:mm:ss");

    const consoleMsg = this.config.console_format
      .replace("{timestamp}", ts)
      .replace("{level}", level)
      .replace("{message}", message);

    this.logs.push({ timestamp: ts, level, message });
    if (this.logs.length > this.config.max_logs_to_display) this.logs.shift();

    // Console transport (open-closed: we could add more transports later)
    // eslint-disable-next-line no-console
    console.log(consoleMsg);

    if (this.config.log_to_file) this.writeToFile(now, level, message);
  }

  private writeToFile(date: Date, level: LOG_LEVELS_KEY, message: string): void {
    const ts = this.formatter.format(date, "DD-MM-YYYY HH:mm:ss");
    const fileMsg = this.config.file_format
      .replace("{timestamp}", ts)
      .replace("{level}", level)
      .replace("{message}", message);

    if (this.shouldRotate()) this.rotate();

    this.fs.writeFile(this.config.log_file_path, fileMsg);
  }

  private shouldRotate(): boolean {
    const path = this.config.log_file_path;
    if (!this.fs.exists(path)) return false;
    const size = this.fs.sizeInMB(path);
    return size >= this.config.log_max_size;
  }

  private rotate(): void {
    const current = this.config.log_file_path;
    if (!this.fs.exists(current)) return;
    const ts = this.formatter.format(this.clock.now(), "DD_MM_YYYY-HH_mm_ss");
    const rotated = current.replace(/\.log$/, `${ts}.log`);
    this.fs.rename(current, rotated);
    // eslint-disable-next-line no-console
    console.log(`${ts} [INFO] Rotated log file to ${rotated}`);
  }
}