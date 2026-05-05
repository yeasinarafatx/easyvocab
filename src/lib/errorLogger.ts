/**
 * Centralized error logging for the application
 * Tracks errors for debugging in production
 */

export interface ErrorLog {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  context?: string;
  stack?: string;
  userId?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50; // Keep last 50 errors
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log an error
   */
  error(message: string, error?: Error, context?: string): void {
    this.addLog({
      level: "error",
      message,
      stack: error?.stack,
      context,
    });

    console.error(`❌ ${message}`, error);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: string): void {
    this.addLog({
      level: "warn",
      message,
      context,
    });
    console.warn(`⚠️ ${message}`);
  }

  /**
   * Log info
   */
  info(message: string, context?: string): void {
    this.addLog({
      level: "info",
      message,
      context,
    });
    if (this.isDevelopment) {
      console.log(`ℹ️ ${message}`);
    }
  }

  /**
   * Add a log entry
   */
  private addLog(log: Omit<ErrorLog, "timestamp">): void {
    const newLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      ...log,
    };

    this.logs.push(newLog);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist to localStorage for debugging
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.stringify(this.logs);
        window.localStorage.setItem("app_error_logs", stored);
      } catch {
        // localStorage might be full or disabled
      }
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("app_error_logs");
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogs(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("app_error_logs");
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      // localStorage access failed
    }
  }

  /**
   * Export logs for debugging
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Load existing logs on initialization
if (typeof window !== "undefined") {
  errorLogger.loadLogs();
}
