export class DateUtils {
  /**
   * Fixes timezone issues when sending dates to backend
   * Adds timezone offset to ensure the correct date is sent
   */
  static fixTimezoneForBackend(date: Date): Date {
    if (!date) return date;
    
    const fixedDate = new Date(date);
    // Add timezone offset to compensate for backend timezone difference
    fixedDate.setTime(fixedDate.getTime() - (fixedDate.getTimezoneOffset() * 60000));
    return fixedDate;
  }

  /**
   * Creates a date that represents the exact day without time
   * Useful for birth dates and rental dates
   */
  static createDateOnly(year: number, month: number, day: number): Date {
    const date = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid DST issues
    return this.fixTimezoneForBackend(date);
  }

  /**
   * Converts a date input to a proper date for backend
   */
  static prepareForBackend(dateInput: Date | string): Date {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }
    
    return this.fixTimezoneForBackend(date);
  }

  /**
   * Format date for display (keeps original timezone)
   */
  static formatForDisplay(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  }

  /**
   * Get today's date fixed for backend
   */
  static getTodayForBackend(): Date {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon
    return this.fixTimezoneForBackend(today);
  }
}