import { createLogger, format, transports, Logger } from 'winston';
import 'winston-daily-rotate-file';

// Define the logger configuration
const logger: Logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {

            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            filename: 'logs/%DATE%-app.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
        }),
        new transports.DailyRotateFile({
            filename: 'logs/%DATE%-errors.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
        }),
    ],
});

export default logger;