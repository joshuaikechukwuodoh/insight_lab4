import kleur from 'kleur';
import { authedRequest } from '../http';

interface MeResp {
  id: string;
  github_username: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'analyst';
  created_at: string;
}

export const whoami = async (): Promise<void> => {
  const me = await authedRequest<MeResp>({ method: 'GET', url: '/auth/me' });
  console.log(`${kleur.bold('user:')}     ${me.github_username}`);
  console.log(`${kleur.bold('id:')}       ${me.id}`);
  console.log(`${kleur.bold('role:')}     ${me.role}`);
  if (me.email) console.log(`${kleur.bold('email:')}    ${me.email}`);
  if (me.name) console.log(`${kleur.bold('name:')}     ${me.name}`);
  console.log(`${kleur.bold('joined:')}   ${me.created_at}`);
};
