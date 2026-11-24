
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Smartphone, Image, History, Settings, Sun, Moon,
  Globe, Camera, Mic, MapPin, Bell, FolderOpen, Upload, ArrowRight,
  CheckCircle2, LogOut, Mail, Lock, User, LoaderCircle, Download, RefreshCw
} from 'lucide-react';
import { supabase } from './supabase';
import './style.css';

const permissions = [
  { id: 'camera', label: 'Camera', desc: 'Camera access for video features', Icon: Camera },
  { id: 'microphone', label: 'Microphone', desc: 'Audio and video call support', Icon: Mic },
  { id: 'files', label: 'File picker', desc: 'Choose files from your phone', Icon: FolderOpen },
  { id: 'gallery', label: 'Photos & videos', desc: 'Select photos and videos', Icon: Image },
  { id: 'location', label: 'Location', desc: 'Location features with user consent', Icon: MapPin },
  { id: 'notifications', label: 'Notifications', desc: 'App notifications where supported', Icon: Bell }
];

// SVG ko restricted shapes aur attributes tak limit karte hain.
const sanitizeSvg = (source) => {
  if (!source || source.length > 100000) {
    throw new Error('SVG code 100 KB se chhota hona chahiye.');
  }

  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = doc.documentElement;

  if (doc.querySelector('parsererror') || root.localName !== 'svg') {
    throw new Error('Valid SVG code paste karein.');
  }

  const tags = new Set([
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse',
    'line', 'polyline', 'polygon'
  ]);

  const attrs = new Set([
    'xmlns', 'viewBox', 'width', 'height', 'fill',
    'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'opacity', 'fill-opacity',
    'stroke-opacity', 'transform', 'd', 'x', 'y',
    'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r',
    'rx', 'ry', 'points'
  ]);

  const clean = (node) => {
    [...node.children].forEach((child) => {
      if (!tags.has(child.localName)) {
        child.remove();
        return;
      }

      [...child.attributes].forEach((attr) => {
        const name = attr.name;
        const value = attr.value.trim();

        if (
          !attrs.has(name) ||
          /^on/i.test(name) ||
          /url\s*\(|javascript:|https?:|data:/i.test(value)
        ) {
          child.removeAttribute(name);
        }
      });

      clean(child);
    });
  };

  clean(root);
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  if (!root.getAttribute('viewBox')) {
    const w = Number(root.getAttribute('width')) || 512;
    const h = Number(root.getAttribute('height')) || 512;
    root.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  return new XMLSerializer().serializeToString(root);
};

const svgToPng = async (source) => {
  const safeSvg = sanitizeSvg(source);
  const blob = new Blob([safeSvg], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = new window.Image();
    img.src = objectUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('SVG preview nahi ban paya. Code check karein.'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const scale = Math.min(512 / img.width, 512 / img.height);
    const width = img.width * scale;
    const height = img.height * scale;

    ctx.drawImage(
      img,
      (512 - width) / 2,
      (512 - height) / 2,
      width,
      height
    );

    return await new Promise((resolve, reject) => {
      canvas.toBlob((png) => {
        if (png) resolve(png);
        else reject(new Error('SVG ko PNG mein convert nahi kar paye.'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [authMode, setAuthMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [tab, setTab] = useState('builder');
  const [theme, setTheme] = useState('dark');
  const [mode, setMode] = useState('fast');

  const [url, setUrl] = useState('');
  const [appName, setAppName] = useState('My Website');
  const [pkg, setPkg] = useState('com.example.mywebsite');

  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');

  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [iconSvg, setIconSvg] = useState('');
  const [saving, setSaving] = useState(false);
  const [builds, setBuilds] = useState([]);
  const [activeBuildId, setActiveBuildId] = useState(null);
  const [downloadBusy, setDownloadBusy] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadBuilds = async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.from('builds').select('id,project_id,status,progress,apk_url,storage_path,error_message,created_at,started_at,completed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (!error) setBuilds(data || []);
  };

  useEffect(() => { if (user) loadBuilds(); else setBuilds([]); }, [user, tab]);

  useEffect(() => {
    if (!user || !builds.some((build) => ['queued', 'building', 'uploading'].includes(build.status))) return undefined;
    const timer = window.setInterval(loadBuilds, 4000);
    return () => window.clearInterval(timer);
  }, [user, builds]);

  const downloadApk = async (build) => {
    if (!supabase || !build.storage_path || build.status !== 'completed') return;
    setDownloadBusy(build.id);
    try {
      const { data, error } = await supabase.storage.from('apk-builds').createSignedUrl(build.storage_path, 300);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Download link was not created.');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) { showNotice(`Download failed: ${err.message || 'Please try again.'}`, 'error'); }
    finally { setDownloadBusy(null); }
  };

  const showNotice = (message, type = 'info') => {
    setNotice(message);
    setNoticeType(type);
  };

  const toggle = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const authSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage('');

    if (!supabase) {
      setAuthMessage('Account service is temporarily unavailable.');
      return;
    }

    setAuthBusy(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        setAuthMessage(
          data.session
            ? 'Your account has been created successfully.'
            : 'Account created. Please check your email to confirm your address.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        setAuthMessage('Welcome back! You are signed in.');
      }
    } catch (err) {
      setAuthMessage(err.message || 'Unable to complete your request.');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setNotice('');
  };

  const saveProject = async (e) => {
    e.preventDefault();
    setNotice('');

    if (!supabase || !user) {
      showNotice('Please sign in to continue.', 'error');
      return;
    }

    let website;

    try {
      website = new URL(url.trim());

      if (
        website.protocol !== 'https:' ||
        !website.hostname.includes('.') ||
        website.username ||
        website.password
      ) {
        throw new Error('Invalid website URL');
      }
    } catch {
      showNotice('Please enter a valid HTTPS website URL.', 'error');
      return;
    }

    if (!appName.trim() || appName.trim().length > 50) {
      showNotice('App name must be between 1 and 50 characters.', 'error');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(pkg.trim())) {
      showNotice('Please enter a valid package name, such as com.example.myapp.', 'error');
      return;
    }

    if (iconFile && !['image/png', 'image/jpeg'].includes(iconFile.type)) {
      showNotice('Please choose a PNG or JPEG icon.', 'error');
      return;
    }

    if (iconFile && iconFile.size > 5 * 1024 * 1024) {
      showNotice('Icon size must be less than 5 MB.', 'error');
      return;
    }

    if (iconSvg.trim()) {
      try {
        sanitizeSvg(iconSvg);
      } catch (err) {
        showNotice(err.message, 'error');
        return;
      }
    }

    setSaving(true);

    try {
      let iconUrl = null;
      let uploadIcon = iconFile;

      if (iconSvg.trim()) {
        uploadIcon = await svgToPng(iconSvg);
      }

      if (uploadIcon) {
        const safeName = iconFile
          ? iconFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
          : 'custom-svg-icon.png';

        const path = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('app-assets')
          .upload(path, uploadIcon, {
            upsert: false,
            contentType: iconSvg.trim() ? 'image/png' : iconFile.type
          });

        if (uploadError) throw uploadError;
        iconUrl = path;
      }

      const { data: project, error: saveError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          app_name: appName.trim(),
          package_name: pkg.trim(),
          website_url: website.href,
          icon_url: iconUrl
        }).select('id').single();

      if (saveError) throw saveError;
      const { data: build, error: createBuildError } = await supabase.from('builds').insert({ user_id: user.id, project_id: project.id, status: 'queued', progress: 5 }).select('id').single();
      if (createBuildError) throw createBuildError;
      setActiveBuildId(build.id);
      await loadBuilds();
      showNotice('Your app setup is saved. APK build is queued and live progress will appear below.');

      const { data, error: buildError } = await supabase.functions.invoke(
        'build-apk',
        {
          body: {
            build_id: build.id,
            app_name: appName.trim(),
            application_id: pkg.trim(),
            start_url: website.href,
            icon_path: iconUrl || ''
          }
        }
      );

      if (buildError) throw buildError;

      if (!data?.success) {
        throw new Error(data?.error || 'Unable to start the build.');
      }

      await loadBuilds();
      showNotice('Build request sent. Track the genuine workflow progress in Build History.', 'success');
    } catch (err) {
      showNotice(
        `We couldn't complete your request: ${err.message || 'Please try again.'}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="authscreen">
        <div className="authcard">Loading MyRemote…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authscreen">
        <form className="authcard" onSubmit={authSubmit}>
          <div className="brand authbrand">
            <div className="brandmark">M</div>
            <div>
              <b>MyRemote</b>
              <small>WEB TO APK STUDIO</small>
            </div>
          </div>

          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p className="authhint">
            {authMode === 'signup'
              ? 'Create an account to get started with MyRemote.'
              : 'Sign in to continue to MyRemote.'}
          </p>

          {authMode === 'signup' && (
            <>
              <label>Full name</label>
              <div className="authinput">
                <User size={17} />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </>
          )}

          <label>Email address</label>
          <div className="authinput">
            <Mail size={17} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <label>Password</label>
          <div className="authinput">
            <Lock size={17} />
            <input
              type="password"
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <button className="primary" disabled={authBusy}>
            {authBusy && <LoaderCircle className="spin" size={17} />}
            {authMode === 'signup' ? 'Create account' : 'Sign in'}
            <ArrowRight size={17} />
          </button>

          {authMessage && <div className="notice">{authMessage}</div>}

          <p className="authswitch">
            {authMode === 'signup' ? 'Already have an account?' : 'New to MyRemote?'}
            {' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                setAuthMessage('');
              }}
            >
              {authMode === 'signup' ? 'Sign in' : 'Create account'}
            </button>
          </p>

          <small className="authfoot">
            Check your inbox for account confirmation if requested.
          </small>
        </form>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'app dark' : 'app light'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandmark">M</div>
          <div>
            <b>MyRemote</b>
            <small>WEB TO APK STUDIO</small>
          </div>
        </div>

        <div className="navlabel">WORKSPACE</div>

        {[
          ['overview', 'Overview', LayoutDashboard],
          ['builder', 'APK Builder', Smartphone],
          ['wallpaper', 'Wallpaper Studio', Image],
          ['history', 'Build History', History]
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            className={'navitem ' + (tab === id ? 'active' : '')}
            onClick={() => {
              setTab(id);
              setNotice('');
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === 'builder' && <i />}
          </button>
        ))}

        <div className="sidebarbottom">
          <button
            className={'navitem ' + (tab === 'settings' ? 'active' : '')}
            onClick={() => setTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">
              {(user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="profileinfo">
              <b>{user.user_metadata?.full_name || 'My account'}</b>
              <small>{user.email}</small>
            </div>
            <button className="icononly" title="Sign out" onClick={signOut}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="mobilebrand" onClick={() => setTab('overview')}>
            <span className="brandmark">M</span> MyRemote
          </button>

          <div className="crumb">
            Workspace <span>/</span>{' '}
            {tab === 'builder' ? 'APK Builder'
              : tab === 'wallpaper' ? 'Wallpaper Studio'
              : tab === 'history' ? 'Build History'
              : tab === 'settings' ? 'Settings'
              : 'Overview'}
          </div>

          <div className="headactions">
            <span className="status"><i /> Signed in</span>
            <button
              className="themebtn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icononly signoutmobile" onClick={signOut} title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <section className="content">
          {tab === 'builder' ? (
            <>
              <div className="pagehead">
                <div>
                  <div className="eyebrow">ANDROID APP GENERATOR</div>
                  <h1>APK Builder</h1>
                  <p>Turn your website into an Android app with a reusable template.</p>
                </div>
                <span className="pill">● Build workspace</span>
              </div>

              <div className="modebar">
                <button
                  type="button"
                  className={mode === 'fast' ? 'chosen' : ''}
                  onClick={() => setMode('fast')}
                >
                  <b>Fast Build</b>
                  <small>Quick setup · Standard WebView</small>
                </button>
                <button
                  type="button"
                  className={mode === 'advanced' ? 'chosen' : ''}
                  onClick={() => setMode('advanced')}
                >
                  <b>Advanced Build</b>
                  <small>More Android configuration</small>
                </button>
              </div>

              <form className="panel" onSubmit={saveProject}>
                <div className="paneltitle">
                  <div>
                    <h2>App configuration</h2>
                    <p>Enter the details for your new Android app.</p>
                  </div>
                  <span className="step">STEP 01 / 03</span>
                </div>

                <label>Website URL</label>
                <div className="urlbox">
                  <Globe size={18} />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    required
                  />
                </div>

                <div className="two">
                  <div>
                    <label>App name</label>
                    <input
                      className="field"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>Package name</label>
                    <input
                      className="field"
                      value={pkg}
                      onChange={(e) => setPkg(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <label>App icon</label>
                <div className="iconupload">
                  <div className="appicon">
                    {iconPreview
                      ? <img src={iconPreview} alt="App icon preview" />
                      : 'M'}
                  </div>
                  <div className="uploadcopy">
                    <b>{iconSvg.trim() ? 'SVG code icon' : (iconFile?.name || 'Custom app icon')}</b>
                    <small>PNG or JPEG · 512 × 512 px recommended</small>
                  </div>
                  <label className="uploadbtn">
                    <Upload size={15} /> Choose icon
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIconFile(file);
                          setIconSvg('');
                          setIconPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>

                <label htmlFor="svg-icon-code">Or paste SVG code</label>
                <textarea
                  id="svg-icon-code"
                  className="field"
                  rows={3}
                  value={iconSvg}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIconSvg(value);

                    if (value.trim()) {
                      setIconFile(null);
                      try {
                        const safe = sanitizeSvg(value);
                        setIconPreview(
                          'data:image/svg+xml;charset=utf-8,' +
                          encodeURIComponent(safe)
                        );
                      } catch {
                        setIconPreview('');
                      }
                    } else {
                      setIconPreview('');
                    }
                  }}
                  placeholder="<svg viewBox=&quot;0 0 512 512&quot;>...</svg>"
                  aria-label="Paste SVG icon code"
                />
                <small className="authfoot">
                  SVG paste karte hi preview dikhega. Safe SVG shapes supported hain.
                </small>

                <div className="permissionhead">
                  <div>
                    <h3>Permissions</h3>
                    <p>Choose the features you may need.</p>
                  </div>
                  <span className="optional">OPTIONAL</span>
                </div>

                <div className="permissions">
                  {permissions.map(({ id, label, desc, Icon }) => (
                    <button
                      type="button"
                      className={'permission ' + (selected.includes(id) ? 'selected' : '')}
                      key={id}
                      onClick={() => toggle(id)}
                    >
                      <span className="permicon"><Icon size={18} /></span>
                      <span className="permtext">
                        <b>{label}</b>
                        <small>{desc}</small>
                      </span>
                      <span className="switch"><i /></span>
                    </button>
                  ))}
                </div>

                {mode === 'advanced' && (
                  <div className="advanced">
                    <h3>Advanced settings</h3>
                    <div className="two">
                      <div>
                        <label>Orientation</label>
                        <select className="field" defaultValue="Auto">
                          <option>Auto</option>
                          <option>Portrait</option>
                          <option>Landscape</option>
                        </select>
                      </div>
                      <div>
                        <label>External links</label>
                        <select className="field" defaultValue="Open in browser">
                          <option>Open in browser</option>
                          <option>Keep in app (trusted domains only)</option>
                        </select>
                      </div>
                    </div>
                    <p>Additional configuration options will be available as they are implemented.</p>
                  </div>
                )}

                <button className="primary" type="submit" disabled={saving}>
                  {saving && <LoaderCircle className="spin" size={17} />}
                  {saving ? 'Submitting your app…' : 'Create Android App'}
                  <ArrowRight size={17} />
                </button>

                {notice && (
                  <div className="notice" role="status">
                    {notice}
                  </div>
                )}
              </form>

              <div className="footnote">
                <CheckCircle2 size={16} />
                Create an Android app from a website you own or are authorized to use.
              </div>
            </>
          ) : tab === 'wallpaper' ? (
            <>
              <div className="pagehead">
                <div>
                  <div className="eyebrow">CONNECTED ANDROID DEVICE</div>
                  <h1>Wallpaper Studio</h1>
                  <p>Choose and apply wallpaper to a phone connected to your account.</p>
                </div>
                <span className="pill">● Companion app required</span>
              </div>
              <div className="panel empty">
                <div className="emptyicon"><Image size={30} /></div>
                <h2>No connected device yet</h2>
                <p>Install the MyRemote Android companion app and approve the connection. Wallpaper changes will require your confirmation on the phone.</p>
              </div>
            </>
          ) : tab === 'history' ? (
            <>
              <div className="pagehead">
                <div>
                  <div className="eyebrow">YOUR BUILDS</div>
                  <h1>Build History</h1>
                  <p>Your generated APK records will appear here.</p>
                </div>
              </div>
              {builds.length === 0 ? <div className="panel empty"><History size={32} /><h2>No builds yet</h2><p>Your build records will appear here after you submit an APK.</p></div> : <div className="buildlist">{builds.map((build) => { const status = build.status || 'queued'; const label = status === 'completed' ? 'Ready to download' : status === 'failed' ? 'Build failed' : status === 'uploading' ? 'Uploading APK' : status === 'building' ? 'Building APK' : 'Queued'; return <article className="buildcard" key={build.id}><div className="buildtop"><div><b>{build.project_id ? 'Android APK build' : 'APK build'}</b><small>{new Date(build.created_at).toLocaleString()}</small></div><span className={`buildstatus ${status}`}>{label}</span></div><div className="progressrow"><div className="progressbar"><i style={{ width: `${Math.max(0, Math.min(100, build.progress || 0))}%` }} /></div><strong>{build.progress || 0}%</strong></div>{build.error_message && <p className="builderror">{build.error_message}</p>}{status === 'completed' && build.storage_path && <button className="downloadbtn" onClick={() => downloadApk(build)} disabled={downloadBusy === build.id}>{downloadBusy === build.id ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />} Download private APK</button>}</article>; })}</div>}
            </>
          ) : tab === 'settings' ? (
            <>
              <div className="pagehead">
                <div>
                  <div className="eyebrow">PREFERENCES</div>
                  <h1>Settings</h1>
                  <p>Customize your MyRemote workspace.</p>
                </div>
              </div>
              <div className="panel">
                <h2>Appearance</h2>
                <p>Choose how MyRemote looks on this device.</p>
                <div className="modebar">
                  <button
                    type="button"
                    className={theme === 'dark' ? 'chosen' : ''}
                    onClick={() => setTheme('dark')}
                  >
                    <b>Dark theme</b>
                    <small>Black and orange</small>
                  </button>
                  <button
                    type="button"
                    className={theme === 'light' ? 'chosen' : ''}
                    onClick={() => setTheme('light')}
                  >
                    <b>Light theme</b>
                    <small>Light surfaces and orange</small>
                  </button>
                </div>
                <button className="secondary" onClick={signOut}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="pagehead">
                <div>
                  <div className="eyebrow">WELCOME TO MYREMOTE</div>
                  <h1>Your workspace</h1>
                  <p>Build Android apps from websites and manage wallpaper on connected devices.</p>
                </div>
              </div>
              <div className="dashcards">
                <button className="dashcard" onClick={() => setTab('builder')}>
                  <Smartphone />
                  <h2>APK Builder</h2>
                  <p>Create an Android app from your website URL.</p>
                  <b>Open builder →</b>
                </button>
                <button className="dashcard" onClick={() => setTab('wallpaper')}>
                  <Image />
                  <h2>Wallpaper Studio</h2>
                  <p>Manage wallpaper on your connected Android phone.</p>
                  <b>Open studio →</b>
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
