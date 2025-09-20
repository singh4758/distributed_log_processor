import { DateFormat as CommonDateFormat, FileHandler as CommonFileHandler } from "@myorg/common-utils";
import type { IClock, IDateFormatter, IFileSystem } from "../core/ports.js";

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}

export class CommonDateFormatterAdapter implements IDateFormatter {
  constructor(private readonly impl: CommonDateFormat = new CommonDateFormat()) {}
  format(date: Date, pattern: string): string {
    return this.impl.formatedDate(pattern, date);
  }
}

export class CommonFileSystemAdapter implements IFileSystem {
  constructor(private readonly impl: CommonFileHandler = new CommonFileHandler()) {}
  writeFile(path: string, content: string): void {
    this.impl.writeFile(path, content);
  }
  exists(path: string): boolean {
    return this.impl.checkFileExist(path);
  }
  sizeInMB(path: string): number {
    return this.impl.fileSizeInMB(path);
  }
  rename(oldPath: string, newPath: string): void {
    this.impl.renameFile(oldPath, newPath);
  }
}
