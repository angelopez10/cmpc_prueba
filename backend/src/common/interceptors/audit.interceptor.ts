import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { User } from '../../modules/auth/entities/user.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const params = request.params;
    const query = request.query;
    const userAgent = request.headers['user-agent'];
    const ip = request.ip || request.connection.remoteAddress;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          
          const auditLog = {
            timestamp: new Date().toISOString(),
            userId: user?.id || 'anonymous',
            method,
            url,
            ip,
            userAgent,
            requestData: {
              body: this.sanitizeData(body),
              params,
              query,
            },
            responseStatus: context.switchToHttp().getResponse().statusCode,
            responseData: this.sanitizeData(response),
            duration: `${duration}ms`,
          };

          console.log('AUDIT_LOG:', JSON.stringify(auditLog));
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          const auditLog = {
            timestamp: new Date().toISOString(),
            userId: user?.id || 'anonymous',
            method,
            url,
            ip,
            userAgent,
            requestData: {
              body: this.sanitizeData(body),
              params,
              query,
            },
            error: {
              status: error.status,
              message: error.message,
              stack: error.stack,
            },
            duration: `${duration}ms`,
          };

          console.log('AUDIT_ERROR:', JSON.stringify(auditLog));
        },
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}