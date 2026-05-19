import type { Request, Response } from 'express';
import { Observable } from 'rxjs';

/**
 * Emits when the client closes the connection before the response is finished.
 */
export function clientAbort$(
  request: Request,
  response: Response,
): Observable<void> {
  return new Observable((subscriber) => {
    const onClose = () => {
      if (!response.writableEnded) {
        subscriber.next();
        subscriber.complete();
      }
    };

    request.on('close', onClose);

    return () => {
      request.off('close', onClose);
    };
  });
}
