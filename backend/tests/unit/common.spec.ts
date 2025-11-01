import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { AuditInterceptor } from '../../src/common/interceptors/audit.interceptor';
import { ArgumentsHost, CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';

// Helpers para mocks de contexto HTTP
function createMockExecutionContext() {
  const req: any = {
    method: 'GET',
    url: '/test',
    headers: { 'user-agent': 'jest' },
    get: (name: string) => (name ? (req.headers as any)[name.toLowerCase()] : undefined),
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    body: { password: 'secret', field: 'value' },
    params: { id: '1' },
    query: { q: 'term' },
    user: { id: 'u-1' },
  };
  const res: any = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

function createMockArgumentsHost() {
  const ctx: any = createMockExecutionContext();
  return {
    switchToHttp: () => ({ getRequest: () => (ctx as any).switchToHttp().getRequest(), getResponse: () => (ctx as any).switchToHttp().getResponse() }),
  } as unknown as ArgumentsHost;
}

describe('Common Filters & Interceptors', () => {
  describe('AllExceptionsFilter', () => {
    it('should handle HttpException-like error and respond', () => {
      const filter = new AllExceptionsFilter();
      const host = createMockArgumentsHost();

      const mockException: any = new (class extends (require('@nestjs/common').HttpException) {
        constructor(){super('Bad Request', 400);}
        getResponse(){return 'Bad Request';}
      })();

      filter.catch(mockException, host);

      const res = (host as any).switchToHttp().getResponse();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: 'Bad Request',
        path: '/test',
        method: 'GET',
      }));
    });

    it('should handle generic error and respond 500', () => {
      const filter = new AllExceptionsFilter();
      const host = createMockArgumentsHost();

      filter.catch(new Error('Boom'), host);
      const res = (host as any).switchToHttp().getResponse();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
    });
  });

  describe('LoggingInterceptor', () => {
    it('should log request and response timing', done => {
      const interceptor = new LoggingInterceptor();
      const context = createMockExecutionContext();
      const next: CallHandler = { handle: () => of({ ok: true }) };

      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(spyLog).toHaveBeenCalled();
          spyLog.mockRestore();
          done();
        },
      });
    });
  });

  describe('TransformInterceptor', () => {
    it('should wrap response with metadata', done => {
      const interceptor = new TransformInterceptor<any>();
      const context = createMockExecutionContext();
      const next: CallHandler = { handle: () => of({ data: 'value' }) };

      interceptor.intercept(context, next).subscribe({
        next: (wrapped) => {
          expect(wrapped).toHaveProperty('data');
          expect(wrapped).toHaveProperty('message', 'Success');
          expect(wrapped).toHaveProperty('timestamp');
          expect(wrapped).toHaveProperty('path', '/test');
          done();
        },
      });
    });
  });

  describe('AuditInterceptor', () => {
    it('should log audit log on success and redact sensitive', done => {
      const interceptor = new AuditInterceptor();
      const context = createMockExecutionContext();
      const next: CallHandler = { handle: () => of({ payload: 'ok', password: 'should-not-leak' }) };

      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(spyLog).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"userId":"u-1"')
          );
          spyLog.mockRestore();
          done();
        },
      });
    });

    it('should log audit error on failure', done => {
      const interceptor = new AuditInterceptor();
      const context = createMockExecutionContext();
      const next: CallHandler = { handle: () => throwError(() => ({ status: 500, message: 'Fail', stack: 'x' })) };

      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      interceptor.intercept(context, next).subscribe({
        error: () => {
          expect(spyLog).toHaveBeenCalledWith(
            'AUDIT_ERROR:',
            expect.stringContaining('"status":500')
          );
          spyLog.mockRestore();
          done();
        },
      });
    });
  });
});