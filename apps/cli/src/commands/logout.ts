import kleur from 'kleur';
import { buildClient } from '../http';
import { loadCredentials, clearCredentials } from '../config';

export const logout = async (): Promise<void> => {
  const creds = loadCredentials();
  if (!creds) {
    console.log(kleur.yellow('You were not logged in.'));
    return;
  }

  try {
    const client = buildClient(creds.api_base);
    await client.post('/auth/logout', { refresh_token: creds.refresh_token });
  } catch {
    /* still clear local creds even if server call fails */
  }

  clearCredentials();
  console.log(kleur.green('✅ Logged out.'));
};
