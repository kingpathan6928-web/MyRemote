import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard, Smartphone, Image, History, Settings, Sun, Moon, Globe, Camera, Mic, MapPin, Bell, FolderOpen, Upload, ArrowRight, CheckCircle2, Menu, X} from 'lucide-react';
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
 const [tab,setTab]=useState('builder'), [theme,setTheme]=useState('dark'), [mode,setMode]=useState('fast');
 const [url,setUrl]=useState(''), [appName,setAppName]=useState('My Website'), [pkg,setPkg]=useState('com.example.mywebsite');
 const [selected,setSelected]=useState([]), [notice,setNotice]=useState('');
 const [iconName,setIconName]=useState('M');
 const toggle=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const submit=(e)=>{e.preventDefault(); if(!/^https:\/\//i.test(url)){setNotice('Please enter a valid HTTPS website URL.');return;} setNotice('Frontend demo: builder form is ready. APK generation will work after backend + Android build pipeline are connected.');};
 return <div className={theme==='dark'?'app dark':'app light'}>
  <aside className="sidebar">
   <div className="brand"><div className="brandmark">M</div><div><b>MyRemote</b><small>WEB TO APK STUDIO</small></div></div>
   <div className="navlabel">WORKSPACE</div>
   {[['overview','Overview',LayoutDashboard],['builder','APK Builder',Smartphone],['wallpaper','Wallpaper Studio',Image],['history','Build History',History]].map(([id,label,Icon])=><button key={id} className={'navitem '+(tab===id?'active':'')} onClick={()=>{setTab(id);setNotice('')}}><Icon size={18}/><span>{label}</span>{id==='builder'&&<i/>}</button>)}
   <div className="sidebarbottom"><button className="navitem" onClick={()=>setTab('settings')}><Settings size={18}/><span>Settings</span></button><div className="profile"><div className="avatar">U</div><div><b>Your workspace</b><small>Personal account</small></div></div></div>
  </aside>
  <main className="main">
   <header><button className="mobilebrand" onClick={()=>setTab('overview')}><span className="brandmark">M</span> MyRemote</button><div className="crumb">Workspace <span>/</span> {tab==='builder'?'APK Builder':tab==='wallpaper'?'Wallpaper Studio':tab==='history'?'Build History':tab==='settings'?'Settings':'Overview'}</div><div className="headactions"><span className="status"><i/> All systems ready</span><button className="themebtn" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle theme">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button></div></header>
   <section className="content">
    {tab==='builder'?<><div className="pagehead"><div><div className="eyebrow">ANDROID APP GENERATOR</div><h1>APK Builder</h1><p>Turn your website into an Android app with a reusable template.</p></div><span className="pill">● Build workspace</span></div>
      <div className="modebar"><button className={mode==='fast'?'chosen':''} onClick={()=>setMode('fast')}><b>Fast Build</b><small>Quick setup · Standard WebView</small></button><button className={mode==='advanced'?'chosen':''} onClick={()=>setMode('advanced')}><b>Advanced Build</b><small>More Android configuration</small></button></div>
      <form className="panel" onSubmit={submit}><div className="paneltitle"><div><h2>App configuration</h2><p>Start with the website you own or are authorized to package.</p></div><span className="step">STEP 01 / 03</span></div>
       <label>Website URL</label><div className="urlbox"><Globe size={18}/><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourwebsite.com"/></div>
       <div className="two"><div><label>App name</label><input className="field" value={appName} onChange={e=>setAppName(e.target.value)}/></div><div><label>Package name</label><input className="field" value={pkg} onChange={e=>setPkg(e.target.value)}/></div></div>
       <label>App icon</label><div className="iconupload"><div className="appicon">{iconName}</div><div className="uploadcopy"><b>Custom app icon</b><small>PNG recommended · 512 × 512 px</small></div><label className="uploadbtn"><Upload size={15}/> Choose icon<input type="file" accept="image/png,image/jpeg" hidden onChange={e=>{if(e.target.files?.[0])setIconName(e.target.files[0].name.slice(0,1).toUpperCase())}}/></label></div>
       <div className="permissionhead"><div><h3>Permissions</h3><p>Only selected, supported modules will be included.</p></div><span className="optional">OPTIONAL</span></div>
       <div className="permissions">{permissions.map(({id,label,desc,Icon})=><button type="button" className={'permission '+(selected.includes(id)?'selected':'')} key={id} onClick={()=>toggle(id)}><span className="permicon"><Icon size={18}/></span><span className="permtext"><b>{label}</b><small>{desc}</small></span><span className="switch"><i/></span></button>)}</div>
       {mode==='advanced'&&<div className="advanced"><h3>Advanced settings</h3><div className="two"><div><label>Orientation</label><select className="field"><option>Auto</option><option>Portrait</option><option>Landscape</option></select></div><div><label>External links</label><select className="field"><option>Open in browser</option><option>Keep in app (trusted domains only)</option></select></div></div><p>More native modules and signing options will be added as they are implemented and tested.</p></div>}
       <button className="primary" type="submit">Continue to build settings <ArrowRight size={17}/></button>
       {notice&&<div className="notice">{notice}</div>}
      </form>
      <div className="footnote"><CheckCircle2 size={16}/> APK generation is not connected yet. This is the first frontend milestone.</div>
     </>:tab==='wallpaper'?<><div className="pagehead"><div><div className="eyebrow">CONNECTED ANDROID DEVICE</div><h1>Wallpaper Studio</h1><p>Choose and apply wallpaper to a phone connected to your account.</p></div><span className="pill">● Companion app required</span></div><div className="panel empty"><div className="emptyicon"><Image size={30}/></div><h2>No connected device yet</h2><p>Install the MyRemote Android companion app and approve the connection. Wallpaper changes will require your confirmation on the phone.</p><button className="primary" onClick={()=>setNotice('Device pairing will be added in a later milestone.')}>Connect a device <ArrowRight size={17}/></button>{notice&&<div className="notice">{notice}</div>}</div></>:tab==='history'?<><div className="pagehead"><div><div className="eyebrow">YOUR BUILDS</div><h1>Build History</h1><p>Your generated APK records will appear here.</p></div></div><div className="panel empty"><History size={32}/><h2>No builds yet</h2><p>Your APK build history will show here after the backend is connected.</p></div></>:tab==='settings'?<><div className="pagehead"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p>Customize your MyRemote workspace.</p></div></div><div className="panel"><h2>Appearance</h2><p>Choose how MyRemote looks on this device.</p><div className="modebar"><button className={theme==='dark'?'chosen':''} onClick={()=>setTheme('dark')}><b>Dark theme</b><small>Black and orange</small></button><button className={theme==='light'?'chosen':''} onClick={()=>setTheme('light')}><b>Light theme</b><small>Light surfaces and orange</small></button></div></div></>:<><div className="pagehead"><div><div className="eyebrow">WELCOME TO MYREMOTE</div><h1>Your workspace</h1><p>Build Android apps from websites and manage wallpaper on connected devices.</p></div></div><div className="dashcards"><button className="dashcard" onClick={()=>setTab('builder')}><Smartphone/><h2>APK Builder</h2><p>Create an Android app from your website URL.</p><b>Open builder →</b></button><button className="dashcard" onClick={()=>setTab('wallpaper')}><Image/><h2>Wallpaper Studio</h2><p>Manage wallpaper on your connected Android phone.</p><b>Open studio →</b></button></div></>}
   </section>
  </main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
