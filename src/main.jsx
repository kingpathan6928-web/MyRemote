import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard, Smartphone, Image, History, Settings, Sun, Moon, Globe, Camera, Mic, MapPin, Bell, FolderOpen, Upload, ArrowRight, CheckCircle2, LogOut, Mail, Lock, User, LoaderCircle} from 'lucide-react';
import {supabase} from './supabase';
import './style.css';

const permissions = [
  {id:'camera', label:'Camera', desc:'Camera access for video features', Icon:Camera},
  {id:'microphone', label:'Microphone', desc:'Audio and video call support', Icon:Mic},
  {id:'files', label:'File picker', desc:'Choose files from your phone', Icon:FolderOpen},
  {id:'gallery', label:'Photos & videos', desc:'Select photos and videos', Icon:Image},
  {id:'location', label:'Location', desc:'Location features with user consent', Icon:MapPin},
  {id:'notifications', label:'Notifications', desc:'App notifications where supported', Icon:Bell},
];
function App(){
 const [user,setUser]=useState(null), [authReady,setAuthReady]=useState(false);
 const [authMode,setAuthMode]=useState('signup'), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [fullName,setFullName]=useState(''), [authBusy,setAuthBusy]=useState(false), [authMessage,setAuthMessage]=useState('');
 const [tab,setTab]=useState('builder'), [theme,setTheme]=useState('dark'), [mode,setMode]=useState('fast');
 const [url,setUrl]=useState(''), [appName,setAppName]=useState('My Website'), [pkg,setPkg]=useState('com.example.mywebsite');
 const [selected,setSelected]=useState([]), [notice,setNotice]=useState('');
 const [iconFile,setIconFile]=useState(null), [iconPreview,setIconPreview]=useState(''), [saving,setSaving]=useState(false);
 useEffect(()=>{
   if(!supabase){setAuthReady(true);return;}
   supabase.auth.getSession().then(({data})=>{setUser(data.session?.user ?? null);setAuthReady(true);});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user ?? null));
   return ()=>subscription.unsubscribe();
 },[]);
 const toggle=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const authSubmit=async(e)=>{
   e.preventDefault(); setAuthMessage('');
   if(!supabase){setAuthMessage('Supabase config missing. Add the two VITE variables in Vercel settings.');return;}
   setAuthBusy(true);
   try{
    if(authMode==='signup'){
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName},emailRedirectTo:window.location.origin}});
      if(error) throw error;
      setAuthMessage(data.session?'Account created and signed in.':'Account created. Check your email and confirm your address, then sign in.');
    }else{
      const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error;
      setAuthMessage('Signed in successfully.');
    }
   }catch(err){setAuthMessage(err.message || 'Authentication failed.');}
   finally{setAuthBusy(false);}
 };
 const signOut=async()=>{await supabase?.auth.signOut();setNotice('');};
 const saveProject=async(e)=>{
   e.preventDefault(); setNotice('');
   if(!/^https:\/\//i.test(url)){setNotice('Please enter a valid HTTPS website URL.');return;}
   if(!supabase || !user){setNotice('Please sign in first.');return;}
   setSaving(true);
   try{
     let iconUrl=null;
     if(iconFile){
       const safeName=iconFile.name.replace(/[^a-zA-Z0-9._-]/g,'-');
       const path=`${user.id}/${Date.now()}-${safeName}`;
       const {error:uploadError}=await supabase.storage.from('app-assets').upload(path,iconFile,{upsert:false,contentType:iconFile.type});
       if(uploadError) throw uploadError;
       iconUrl=path;
     }
     const {error}=await supabase.from('projects').insert({user_id:user.id,app_name:appName,package_name:pkg,website_url:url,icon_url:iconUrl});
     if(error) throw error;
     setNotice('Project details saved to your MyRemote account. APK generation is not connected yet.');
   }catch(err){setNotice(`Could not save project: ${err.message}`);}
   finally{setSaving(false);}
 };
 if(!authReady)return <div className="authscreen"><div className="authcard">Loading MyRemote…</div></div>;
 if(!user)return <div className="authscreen"><form className="authcard" onSubmit={authSubmit}><div className="brand authbrand"><div className="brandmark">M</div><div><b>MyRemote</b><small>WEB TO APK STUDIO</small></div></div><div className="eyebrow">YOUR WORKSPACE</div><h1>{authMode==='signup'?'Create your account':'Welcome back'}</h1><p className="authhint">{authMode==='signup'?'Sign up to save your projects and uploads.':'Sign in to continue to MyRemote.'}</p>{authMode==='signup'&&<><label>Full name</label><div className="authinput"><User size={17}/><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" required/></div></>}<label>Email address</label><div className="authinput"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><label>Password</label><div className="authinput"><Lock size={17}/><input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" required/></div><button className="primary" disabled={authBusy}>{authBusy?<LoaderCircle className="spin" size={17}/>:null}{authMode==='signup'?'Create account':'Sign in'} <ArrowRight size={17}/></button>{authMessage&&<div className="notice">{authMessage}</div>}<p className="authswitch">{authMode==='signup'?'Already have an account?':'New to MyRemote?'} <button type="button" onClick={()=>{setAuthMode(authMode==='signup'?'signin':'signup');setAuthMessage('')}}>{authMode==='signup'?'Sign in':'Create account'}</button></p><small className="authfoot">Email confirmation is enabled in Supabase. Check your inbox after signing up.</small></form></div>;
 return <div className={theme==='dark'?'app dark':'app light'}>
  <aside className="sidebar"><div className="brand"><div className="brandmark">M</div><div><b>MyRemote</b><small>WEB TO APK STUDIO</small></div></div><div className="navlabel">WORKSPACE</div>
   {[['overview','Overview',LayoutDashboard],['builder','APK Builder',Smartphone],['wallpaper','Wallpaper Studio',Image],['history','Build History',History]].map(([id,label,Icon])=><button key={id} className={'navitem '+(tab===id?'active':'')} onClick={()=>{setTab(id);setNotice('')}}><Icon size={18}/><span>{label}</span>{id==='builder'&&<i/>}</button>)}
   <div className="sidebarbottom"><button className={'navitem '+(tab==='settings'?'active':'')} onClick={()=>setTab('settings')}><Settings size={18}/><span>Settings</span></button><div className="profile"><div className="avatar">{(user.email||'U').slice(0,1).toUpperCase()}</div><div className="profileinfo"><b>{user.user_metadata?.full_name||'My account'}</b><small>{user.email}</small></div><button className="icononly" title="Sign out" onClick={signOut}><LogOut size={16}/></button></div></div>
  </aside>
  <main className="main"><header><button className="mobilebrand" onClick={()=>setTab('overview')}><span className="brandmark">M</span> MyRemote</button><div className="crumb">Workspace <span>/</span> {tab==='builder'?'APK Builder':tab==='wallpaper'?'Wallpaper Studio':tab==='history'?'Build History':tab==='settings'?'Settings':'Overview'}</div><div className="headactions"><span className="status"><i/> Signed in</span><button className="themebtn" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle theme">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icononly signoutmobile" onClick={signOut} title="Sign out"><LogOut size={17}/></button></div></header>
   <section className="content">
    {tab==='builder'?<><div className="pagehead"><div><div className="eyebrow">ANDROID APP GENERATOR</div><h1>APK Builder</h1><p>Turn your website into an Android app with a reusable template.</p></div><span className="pill">● Build workspace</span></div><div className="modebar"><button className={mode==='fast'?'chosen':''} onClick={()=>setMode('fast')}><b>Fast Build</b><small>Quick setup · Standard WebView</small></button><button className={mode==='advanced'?'chosen':''} onClick={()=>setMode('advanced')}><b>Advanced Build</b><small>More Android configuration</small></button></div>
      <form className="panel" onSubmit={saveProject}><div className="paneltitle"><div><h2>App configuration</h2><p>Save a project for the website you own or are authorized to package.</p></div><span className="step">STEP 01 / 03</span></div><label>Website URL</label><div className="urlbox"><Globe size={18}/><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourwebsite.com" required/></div><div className="two"><div><label>App name</label><input className="field" value={appName} onChange={e=>setAppName(e.target.value)} required/></div><div><label>Package name</label><input className="field" value={pkg} onChange={e=>setPkg(e.target.value)} required/></div></div>
       <label>App icon</label><div className="iconupload"><div className="appicon">{iconPreview?<img src={iconPreview} alt="App icon preview"/>:'M'}</div><div className="uploadcopy"><b>{iconFile?.name||'Custom app icon'}</b><small>PNG or JPEG · 512 × 512 px recommended</small></div><label className="uploadbtn"><Upload size={15}/> Choose icon<input type="file" accept="image/png,image/jpeg" hidden onChange={e=>{const f=e.target.files?.[0];if(f){setIconFile(f);setIconPreview(URL.createObjectURL(f));}}}/></label></div>
       <div className="permissionhead"><div><h3>Permissions</h3><p>Only selected, supported modules will be included.</p></div><span className="optional">OPTIONAL</span></div><div className="permissions">{permissions.map(({id,label,desc,Icon})=><button type="button" className={'permission '+(selected.includes(id)?'selected':'')} key={id} onClick={()=>toggle(id)}><span className="permicon"><Icon size={18}/></span><span className="permtext"><b>{label}</b><small>{desc}</small></span><span className="switch"><i/></span></button>)}</div>
       {mode==='advanced'&&<div className="advanced"><h3>Advanced settings</h3><div className="two"><div><label>Orientation</label><select className="field"><option>Auto</option><option>Portrait</option><option>Landscape</option></select></div><div><label>External links</label><select className="field"><option>Open in browser</option><option>Keep in app (trusted domains only)</option></select></div></div><p>More native modules and signing options will be added as they are implemented and tested.</p></div>}
       <button className="primary" type="submit" disabled={saving}>{saving?<LoaderCircle className="spin" size={17}/>:null}{saving?'Saving project…':'Save project details'} <ArrowRight size={17}/></button>{notice&&<div className="notice">{notice}</div>}
      </form><div className="footnote"><CheckCircle2 size={16}/> Project details and selected icon can now be saved to Supabase. APK generation is not connected yet.</div>
     </>:tab==='wallpaper'?<><div className="pagehead"><div><div className="eyebrow">CONNECTED ANDROID DEVICE</div><h1>Wallpaper Studio</h1><p>Choose and apply wallpaper to a phone connected to your account.</p></div><span className="pill">● Companion app required</span></div><div className="panel empty"><div className="emptyicon"><Image size={30}/></div><h2>No connected device yet</h2><p>Install the MyRemote Android companion app and approve the connection. Wallpaper changes will require your confirmation on the phone.</p></div></>:tab==='history'?<><div className="pagehead"><div><div className="eyebrow">YOUR BUILDS</div><h1>Build History</h1><p>Your generated APK records will appear here.</p></div></div><div className="panel empty"><History size={32}/><h2>No builds yet</h2><p>APK build history will appear after the Android build backend is connected.</p></div></>:tab==='settings'?<><div className="pagehead"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p>Customize your MyRemote workspace.</p></div></div><div className="panel"><h2>Appearance</h2><p>Choose how MyRemote looks on this device.</p><div className="modebar"><button className={theme==='dark'?'chosen':''} onClick={()=>setTheme('dark')}><b>Dark theme</b><small>Black and orange</small></button><button className={theme==='light'?'chosen':''} onClick={()=>setTheme('light')}><b>Light theme</b><small>Light surfaces and orange</small></button></div><button className="secondary" onClick={signOut}><LogOut size={16}/> Sign out</button></div></>:<><div className="pagehead"><div><div className="eyebrow">WELCOME TO MYREMOTE</div><h1>Your workspace</h1><p>Build Android apps from websites and manage wallpaper on connected devices.</p></div></div><div className="dashcards"><button className="dashcard" onClick={()=>setTab('builder')}><Smartphone/><h2>APK Builder</h2><p>Create an Android app from your website URL.</p><b>Open builder →</b></button><button className="dashcard" onClick={()=>setTab('wallpaper')}><Image/><h2>Wallpaper Studio</h2><p>Manage wallpaper on your connected Android phone.</p><b>Open studio →</b></button></div></>}
   </section></main></div>
}
createRoot(document.getElementById('root')).render(<App/>);
