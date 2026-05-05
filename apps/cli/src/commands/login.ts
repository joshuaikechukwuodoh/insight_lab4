import open from 'open';
import kleur from 'kleur';
import { buildClient } from '../http';
import { saveCredentials } from '../config';
import { generateCodeVerifier, deriveCodeChallenge } from '../pkce';
import { startLoopbackServer } from '../loopback';

export const login = async (apiBase: string): Promise<void> => {
  const client = buildClient(apiBase);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);

  const loopback = await startLoopbackServer();

  console.log(kleur.dim(`Loopback server listening on ${loopback.redirectUri}`));

  const startResp = await client.post('/auth/github', {
    client_type: 'cli',
    code_challenge: codeChallenge,
    redirect_uri: loopback.redirectUri,
  });

  const authorizeUrl: string = startResp.data?.data?.authorize_url;
  if (!authorizeUrl) throw new Error('Backend did not return authorize_url');

  console.log(kleur.cyan('\nOpening GitHub in your browser to authorize...'));
  console.log(kleur.dim('If the browser does not open, paste this URL:'));
  console.log(kleur.dim(authorizeUrl) + '\n');

  await open(authorizeUrl);

  const { code, state } = await loopback.waitForCallback();
  loopback.close();

  const exchangeResp = await client.post('/auth/github/cli/exchange', {
    code,
    state,
    code_verifier: codeVerifier,
  });

  const data = exchangeResp.data?.data;
  if (!data?.access_token) throw new Error('Backend did not return tokens');

  saveCredentials({
    api_base: apiBase,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    refresh_expires_at: data.refresh_expires_at,
    user: data.user,
  });

  console.log(kleur.green('\n✅ Logged in as ') + kleur.bold(data.user.username));
  console.log(kleur.dim(`   role: ${data.user.role}`));
  console.log(kleur.dim('   credentials saved to ~/.insighta/credentials.json'));
};
