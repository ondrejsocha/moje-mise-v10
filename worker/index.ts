interface Env{DB:D1Database;ASSETS:Fetcher}
const json=(v:unknown,s=200,h:Record<string,string>={})=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json","cache-control":"no-store",...h}});
const id=()=>crypto.randomUUID();
const enc=new TextEncoder();
const b64=(a:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const ub64=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
async function hashPassword(p:string,s:string){const k=await crypto.subtle.importKey("raw",enc.encode(p),"PBKDF2",false,["deriveBits"]);return b64(await crypto.subtle.deriveBits({name:"PBKDF2",salt:ub64(s),iterations:210000,hash:"SHA-256"},k,256))}
async function sha(s:string){return b64(await crypto.subtle.digest("SHA-256",enc.encode(s)))}
function cookie(r:Request,n:string){const m=r.headers.get("cookie")?.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):null}
async function me(r:Request,e:Env){const t=cookie(r,"mm_session");if(!t)return null;return await e.DB.prepare("SELECT u.*,f.target_points,f.max_allowance FROM sessions s JOIN users u ON u.id=s.user_id JOIN families f ON f.id=u.family_id WHERE s.token_hash=? AND s.expires_at>datetime('now')").bind(await sha(t)).first<any>()}
async function api(r:Request,e:Env,p:string){
 if(p==="/api/login"&&r.method==="POST"){const b:any=await r.json(),u=await e.DB.prepare("SELECT * FROM users WHERE username=?").bind(b.username).first<any>();if(!u||await hashPassword(b.password||"",u.password_salt)!==u.password_hash)return json({error:"Nesprávné přihlášení"},401);const t=b64(crypto.getRandomValues(new Uint8Array(32)));await e.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,datetime('now','+30 days'))").bind(id(),u.id,await sha(t)).run();return json({ok:true},200,{"set-cookie":`mm_session=${t}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`})}
 const u=await me(r,e);if(!u)return json({error:"Nepřihlášen"},401);
 if(p==="/api/me")return json({user:{nickname:u.nickname,avatar:u.avatar,role:u.role,xp:u.xp,level:Math.floor(Math.sqrt(u.xp/100))+1,target_points:u.target_points,max_allowance:u.max_allowance}});
 if(p==="/api/dashboard"){const tasks=(await e.DB.prepare("SELECT id,title,icon,points FROM tasks WHERE family_id=? AND active=1 ORDER BY position").bind(u.family_id).all()).results;const d=new Date().toISOString().slice(0,10),done=(await e.DB.prepare("SELECT task_id FROM completions WHERE user_id=? AND completed_date=?").bind(u.id,d).all()).results.map((x:any)=>x.task_id);const weekPoints=(await e.DB.prepare("SELECT COALESCE(SUM(t.points),0) p FROM completions c JOIN tasks t ON t.id=c.task_id WHERE c.user_id=? AND c.completed_date>=date('now','-6 days')").bind(u.id).first<any>()).p;return json({tasks,done,weekPoints})}
 if(p==="/api/complete"&&r.method==="POST"){const b:any=await r.json(),d=new Date().toISOString().slice(0,10),t=await e.DB.prepare("SELECT * FROM tasks WHERE id=? AND family_id=?").bind(b.taskId,u.family_id).first<any>();if(b.done){await e.DB.prepare("INSERT OR IGNORE INTO completions(id,family_id,user_id,task_id,completed_date) VALUES(?,?,?,?,?)").bind(id(),u.family_id,u.id,b.taskId,d).run();await e.DB.prepare("UPDATE users SET xp=xp+? WHERE id=?").bind((t?.points||1)*10,u.id).run()}else{await e.DB.prepare("DELETE FROM completions WHERE user_id=? AND task_id=? AND completed_date=?").bind(u.id,b.taskId,d).run()}return json({ok:true})}
 return json({error:"Nenalezeno"},404)
}
export default{async fetch(r:Request,e:Env){const u=new URL(r.url);if(u.pathname.startsWith("/api/"))return api(r,e,u.pathname);return e.ASSETS.fetch(r)}}
