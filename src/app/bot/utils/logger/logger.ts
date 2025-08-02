import * as fs from 'fs';
import * as path from 'path';
import { LogEntry, LoggerConfig, LogLevel } from './logger.types';

export class UniversalLogger {
  private config: LoggerConfig;
  private colors = {
    [LogLevel.TRACE]: '\x1b[37m', // Белый
    [LogLevel.DEBUG]: '\x1b[36m', // Циан
    [LogLevel.INFO]: '\x1b[32m', // Зеленый
    [LogLevel.WARN]: '\x1b[33m', // Желтый
    [LogLevel.ERROR]: '\x1b[31m', // Красный
    [LogLevel.FATAL]: '\x1b[35m', // Пурпурный
    reset: '\x1b[0m',
  };

  private levelNames = {
    [LogLevel.TRACE]: 'TRACE',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL',
  };

  private logFileStream?: fs.WriteStream;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableColors: true,
      enableTimestamp: true,
      enableContext: true,
      dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      logToFile: false,
      maxFileSize: 10, // MB
      maxFiles: 5,
      ...config,
    };

    if (this.config.logToFile && this.config.filePath) {
      this.initializeFileLogging();
    }
  }

  private initializeFileLogging(): void {
    if (!this.config.filePath) return;

    const logDir = path.dirname(this.config.filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logFileStream = fs.createWriteStream(this.config.filePath, {
      flags: 'a',
      encoding: 'utf8',
    });
  }

  private formatTimestamp(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`
    );
  }

  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.enableTimestamp) {
      const timestamp = this.formatTimestamp(entry.timestamp);
      parts.push(`[${timestamp}]`);
    }

    // Level
    const levelName = this.levelNames[entry.level];
    const coloredLevel = this.config.enableColors
      ? `${this.colors[entry.level]}${levelName}${this.colors.reset}`
      : levelName;
    parts.push(`[${coloredLevel}]`);

    // Context
    if (this.config.enableContext && entry.context) {
      const coloredContext = this.config.enableColors
        ? `\x1b[33m[${entry.context}]\x1b[0m`
        : `[${entry.context}]`;
      parts.push(coloredContext);
    }

    // User/Chat info for Telegram
    if (entry.userId || entry.chatId) {
      const userInfo: string[] = [];
      if (entry.userId) userInfo.push(`User:${entry.userId}`);
      if (entry.chatId) userInfo.push(`Chat:${entry.chatId}`);
      parts.push(`[${userInfo.join(', ')}]`);
    }

    // Message
    parts.push(entry.message);

    // Metadata
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
    }

    // Stack trace
    if (entry.stack && entry.level >= LogLevel.ERROR) {
      parts.push(`\n  Stack: ${entry.stack}`);
    }

    return parts.join(' ');
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private async writeToFile(formattedMessage: string): Promise<void> {
    if (!this.logFileStream || !this.config.logToFile) return;

    // Убираем ANSI цвета для файла
    const cleanMessage = formattedMessage.replace(/\x1b\[[0-9;]*m/g, '');

    return new Promise((resolve, reject) => {
      this.logFileStream!.write(cleanMessage + '\n', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private async sendToTelegram(entry: LogEntry): Promise<void> {
    if (
      !this.config.telegramConfig ||
      entry.level < this.config.telegramConfig.logLevel
    ) {
      return;
    }

    try {
      const { botToken, chatId } = this.config.telegramConfig;
      const levelEmoji = {
        [LogLevel.TRACE]: '🔍',
        [LogLevel.DEBUG]: '🐛',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
        [LogLevel.FATAL]: '💀',
      };

      const message =
        `${levelEmoji[entry.level]} *${this.levelNames[entry.level]}*\n` +
        `⏰ ${this.formatTimestamp(entry.timestamp)}\n` +
        (entry.context ? `📁 Context: \`${entry.context}\`\n` : '') +
        `📝 ${entry.message}` +
        (entry.metadata
          ? `\n\`\`\`json\n${JSON.stringify(entry.metadata, null, 2)}\n\`\`\``
          : '');

      // Здесь должен быть HTTP запрос к Telegram API
      // Для демонстрации просто логируем
      console.log(`Would send to Telegram: ${message}`);
    } catch (error) {
      console.error('Failed to send log to Telegram:', error);
    }
  }

  public async log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      metadata,
      stack: level >= LogLevel.ERROR ? new Error().stack : undefined,
    };

    const formattedMessage = this.formatMessage(entry);

    // Console output
    console.log(formattedMessage);

    // File output
    if (this.config.logToFile) {
      await this.writeToFile(formattedMessage);
    }

    // Telegram output
    await this.sendToTelegram(entry);
  }

  // Public API
  trace(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.TRACE, message, context, metadata);
  }

  debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.WARN, message, context, metadata);
  }

  error(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.ERROR, message, context, metadata);
  }

  fatal(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log(LogLevel.FATAL, message, context, metadata);
  }

  // Специальные методы для Telegram ботов
  logTelegramMessage(
    message: string,
    userId: string | number,
    chatId: string | number,
    level: LogLevel = LogLevel.INFO,
  ): Promise<void> {
    if (!this.shouldLog(level)) return Promise.resolve();

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: 'TelegramBot',
      userId,
      chatId,
    };

    const formattedMessage = this.formatMessage(entry);
    console.log(formattedMessage);

    if (this.config.logToFile) {
      return this.writeToFile(formattedMessage);
    }

    return Promise.resolve();
  }

  // Создание дочернего логгера с контекстом
  createChild(context: string): UniversalLogger {
    const childLogger = new UniversalLogger(this.config);
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = async (
      level: LogLevel,
      message: string,
      childContext?: string,
      metadata?: Record<string, any>,
    ) => {
      const fullContext = childContext ? `${context}:${childContext}` : context;
      return originalLog(level, message, fullContext, metadata);
    };

    return childLogger;
  }

  // Graceful shutdown
  async close(): Promise<void> {
    if (this.logFileStream) {
      return new Promise((resolve) => {
        this.logFileStream!.end(() => {
          resolve();
        });
      });
    }
  }
}
