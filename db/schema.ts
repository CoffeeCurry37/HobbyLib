import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const items = sqliteTable('items', { userId:text('user_id').notNull(), id:text('id').notNull(), data:text('data').notNull(), updatedAt:text('updated_at').notNull() }, t=>[primaryKey({columns:[t.userId,t.id]})]);
export const relations = sqliteTable('relations', { userId:text('user_id').notNull(), id:text('id').notNull(), fromId:text('from_id').notNull(), toId:text('to_id').notNull(), kind:text('kind').notNull(), quantity:integer('quantity').notNull().default(1) },t=>[primaryKey({columns:[t.userId,t.id]})]);
export const preferences = sqliteTable('preferences', { userId:text('user_id').primaryKey(), data:text('data').notNull() });
export const notices = sqliteTable('notices', { userId:text('user_id').notNull(), id:text('id').notNull(), data:text('data').notNull() },t=>[primaryKey({columns:[t.userId,t.id]})]);
export const scans = sqliteTable('scans', { userId:text('user_id').notNull(), id:text('id').notNull(), data:text('data').notNull() },t=>[primaryKey({columns:[t.userId,t.id]})]);
