import {
  pgTable, uuid, varchar, text, boolean,
  smallint, integer, date, timestamp, primaryKey,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const habits = pgTable('habits', {
  id: varchar('id', { length: 50 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  defaultVersion: text('default_version').notNull(),
  fallbackVersion: text('fallback_version').notNull(),
  slot: varchar('slot', { length: 50 }).notNull(),
  inFocus: smallint('in_focus').default(0).notNull(),
  focusOrder: integer('focus_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.id, t.userId] })])

export const checkins = pgTable('checkins', {
  id: varchar('id', { length: 100 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  habitId: varchar('habit_id', { length: 50 }).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  reason: varchar('reason', { length: 50 }),
  note: text('note'),
  usedFallback: boolean('used_fallback').default(false).notNull(),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.id, t.userId] })])

export const dayLogs = pgTable('day_logs', {
  date: date('date').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  disrupted: boolean('disrupted').default(false).notNull(),
  disruptionNote: text('disruption_note'),
}, (t) => [primaryKey({ columns: [t.date, t.userId] })])

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  slotsUnlocked: smallint('slots_unlocked').default(1).notNull(),
  aiEnabled: boolean('ai_enabled').default(false).notNull(),
  apiProvider: varchar('api_provider', { length: 20 }),
  apiKeyEncrypted: text('api_key_encrypted'),
  weekStartsOn: smallint('week_starts_on').default(1).notNull(),
})

export type User = typeof users.$inferSelect
export type Habit = typeof habits.$inferSelect
export type Checkin = typeof checkins.$inferSelect
export type DayLog = typeof dayLogs.$inferSelect
export type UserSettings = typeof userSettings.$inferSelect
