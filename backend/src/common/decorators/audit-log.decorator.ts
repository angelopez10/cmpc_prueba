import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export const AuditLog = () => SetMetadata(AUDIT_LOG_KEY, true);