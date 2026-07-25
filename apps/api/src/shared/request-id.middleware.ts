import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
