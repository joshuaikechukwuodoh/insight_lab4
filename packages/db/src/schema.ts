import { pgEnum, pgTable, text, timestamp, uuid, integer, real, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('Role', ['admin', 'analyst']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  githubId: text('github_id').notNull().unique(),
  githubUsername: text('github_username').notNull().unique(),
  email: text('email'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: roleEnum('role').notNull().default('analyst'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: false }),
  replacedBy: uuid('replaced_by'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const oauthStates = pgTable('oauth_states', {
  state: text('state').primaryKey(),
  codeChallenge: text('code_challenge').notNull(),
  codeVerifier: text('code_verifier'),
  clientType: text('client_type').notNull(),
  redirectUri: text('redirect_uri'),
  expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  gender: text('gender').notNull(),
  genderProbability: real('gender_probability').notNull(),
  age: integer('age').notNull(),
  ageGroup: text('age_group').notNull(),
  countryId: varchar('country_id', { length: 2 }).notNull(),
  countryName: text('country_name').notNull(),
  countryProbability: real('country_probability').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

