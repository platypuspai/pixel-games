(() => {
'use strict';
if (window.__plixoMusicLoaded) return;
window.__plixoMusicLoaded = true;
const script = document.currentScript || Array.from(document.scripts).reverse().find(s => /plixo-music\.js/.test(s.src));
const gameId = script && script.dataset.gameId || '';
const isHome = !!(script && script.dataset.page === 'home');
const KEY = 'plixo_music_settings_v1';
const CFG = {apiKey:'AIzaSySyA9wKFVXmT6kUpuaBgwlPilF86LaKKDYFU',authDomain:'money-digger-9b05e.firebaseapp.com',databaseURL:'https://money-digger-9b05e-default-rtdb.europe-west1.firebasedatabase.app'};
const SONGS = {'creative-fire':{title:'Creative Fire',src:'creative-fire.mp3'},'fallen-tech':{title:'Fallen Tech',src:'fallen-tech.mp3'}};
const GAMES = [['home','Homepage'],['dvd_plus','DVD+'],['dino_world','Dino World'],['mini_browser_platformer','Mini Browser Platformer'],['mini_spikes_platformer','Mini Spikes Platformer'],['one_square','One Square'],['dodging_arena','Dodging Arena'],['bug_escape','Bug Escape'],['mini_apocalypse','Mini Apocalypse'],['money_digger','Money Digger'],['lucky_guy','Lucky Guy'],['time_ticker','Time Ticker'],['the_end','THE END']];
const TXT = {
en:{nav:'♪ MUSIC',title:'MUSIC SETTINGS',desc:'Choose your music and where it plays. Settings sync to your Plixo account when signed in.',enabled:'Music enabled',song:'Choose a song',games:'Play music on',saved:'Settings save automatically',cloud:'Synced to your Plixo account',local:'Saved on this device until you sign in',on:'Music: ON',off:'Music: OFF',tap:'Tap to start music',playing:'Now playing',home:'Homepage'},
nl:{nav:'♪ MUZIEK',title:'MUZIEKINSTELLINGEN',desc:'Kies je muziek en waar die speelt. Je instellingen worden gesynchroniseerd met je Plixo-account als je bent ingelogd.',enabled:'Muziek inschakelen',song:'Kies een nummer',games:'Muziek afspelen bij',saved:'Instellingen worden automatisch opgeslagen',cloud:'Gesynchroniseerd met je Plixo-account',local:'Op dit apparaat opgeslagen tot je inlogt',on:'Muziek: AAN',off:'Muziek: UIT',tap:'Tik om muziek te starten',playing:'Speelt nu',home:'Homepage'},
fr:{nav:'♪ MUSIQUE',title:'PARAMÈTRES MUSIQUE',desc:'Choisissez votre musique et les jeux où elle sera diffusée. Vos paramètres sont synchronisés avec votre compte Plixo lorsque vous êtes connecté.',enabled:'Activer la musique',song:'Choisir une chanson',games:'Jouer la musique dans',saved:'Les paramètres sont enregistrés automatiquement',cloud:'Synchronisé avec votre compte Plixo',local:'Enregistré sur cet appareil jusqu’à votre connexion',on:'Musique : ON',off:'Musique : OFF',tap:'Touchez pour démarrer la musique',playing:'Lecture en cours',home:'Page d’accueil'}
};
const tr = k => (TXT[localStorage.getItem('app_lang') || 'en'] || TXT.en)[k] || TXT.en[k] || k;
const defaults = () => ({enabled:false,song:'creative-fire',games:['home']});
const normalize = v => ({enabled:!!(v && v.enabled === true),song:v && SONGS[v.song] ? v.song : 'creative-fire',games:Array.isArray(v && v.games) ? Array.from(new Set(v.games.filter(x => GAMES.some(g => g[0] === x)))) : ['home']});
let settings = defaults(), db = null, accountCode = null, cloudReady = false, audio = null;
try { settings = normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch(e) {}
function code() {
 const values = ['pg_account_code','pg_player_id','plixo_sync_code'].map(k => String(localStorage.getItem(k) || '').trim().toUpperCase());
 return values.find(v => /^(?:[A-HJ-NP-Z2-9]{20}|[0-9]{20})$/.test(v)) || null;
}
function firebaseReady() {
 if (window.firebase && firebase.database) {
  if (!firebase.apps.length) firebase.initializeApp(CFG);
  db = firebase.database(); return Promise.resolve(db);
 }
 return new Promise(resolve => {
  const load = src => new Promise((ok,fail) => { const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=fail; document.head.appendChild(s); });
  load('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js').then(() => load('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js')).then(() => {
   if (!firebase.apps.length) firebase.initializeApp(CFG); db=firebase.database(); resolve(db);
  }).catch(() => resolve(null));
 });
}
function localSave() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch(e) {} }
function status() {
 const el=document.getElementById('plixo-music-status');
 if (el) el.textContent = code() && cloudReady ? tr('cloud') : tr('local');
}
async function sync() {
 const c=code(); if (!c || (c===accountCode && cloudReady)) return;
 accountCode=c; const d=await firebaseReady(); if (!d || accountCode!==c) return;
 try {
  const ref=d.ref('plixo_users/'+c+'/music_settings'); const snap=await ref.once('value');
  if (snap.exists()) { settings=normalize(snap.val()); localSave(); refresh(); }
  else await ref.set(settings);
  cloudReady=true; status();
 } catch(e) { console.warn('[Plixo music] Cloud sync unavailable',e); status(); }
}
function currentSong() { return SONGS[settings.song] || SONGS['creative-fire']; }
function audioEl() {
 if (!audio) { audio=document.createElement('audio'); audio.id='plixo-music-audio'; audio.loop=true; audio.preload='auto'; audio.volume=.35; audio.src=currentSong().src; document.body.appendChild(audio); }
 return audio;
}
function here() { return settings.games.includes(isHome ? 'home' : gameId); }
async function playback() {
 const a=audioEl(), song=currentSong();
 if (!a.src.endsWith(song.src)) { a.src=song.src; a.load(); }
 if (!settings.enabled || !here()) { a.pause(); playerRefresh(); return; }
 try { await a.play(); } catch(e) { playerRefresh(true); }
 playerRefresh();
}
function save() {
 settings=normalize(settings); localSave(); refresh();
 clearTimeout(save.timer);
 save.timer=setTimeout(async () => {
  const c=code(); if (!c) { status(); return; }
  const d=await firebaseReady(); if (!d) { status(); return; }
  try { await d.ref('plixo_users/'+c+'/music_settings').set(settings); accountCode=c; cloudReady=true; }
  catch(e) { console.warn('[Plixo music] Save failed',e); }
  status();
 },200);
 playback();
}
function playerRefresh(blocked) {
 const b=document.getElementById('plixo-music-toggle'), s=document.getElementById('plixo-music-player-status');
 if (!b || !s) return;
 const active=audio && !audio.paused;
 b.textContent=active?'Ⅱ':'▶';
 s.textContent=blocked ? tr('tap') : active ? tr('playing')+': '+currentSong().title : (settings.enabled && here() ? tr('tap') : tr('off'));
}
function player() {
 if (document.getElementById('plixo-music-player')) return;
 const wrap=document.createElement('div'); wrap.id='plixo-music-player';
 wrap.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:9px;padding:9px 12px;background:rgba(10,10,15,.94);border:1px solid #2a2a42;color:#e8e8ff;font:13px Inconsolata,monospace;box-shadow:0 4px 18px #0008;max-width:calc(100vw - 28px)';
 const b=document.createElement('button'); b.id='plixo-music-toggle'; b.textContent='▶'; b.style.cssText='background:#00ff88;color:#000;border:0;padding:7px 10px;font-weight:bold;cursor:pointer';
 const s=document.createElement('span'); s.id='plixo-music-player-status'; wrap.append(b,s); document.body.appendChild(wrap);
 b.addEventListener('click',async () => {
  if (audio && !audio.paused) { audio.pause(); playerRefresh(); return; }
  settings.enabled=true; const id=isHome?'home':gameId; if (!settings.games.includes(id)) settings.games.push(id); save();
  try { await audioEl().play(); } catch(e) { playerRefresh(true); }
 });
 playerRefresh();
}
function homePage() {
 const nav=document.getElementById('nav-leaderboard');
 if (nav && !document.getElementById('plixo-music-nav')) {
  const b=document.createElement('button'); b.id='plixo-music-nav'; b.className='nav-btn'; b.textContent=tr('nav');
  b.addEventListener('click',() => { if (typeof window.showPage==='function') window.showPage('music',b); else {
   document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');p.style.display='none';});
   const pg=document.getElementById('page-music'); if(pg){pg.classList.add('active');pg.style.display='block';}
   document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  } refresh(); });
  nav.parentElement.insertBefore(b,nav);
 }
 if (!document.getElementById('page-music')) {
  const p=document.createElement('section'); p.id='page-music'; p.className='page'; p.style.display='none';
  p.innerHTML='<div class="info-wrap" style="max-width:760px"><h2 id="plixo-music-title"></h2><div class="info-block" style="border-left-color:var(--accent-green)"><p id="plixo-music-desc"></p><div class="form-group" style="margin-top:22px"><label><input id="plixo-music-enabled" type="checkbox" style="width:auto;margin-right:9px"> <span id="plixo-music-enabled-label"></span></label></div><div class="form-group"><label id="plixo-music-song-label"></label><select id="plixo-music-song" style="width:100%;padding:10px;background:var(--surface);color:var(--text);border:1px solid var(--border)"><option value="creative-fire">Creative Fire</option><option value="fallen-tech">Fallen Tech</option></select></div><div class="form-group"><label id="plixo-music-games-label"></label><div id="plixo-music-games" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:12px"></div></div><p id="plixo-music-saved" style="font-size:.78rem;color:var(--text-muted);margin-top:14px"></p><p id="plixo-music-status" style="font-size:.78rem;color:var(--accent-green);margin-top:6px"></p></div></div>';
  const info=document.getElementById('page-info'); if(info&&info.parentElement) info.parentElement.insertBefore(p,info.nextSibling); else document.body.appendChild(p);
  p.querySelector('#plixo-music-enabled').addEventListener('change',e=>{settings.enabled=e.target.checked;save();});
  p.querySelector('#plixo-music-song').addEventListener('change',e=>{settings.song=e.target.value;save();});
 }
 refresh();
}
function refresh() {
 if (!isHome) { playerRefresh(); return; }
 const p=document.getElementById('page-music'); if(!p) return;
 const nav=document.getElementById('plixo-music-nav'); if(nav) nav.textContent=tr('nav');
 p.querySelector('#plixo-music-title').textContent=tr('title');
 p.querySelector('#plixo-music-desc').textContent=tr('desc');
 p.querySelector('#plixo-music-enabled-label').textContent=tr('enabled');
 p.querySelector('#plixo-music-song-label').textContent=tr('song');
 p.querySelector('#plixo-music-games-label').textContent=tr('games');
 p.querySelector('#plixo-music-saved').textContent=tr('saved');
 p.querySelector('#plixo-music-enabled').checked=settings.enabled;
 p.querySelector('#plixo-music-song').value=settings.song;
 const list=p.querySelector('#plixo-music-games'); list.innerHTML='';
 GAMES.forEach(pair=>{
  const label=document.createElement('label'); label.style.cssText='display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);padding:10px;color:var(--text);font-size:.82rem;cursor:pointer';
  const input=document.createElement('input'); input.type='checkbox'; input.checked=settings.games.includes(pair[0]); input.style.cssText='accent-color:var(--accent-green);width:auto';
  input.addEventListener('change',()=>{settings.games=input.checked?settings.games.concat(pair[0]):settings.games.filter(x=>x!==pair[0]);save();});
  const span=document.createElement('span'); span.textContent=pair[0]==='home'?tr('home'):pair[1]; label.append(input,span); list.appendChild(label);
 });
 status(); playerRefresh();
}
function init() {
 if (isHome) homePage(); else if (gameId) player();
 audioEl(); sync().then(playback); playback();
 window.addEventListener('storage',e=>{
  if(e.key===KEY){try{settings=normalize(JSON.parse(e.newValue||'null'));}catch(_){} refresh(); playback();}
  if(['pg_account_code','pg_player_id','plixo_sync_code'].includes(e.key)) sync();
 });
 const lang=document.getElementById('lang-select'); if(lang) lang.addEventListener('change',()=>setTimeout(refresh,0));
 window.addEventListener('pageshow',playback);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)playback();});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();