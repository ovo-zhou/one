import { Subject } from 'rxjs';

export const sandboxEvents$ = new Subject<string>();
export const sandboxService = {
  sendCode: (code: string) => {
    sandboxEvents$.next(code);
  },
};