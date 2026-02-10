/**
 * Logger Centralizado
 * 
 * Substitui console.log direto para:
 * - Controlar logs em produção
 * - Facilitar integração com Sentry/LogRocket
 * - Padronizar formato de logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: string;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private logs: LogEntry[] = [];
    private maxLogs = 100; // Manter últimos 100 logs em memória

    private log(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        // Adicionar ao histórico
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Log no console
        // - Em desenvolvimento: Tudo
        // - Em produção: Apenas Erros, ou se localStorage.debug = 'true'
        const shouldLog = this.isDevelopment || level === 'error' || (typeof window !== 'undefined' && window.localStorage.getItem('debug') === 'true');

        if (shouldLog) {
            const emoji: Record<LogLevel, string> = {
                debug: '🔍',
                info: 'ℹ️',
                warn: '⚠️',
                error: '❌'
            };

            const style: Record<LogLevel, string> = {
                debug: 'color: #6B7280',
                info: 'color: #3B82F6',
                warn: 'color: #F59E0B',
                error: 'color: #EF4444; font-weight: bold'
            };

            // Safe access for emoji and style
            const icon = emoji[level] || '';
            const css = style[level] || '';

            console.log(
                `%c${icon} [${level.toUpperCase()}] ${message}`,
                css,
                data !== undefined ? data : ''
            );
        }

        // Em produção, enviar erros para serviço externo
        if (!this.isDevelopment && level === 'error') {
            // TODO: Integrar com Sentry/LogRocket
            // Sentry.captureException(data);
        }
    }

    /**
     * Log de debug - apenas em desenvolvimento
     */
    debug(message: string, data?: any) {
        this.log('debug', message, data);
    }

    /**
     * Log informativo
     */
    info(message: string, data?: any) {
        this.log('info', message, data);
    }

    /**
     * Log de aviso
     */
    warn(message: string, data?: any) {
        this.log('warn', message, data);
    }

    /**
     * Log de erro - sempre registrado
     */
    error(message: string, error?: Error | any) {
        this.log('error', message, error);
    }

    /**
     * Retorna histórico de logs
     */
    getHistory(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Limpa histórico de logs
     */
    clearHistory() {
        this.logs = [];
    }
}

// Singleton
export const logger = new Logger();

// Helpers para casos específicos
export const logApiCall = (endpoint: string, method: string, data?: any) => {
    logger.debug(`API Call: ${method} ${endpoint}`, data);
};

export const logApiError = (endpoint: string, error: any) => {
    logger.error(`API Error: ${endpoint}`, error);
};

export const logComponentMount = (componentName: string) => {
    logger.debug(`Component Mounted: ${componentName}`);
};

export const logComponentUnmount = (componentName: string) => {
    logger.debug(`Component Unmounted: ${componentName}`);
};
