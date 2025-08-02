export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string | number;
  chatId?: string | number;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableContext: boolean;
  dateFormat: string;
  logToFile: boolean;
  filePath?: string;
  maxFileSize?: number; // в MB
  maxFiles?: number;
  telegramConfig?: {
    botToken: string;
    chatId: string;
    logLevel: LogLevel;
  };
}
