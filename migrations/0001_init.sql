PRAGMA foreign_keys=ON;
CREATE TABLE families(id TEXT PRIMARY KEY,name TEXT NOT NULL,target_points INTEGER DEFAULT 185,max_allowance INTEGER DEFAULT 250);
CREATE TABLE users(id TEXT PRIMARY KEY,family_id TEXT NOT NULL,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,nickname TEXT NOT NULL,avatar TEXT DEFAULT '🧒',role TEXT DEFAULT 'child',xp INTEGER DEFAULT 0,FOREIGN KEY(family_id) REFERENCES families(id));
CREATE TABLE sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE tasks(id TEXT PRIMARY KEY,family_id TEXT NOT NULL,title TEXT NOT NULL,icon TEXT DEFAULT '⭐',points INTEGER DEFAULT 1,position INTEGER DEFAULT 0,active INTEGER DEFAULT 1,FOREIGN KEY(family_id) REFERENCES families(id));
CREATE TABLE completions(id TEXT PRIMARY KEY,family_id TEXT NOT NULL,user_id TEXT NOT NULL,task_id TEXT NOT NULL,completed_date TEXT NOT NULL,UNIQUE(user_id,task_id,completed_date));
