import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import type {Database,Statement} from '../lib/radar/store';

export function openDatabase(filename:string):Database & {raw:DatabaseSync;close:()=>void}{
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true,mode:0o700});
 const raw=new DatabaseSync(filename);raw.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
 raw.exec(`
 CREATE TABLE IF NOT EXISTS items(user_id TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,id));
 CREATE TABLE IF NOT EXISTS relations(user_id TEXT NOT NULL,id TEXT NOT NULL,from_id TEXT NOT NULL,to_id TEXT NOT NULL,kind TEXT NOT NULL,quantity INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(user_id,id));
 CREATE TABLE IF NOT EXISTS preferences(user_id TEXT PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS notices(user_id TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(user_id,id));
 CREATE TABLE IF NOT EXISTS scans(user_id TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(user_id,id));
 CREATE TABLE IF NOT EXISTS monitor_jobs(url TEXT PRIMARY KEY,next_at INTEGER NOT NULL DEFAULT 0,cursor TEXT,visited TEXT NOT NULL DEFAULT '[]',pending TEXT NOT NULL DEFAULT '[]',failures INTEGER NOT NULL DEFAULT 0,paused TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT '');
 `);
 if(!raw.prepare('PRAGMA table_info(monitor_jobs)').all().some(c=>c.name==='pending'))raw.exec("ALTER TABLE monitor_jobs ADD COLUMN pending TEXT NOT NULL DEFAULT '[]'");
 class SqlStatement implements Statement{
  constructor(public sql:string,public values:any[]=[]){ }
  bind(...values:any[]){return new SqlStatement(this.sql,values);}
  execute(){const statement=raw.prepare(this.sql);if(statement.columns().length)return{results:statement.all(...this.values)};statement.run(...this.values);return{results:[]};}
  async run(){return this.execute();}
  async all(){return this.execute();}
 }
 return {raw,prepare(sql:string){return new SqlStatement(sql);},async batch(statements:Statement[]){raw.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>(s as SqlStatement).execute());raw.exec('COMMIT');return results;}catch(e){raw.exec('ROLLBACK');throw e;}},close(){raw.close();}};
}
