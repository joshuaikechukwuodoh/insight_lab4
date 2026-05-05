import { createHash, randomBytes } from 'crypto';

const base64Url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const generateCodeVerifier = (): string => base64Url(randomBytes(32));

export const deriveCodeChallenge = (verifier: string): string =>
  base64Url(createHash('sha256').update(verifier).digest());
