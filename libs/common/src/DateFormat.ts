import dayjs from 'dayjs'

export class DateFormat {
  public formatedDate(pattern: string, date: Date): string {
    return dayjs(date.toISOString()).format(pattern);
  }
}