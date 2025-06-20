import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Default configuration
const DEFAULT_CONFIG = {
  level: LogLevel.INFO,
  logFile: path.join(__dirname, "../logs/app.log"),
  console: true,
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

// Ensure log directory exists
function ensureLogDirectoryExists(): void {
  const logDir = path.dirname(config.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// Format log message
function formatLogMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

// Write to log file
function writeToLogFile(message: string): void {
  ensureLogDirectoryExists();
  fs.appendFileSync(config.logFile, message + "\n");
}

// Configure logger
export function configureLogger(options: Partial<typeof DEFAULT_CONFIG>): void {
  config = { ...config, ...options };
  ensureLogDirectoryExists();
}

// Log functions
export function error(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.ERROR) {
    const formattedMessage = formatLogMessage("ERROR", message);
    if (config.console) console.error(formattedMessage, ...args);
    writeToLogFile(
      formattedMessage + (args.length ? " " + JSON.stringify(args) : ""),
    );
  }
}

export function warn(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.WARN) {
    const formattedMessage = formatLogMessage("WARN", message);
    if (config.console) console.warn(formattedMessage, ...args);
    writeToLogFile(
      formattedMessage + (args.length ? " " + JSON.stringify(args) : ""),
    );
  }
}

export function info(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.INFO) {
    const formattedMessage = formatLogMessage("INFO", message);
    if (config.console) console.info(formattedMessage, ...args);
    writeToLogFile(
      formattedMessage + (args.length ? " " + JSON.stringify(args) : ""),
    );
  }
}

export function debug(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.DEBUG) {
    const formattedMessage = formatLogMessage("DEBUG", message);
    if (config.console) console.debug(formattedMessage, ...args);
    writeToLogFile(
      formattedMessage + (args.length ? " " + JSON.stringify(args) : ""),
    );
  }
}
