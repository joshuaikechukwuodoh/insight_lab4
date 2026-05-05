import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const DEFAULT_API_BASE = process.env.INSIGHTA_API ?? 'http://localhost:8787/api/v1';

export const CRED_DIR = path.join(os.homedir(), '.insighta');
export const CRED_FILE = path.join(CRED_DIR, 'credentials.json');

export interface StoredCredentials {
  api_base: string;
  access_token: string;
  refresh_token: string;
  refresh_expires_at: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'analyst';
  };
}

const ensureCredDir = (): void => {
  if (!fs.existsSync(CRED_DIR)) {
    fs.mkdirSync(CRED_DIR, { recursive: true, mode: 0o700 });
  }
};

export const saveCredentials = (creds: StoredCredentials): void => {
  ensureCredDir();
  fs.writeFileSync(CRED_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
  // chmod again in case the file existed with looser perms
  try {
    fs.chmodSync(CRED_FILE, 0o600);
  } catch {
    /* windows tolerates this */
  }
};

export const loadCredentials = (): StoredCredentials | null => {
  if (!fs.existsSync(CRED_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CRED_FILE, 'utf8')) as StoredCredentials;
  } catch {
    return null;
  }
};

export const clearCredentials = (): void => {
  if (fs.existsSync(CRED_FILE)) fs.unlinkSync(CRED_FILE);
};
