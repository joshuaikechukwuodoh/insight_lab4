#!/usr/bin/env node
import { Command } from 'commander';
import kleur from 'kleur';
import { DEFAULT_API_BASE } from './config';
import { login } from './commands/login';
import { logout } from './commands/logout';
import { whoami } from './commands/whoami';
import {
  listProfiles,
  searchProfiles,
  getProfile,
  exportProfiles,
  createProfile,
} from './commands/profiles';

const program = new Command();

program
  .name('insighta')
  .description('Insighta Labs+ CLI — secure profile intelligence from your terminal')
  .version('1.0.0')
  .option('--api <url>', 'Override the API base URL', DEFAULT_API_BASE);

const handleErr = (err: any): never => {
  const msg = err?.response?.data?.error?.message ?? err?.message ?? err;
  console.error(kleur.red('Error:'), msg);
  process.exit(1);
};

program
  .command('login')
  .description('Authenticate with GitHub via OAuth + PKCE')
  .action(async () => {
    const apiBase = (program.opts().api as string) || DEFAULT_API_BASE;
    try {
      await login(apiBase);
    } catch (e) {
      handleErr(e);
    }
  });

program
  .command('logout')
  .description('Revoke the refresh token and clear local credentials')
  .action(async () => {
    try {
      await logout();
    } catch (e) {
      handleErr(e);
    }
  });

program
  .command('whoami')
  .description('Show the currently authenticated user')
  .action(async () => {
    try {
      await whoami();
    } catch (e) {
      handleErr(e);
    }
  });

const profiles = program.command('profiles').description('Profile operations');

profiles
  .command('list')
  .description('List profiles (filters supported)')
  .option('--gender <gender>', 'male | female')
  .option('--age-group <group>', 'child | teenager | adult | senior')
  .option('--country <iso2>', '2-letter country code, e.g. NG')
  .option('--min-age <n>')
  .option('--max-age <n>')
  .option('--sort-by <field>', 'age | created_at | gender_probability')
  .option('--order <order>', 'asc | desc')
  .option('--page <n>', 'page number (default 1)')
  .option('--limit <n>', 'page size (default 20)')
  .option('--json', 'output raw JSON')
  .action(async (opts) => {
    try {
      await listProfiles(opts);
    } catch (e) {
      handleErr(e);
    }
  });

profiles
  .command('search <query...>')
  .description('Natural-language search (e.g. "young males from nigeria")')
  .option('--page <n>')
  .option('--limit <n>')
  .option('--json')
  .action(async (queryParts: string[], opts) => {
    try {
      await searchProfiles(queryParts.join(' '), opts);
    } catch (e) {
      handleErr(e);
    }
  });

profiles
  .command('get <id>')
  .description('Fetch a profile by id')
  .option('--json')
  .action(async (id: string, opts) => {
    try {
      await getProfile(id, opts);
    } catch (e) {
      handleErr(e);
    }
  });

profiles
  .command('export')
  .description('Export profiles as CSV (filters + nl query supported)')
  .option('-o, --output <path>', 'Write CSV to file path; otherwise prints to stdout')
  .option('-q <query>', 'Natural-language query')
  .option('--gender <gender>')
  .option('--age-group <group>')
  .option('--country <iso2>')
  .option('--min-age <n>')
  .option('--max-age <n>')
  .action(async (opts) => {
    try {
      await exportProfiles(opts);
    } catch (e) {
      handleErr(e);
    }
  });

profiles
  .command('create')
  .description('Create a new profile (admin only)')
  .requiredOption('--name <name>')
  .requiredOption('--gender <gender>', 'male | female')
  .requiredOption('--gender-probability <n>', '0.0 - 1.0')
  .requiredOption('--age <n>')
  .requiredOption('--age-group <group>', 'child | teenager | adult | senior')
  .requiredOption('--country <iso2>', '2-letter country code')
  .requiredOption('--country-name <name>')
  .requiredOption('--country-probability <n>', '0.0 - 1.0')
  .option('--json', 'output raw JSON')
  .action(async (opts) => {
    try {
      await createProfile(opts);
    } catch (e) {
      handleErr(e);
    }
  });

program.parseAsync(process.argv).catch(handleErr);
