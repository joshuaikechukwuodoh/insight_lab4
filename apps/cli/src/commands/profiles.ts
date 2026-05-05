import * as fs from 'fs';
import kleur from 'kleur';
import { authedRequest, authedRaw } from '../http';

interface Profile {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  gender_probability: number;
  country_probability: number;
}

interface PaginatedEnvelope {
  status: 'success';
  data: Profile[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  links: {
    self: string;
    first: string;
    last: string;
    next: string | null;
    prev: string | null;
  };
}

const buildQuery = (opts: Record<string, string | number | undefined>): string => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) {
    if (v !== undefined && v !== '' && v !== null) usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
};

const printTable = (rows: Profile[]): void => {
  if (rows.length === 0) {
    console.log(kleur.dim('No profiles matched.'));
    return;
  }
  const cols = ['name', 'gender', 'age', 'age_group', 'country_id'] as const;
  const widths = cols.map((c) =>
    Math.max(c.length, ...rows.map((r) => String((r as any)[c]).length))
  );
  const header = cols.map((c, i) => kleur.bold(c.padEnd(widths[i]))).join('  ');
  console.log(header);
  console.log(cols.map((_, i) => '-'.repeat(widths[i])).join('  '));
  for (const r of rows) {
    console.log(cols.map((c, i) => String((r as any)[c]).padEnd(widths[i])).join('  '));
  }
};

const printPaginated = (body: PaginatedEnvelope): void => {
  printTable(body.data);
  console.log(
    kleur.dim(
      `\npage ${body.page}/${body.total_pages || 1} · ${body.total} total` +
        (body.links.next ? ` · next: ${body.links.next}` : '')
    )
  );
};

export const listProfiles = async (opts: {
  gender?: string;
  ageGroup?: string;
  country?: string;
  minAge?: string;
  maxAge?: string;
  sortBy?: string;
  order?: string;
  page?: string;
  limit?: string;
  json?: boolean;
}): Promise<void> => {
  const qs = buildQuery({
    gender: opts.gender,
    age_group: opts.ageGroup,
    country_id: opts.country,
    min_age: opts.minAge,
    max_age: opts.maxAge,
    sort_by: opts.sortBy,
    order: opts.order,
    page: opts.page,
    limit: opts.limit,
  });

  const raw = await authedRaw({ method: 'GET', url: `/profiles${qs}` });
  if (raw.status !== 200) {
    console.error(kleur.red('Error:'), raw.data?.error?.message ?? raw.data);
    process.exit(1);
  }

  const body = raw.data as PaginatedEnvelope;
  if (opts.json) {
    process.stdout.write(JSON.stringify(body, null, 2) + '\n');
    return;
  }
  printPaginated(body);
};

export const searchProfiles = async (
  q: string,
  opts: { page?: string; limit?: string; json?: boolean }
): Promise<void> => {
  const qs = buildQuery({ q, page: opts.page, limit: opts.limit });
  const raw = await authedRaw({ method: 'GET', url: `/profiles/search${qs}` });
  if (raw.status !== 200) {
    console.error(kleur.red('Error:'), raw.data?.error?.message ?? raw.data);
    process.exit(1);
  }
  const body = raw.data as PaginatedEnvelope;
  if (opts.json) {
    process.stdout.write(JSON.stringify(body, null, 2) + '\n');
    return;
  }
  printPaginated(body);
};

export const getProfile = async (id: string, opts: { json?: boolean }): Promise<void> => {
  const raw = await authedRaw({ method: 'GET', url: `/profiles/${id}` });
  if (raw.status !== 200) {
    console.error(kleur.red('Error:'), raw.data?.error?.message ?? raw.data);
    process.exit(1);
  }
  const profile = raw.data?.data as Profile;
  if (opts.json) {
    process.stdout.write(JSON.stringify(profile, null, 2) + '\n');
    return;
  }
  for (const [k, v] of Object.entries(profile)) {
    console.log(`${kleur.bold(k.padEnd(22))}${v}`);
  }
};

export const exportProfiles = async (opts: {
  output?: string;
  q?: string;
  gender?: string;
  ageGroup?: string;
  country?: string;
  minAge?: string;
  maxAge?: string;
}): Promise<void> => {
  const qs = buildQuery({
    q: opts.q,
    gender: opts.gender,
    age_group: opts.ageGroup,
    country_id: opts.country,
    min_age: opts.minAge,
    max_age: opts.maxAge,
  });
  const raw = await authedRaw({ method: 'GET', url: `/profiles/export${qs}` });
  if (raw.status !== 200) {
    console.error(kleur.red('Error:'), raw.data?.error?.message ?? raw.data);
    process.exit(1);
  }

  const csv = typeof raw.data === 'string' ? raw.data : String(raw.data);
  if (opts.output) {
    fs.writeFileSync(opts.output, csv);
    console.log(kleur.green(`✅ Saved ${csv.split('\n').length - 1} rows to ${opts.output}`));
  } else {
    process.stdout.write(csv);
  }
};

export const createProfile = async (opts: {
  name: string;
  gender: string;
  genderProbability: string;
  age: string;
  ageGroup: string;
  country: string;
  countryName: string;
  countryProbability: string;
  json?: boolean;
}): Promise<void> => {
  const payload = {
    name: opts.name,
    gender: opts.gender,
    gender_probability: parseFloat(opts.genderProbability),
    age: parseInt(opts.age, 10),
    age_group: opts.ageGroup,
    country_id: opts.country,
    country_name: opts.countryName,
    country_probability: parseFloat(opts.countryProbability),
  };

  const raw = await authedRaw({
    method: 'POST',
    url: '/profiles',
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });

  if (raw.status !== 201) {
    console.error(kleur.red('Error:'), raw.data?.error?.message ?? raw.data);
    process.exit(1);
  }

  const created = raw.data?.data as Profile;
  if (opts.json) {
    process.stdout.write(JSON.stringify(created, null, 2) + '\n');
    return;
  }
  console.log(kleur.green('✅ Profile created'));
  for (const [k, v] of Object.entries(created)) {
    console.log(`${kleur.bold(k.padEnd(22))}${v}`);
  }
};
