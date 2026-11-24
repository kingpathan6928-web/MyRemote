import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Smartphone, Image, History, Settings, Sun, Moon,
  Globe, Camera, Mic, MapPin, Bell, FolderOpen, Upload, ArrowRight,
  CheckCircle2, LogOut, Mail, Lock, User, LoaderCircle
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
  const [iconZoom, setIconZoom] = useState(1);
  const [iconRotation, setIconRotation] = useState(0);
  const [iconOffset, setIconOffset] = useState({ x: 0, y: 0 });
  const [iconBg, setIconBg] = useState('transparent');
  const [saving, setSaving] = useState(false);

  const cropRef = useRef(null);
  const dragRef = useRef(null);

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

  const resetIconEditor = () => {
    setIconZoom(1);
    setIconRotation(0);
    setIconOffset({ x: 0, y: 0 });
    setIconBg('transparent');
  };

  const chooseIcon = (file) => {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showNotice('Please choose a PNG, JPEG, or WebP image.', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setIconPreview(String(reader.result));
      setIconFile(file);
      resetIconEditor();
    };

    reader.onerror = () => {
      showNotice('Could not read this image. Please try another.', 'error');
    };

    reader.readAsDataURL(file);
  };

  const startIconDrag = (e) => {
    if (!iconPreview) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: iconOffset.x,
      oy: iconOffset.y
    };
  };

  const moveIconDrag = (e) => {
    if (!dragRef.current || !cropRef.current) return;

    const rect = cropRef.current.getBoundingClientRect();
    const factor = 220 / Math.min(rect.width, rect.height);

    setIconOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x) * factor,
      y: dragRef.current.oy + (e.clientY - dragRef.current.y) * factor
    });
  };

  const stopIconDrag = () => {
    dragRef.current = null;
  };

  const makeEditedIcon = async () => {
    if (!iconPreview) return null;

    const img = new window.Image();
    img.src = iconPreview;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Could not process the selected icon.'));
    });

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Your browser could not prepare the icon.');
    }

    if (iconBg !== 'transparent') {
      ctx.fillStyle = iconBg;
      ctx.fillRect(0, 0, size, size);
    }

    const base = Math.max(size / img.width, size / img.height);

    ctx.translate(
      size / 2 + iconOffset.x * (size / 220),
      size / 2 + iconOffset.y * (size / 220)
    );

    ctx.rotate((iconRotation * Math.PI) / 180);
    ctx.scale(base * iconZoom, base * iconZoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) {
      throw new Error('Could not export the edited icon.');
    }

    return new File([blob], 'myremote-icon.png', {
      type: 'image/png'
    });
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

    setSaving(true);

    try {
      let iconUrl = null;
      const uploadIcon = iconPreview ? await makeEditedIcon() : null;

      if (uploadIcon) {
        const path = `${user.id}/${Date.now()}-myremote-icon.png`;

        const { error: uploadError } = await supabase.storage
          .from('app-assets')
          .upload(path, uploadIcon, {
            upsert: false,
            contentType: 'image/png'
          });

        if (uploadError) throw uploadError;
        iconUrl = path;
      }

      const { error: saveError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          app_name: appName.trim(),
          package_name: pkg.trim(),
          website_url: website.href,
          icon_url: iconUrl
        });

      if (saveError) throw saveError;

      showNotice('Your app setup has been saved. Preparing your APK build…');

      const { data, error: buildError } = await supabase.functions.invoke(
        'build-apk',
        {
          body: {
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

      showNotice(
        'Your app setup has been submitted successfully. Your APK build request is in the queue.',
        'success'
      );
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
            {authMode === 'signup' ? 'Already have an account?' : 'New to MyRemote?'}{' '}
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

                <label>App icon editor</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
                  gap: 18,
                  alignItems: 'center',
                  padding: 14,
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  background: 'var(--bg)'
                }}>
                  <div
                    ref={cropRef}
                    onPointerDown={startIconDrag}
                    onPointerMove={moveIconDrag}
                    onPointerUp={stopIconDrag}
                    onPointerCancel={stopIconDrag}
                    onLostPointerCapture={stopIconDrag}
                    style={{
                      width: '100%',
                      maxWidth: 220,
                      aspectRatio: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 14,
                      border: '1px solid var(--line)',
                      background: iconBg,
                      touchAction: 'none',
                      cursor: 'grab',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    {iconPreview ? (
                      <img
                        src={iconPreview}
                        alt="App icon crop preview"
                        draggable="false"
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          transform: `translate(${iconOffset.x}px, ${iconOffset.y}px) scale(${iconZoom}) rotate(${iconRotation}deg)`
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 64, fontWeight: 800, color: 'var(--orange)' }}>M</span>
                    )}
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      border: '1px solid #ff9d4e',
                      pointerEvents: 'none'
                    }} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="uploadcopy" style={{ flex: 1 }}>
                        <b>{iconFile?.name || 'Choose an app icon'}</b>
                        <small>PNG, JPEG or WebP · Final output 512 × 512 PNG</small>
                      </div>
                      <label className="uploadbtn">
                        <Upload size={15} /> Choose icon
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          hidden
                          onChange={(e) => {
                            chooseIcon(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    <label htmlFor="icon-zoom" style={{ display: 'block', marginTop: 16 }}>
                      Zoom · {iconZoom.toFixed(1)}×
                    </label>
                    <input
                      id="icon-zoom"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={iconZoom}
                      onChange={(e) => setIconZoom(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--orange)' }}
                    />

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setIconRotation((v) => (v + 90) % 360)}
                      >
                        ↻ Rotate 90°
                      </button>
                      <button type="button" className="secondary" onClick={resetIconEditor}>
                        Reset
                      </button>
                    </div>

                    <label style={{ display: 'block', marginTop: 15 }}>Background</label>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                      {['transparent', '#ffffff', '#000000', '#ff8b38'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          aria-label={`Set icon background ${color}`}
                          onClick={() => setIconBg(color)}
                          style={{
                            width: 29,
                            height: 29,
                            borderRadius: '50%',
                            border: iconBg === color ? '3px solid var(--orange)' : '1px solid var(--line)',
                            background: color === 'transparent'
                              ? 'repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) 50% / 12px 12px'
                              : color
                          }}
                        />
                      ))}
                    </div>

                    <small style={{ display: 'block', marginTop: 12, color: 'var(--muted)' }}>
                      Drag the image inside the square to adjust its position.
                    </small>
                  </div>
                </div>

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
              <div className="panel empty">
                <History size={32} />
                <h2>No builds yet</h2>
                <p>Your build records will appear here when build history is connected.</p>
              </div>
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
