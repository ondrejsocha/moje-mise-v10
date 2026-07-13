import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

type Task={id:string;title:string;icon:string;points:number};
type User={nickname:string;avatar:string;role:string;xp:number;level:number;target_points:number;max_allowance:number};
type Dashboard={tasks:Task[];done:string[];weekPoints:number};

async function api(path:string,options:RequestInit={}){
  const r=await fetch("/api"+path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
  const j=await r.json();
  if(!r.ok) throw new Error(j.error||"Chyba");
  return j;
}

function App(){
  const[user,setUser]=useState<User|null>(null);
  const[data,setData]=useState<Dashboard|null>(null);
  const[login,setLogin]=useState({username:"",password:""});
  const[msg,setMsg]=useState("");

  async function load(){
    try{
      const me=await api("/me"); setUser(me.user);
      const d=await api("/dashboard"); setData(d);
    }catch{setUser(null)}
  }
  useEffect(()=>{load()},[]);

  if(!user){
    return <div className="auth"><div className="card login">
      <div className="logo">🚀</div><h1>Moje mise</h1>
      <input placeholder="Přístupové jméno" value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/>
      <input placeholder="Heslo" type="password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/>
      <button onClick={async()=>{try{await api("/login",{method:"POST",body:JSON.stringify(login)});await load()}catch(e){setMsg((e as Error).message)}}}>Přihlásit</button>
      <p>{msg}</p>
    </div></div>
  }

  if(!data)return <div className="auth">Načítám…</div>;
  const done=new Set(data.done);
  return <div className="app">
    <header><div><small>Moje mise</small><h1>{user.nickname} {user.avatar}</h1></div><button>⚙️</button></header>
    <section className="hero">
      <div><b>LEVEL {user.level}</b><span>{user.xp} XP</span></div>
      <h2>Dnešní mise</h2>
      <p>{done.size}/{data.tasks.length} splněno</p>
    </section>
    <section className="card">
      <h2>Úkoly</h2>
      {data.tasks.map(t=><button className={"task "+(done.has(t.id)?"done":"")} key={t.id} onClick={async()=>{await api("/complete",{method:"POST",body:JSON.stringify({taskId:t.id,done:!done.has(t.id)})});await load()}}>
        <span>{done.has(t.id)?"✓":""}</span><b>{t.icon}</b><div><strong>{t.title}</strong><small>{done.has(t.id)?"Hotovo":"Čeká na tebe"}</small></div><em>+{t.points}</em>
      </button>)}
    </section>
    <section className="card money"><span>💰</span><div><small>Tento týden</small><b>{data.weekPoints} bodů</b></div></section>
  </div>
}
createRoot(document.getElementById("root")!).render(<App/>);
