import * as http from 'http';
import { AddressInfo } from 'net';

export interface LoopbackResult {
  code: string;
  state: string;
}

export const startLoopbackServer = (): Promise<{
  port: number;
  redirectUri: string;
  waitForCallback: () => Promise<LoopbackResult>;
  close: () => void;
}> =>
  new Promise((resolve, reject) => {
    let resolveCb: ((v: LoopbackResult) => void) | null = null;
    let rejectCb: ((e: Error) => void) | null = null;

    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const code = url.searchParams.get('code') || '';
      const state = url.searchParams.get('state') || '';
      const error = url.searchParams.get('error');

      if (error) {
        res.statusCode = 400;
        res.end(`OAuth error: ${error}`);
        rejectCb?.(new Error(`OAuth error: ${error}`));
        return;
      }
      if (!code || !state) {
        res.statusCode = 400;
        res.end('Missing code or state');
        rejectCb?.(new Error('Missing code or state'));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(
        '<!doctype html><html><head><title>Insighta CLI</title></head>' +
          '<body style="font-family:system-ui;padding:48px;text-align:center">' +
          '<h2>You can close this tab.</h2>' +
          '<p>Insighta CLI received the authorization code.</p>' +
          '</body></html>'
      );
      resolveCb?.({ code, state });
    });

    server.on('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      const waitForCallback = (): Promise<LoopbackResult> =>
        new Promise<LoopbackResult>((res, rej) => {
          resolveCb = res;
          rejectCb = rej;
        });
      const close = () => server.close();
      resolve({ port, redirectUri, waitForCallback, close });
    });
  });
