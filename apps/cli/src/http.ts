import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { loadCredentials, saveCredentials, StoredCredentials } from './config';

export const buildClient = (apiBase: string): AxiosInstance => {
  return axios.create({
    baseURL: apiBase,
    timeout: 20_000,
    headers: {
      'User-Agent': 'insighta-cli',
      'X-API-Version': '1',
    },
  });
};

const refreshAccessToken = async (creds: StoredCredentials): Promise<StoredCredentials> => {
  const client = buildClient(creds.api_base);
  const resp = await client.post('/auth/refresh', { refresh_token: creds.refresh_token });
  const data = resp.data?.data;
  const next: StoredCredentials = {
    ...creds,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    refresh_expires_at: data.refresh_expires_at,
    user: data.user,
  };
  saveCredentials(next);
  return next;
};

export const authedRequest = async <T>(
  config: AxiosRequestConfig & { url: string; method?: string }
): Promise<T> => {
  let creds = loadCredentials();
  if (!creds) throw new Error('Not logged in. Run `insighta login` first.');

  const client = buildClient(creds.api_base);

  const send = async (token: string) =>
    client.request<{ data: T }>({
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  try {
    const resp = await send(creds.access_token);
    return resp.data.data ?? (resp.data as unknown as T);
  } catch (err: any) {
    const status = err.response?.status;
    if (status !== 401) throw err;
    creds = await refreshAccessToken(creds);
    const retry = await send(creds.access_token);
    return retry.data.data ?? (retry.data as unknown as T);
  }
};

export const authedRaw = async (
  config: AxiosRequestConfig & { url: string; method?: string }
): Promise<{ status: number; data: any; headers: Record<string, string> }> => {
  let creds = loadCredentials();
  if (!creds) throw new Error('Not logged in. Run `insighta login` first.');

  const client = buildClient(creds.api_base);
  const send = async (token: string) =>
    client.request({
      ...config,
      headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });

  let resp = await send(creds.access_token);
  if (resp.status === 401) {
    creds = await refreshAccessToken(creds);
    resp = await send(creds.access_token);
  }
  return { status: resp.status, data: resp.data, headers: resp.headers as any };
};
