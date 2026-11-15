(() => {
'use strict';
if (window.__plixoMusicLoaded) return;
window.__plixoMusicLoaded = true;
const script = document.currentScript || Array.from(document.scripts).reverse().find(s => /plixo-music\.js/.test(s.src));
const gameId = script && script.dataset.gameId || '';
const isHome = !!(script && script.dataset.page === 'home');
const KEY = 'plixo_music_settings_v1';
const CFG = {apiKey:'AIzaSyA9wKFVXmT6kUpuaBgwlPilF86LaKKDYFU',authDomain:'money-digger-9b05e.firebaseapp.com',databaseURL:'https://money-digger-9b05e-default-rtdb.europe-west1.firebasedatabase.app'};
const SONGS = {'creative-fire':{title:'Creative Fire',src:'creative-fire.mp3'},'fallen-tech':{title:'Fallen Tech',src:'fallen-tech.mp3'}};
const GAMES = [['home','Homepage'],['dvd_plus','DVD+'],['dino_world','Dino World'],['mini_browser_platformer','Mini Browser Platformer'],['mini_spikes_platformer','Mini Spikes Platformer'],['one_square','One Square'],['dodging_arena','Dodging Arena'],['bug_escape','Bug Escape'],['mini_apocalypse','Mini Apocalypse'],['money_digger','Money Digger'],['lucky_guy','Lucky Guy'],['time_ticker','Time Ticker'],['the_end','THE END']];
const UNSUPPORTED_GAMES = new Set(['dodging_arena','bug_escape','mini_apocalypse','the_end']);
const TXT = {
en:{nav:'♪ MUSIC',title:'MUSIC SETTINGS',desc:'Choose which songs are in your music rotation. Turn music on or off separately inside each game.',song:'Your music library',songHelp:'Select one or more songs. One song repeats; multiple songs play one after another.',songEnabled:'Included in your playlist',saved:'Your song choices save automatically',cloud:'Synced to your Plixo account',local:'Saved on this device until you sign in',off:'Music: OFF',tap:'Tap to start music',playing:'Now playing'},
nl:{nav:'♪ MUZIEK',title:'MUZIEKINSTELLINGEN',desc:'Kies welke nummers in je muzieklijst staan. Zet muziek afzonderlijk aan of uit in elke game.',song:'Jouw muziekbibliotheek',songHelp:'Selecteer één of meer nummers. Eén nummer wordt herhaald; meerdere nummers spelen na elkaar.',songEnabled:'Toegevoegd aan je afspeellijst',saved:'Je nummerkeuze wordt automatisch opgeslagen',cloud:'Gesynchroniseerd met je Plixo-account',local:'Op dit apparaat opgeslagen tot je inlogt',off:'Muziek: UIT',tap:'Tik om muziek te starten',playing:'Speelt nu'},
fr:{nav:'♪ MUSIQUE',title:'PARAMÈTRES MUSIQUE',desc:'Choisissez les morceaux de votre liste. Activez ou désactivez la musique séparément dans chaque jeu.',song:'Votre bibliothèque musicale',songHelp:'Sélectionnez un ou plusieurs morceaux. Un seul morceau se répète ; plusieurs sont lus à la suite.',songEnabled:'Inclus dans votre liste',saved:'Vos choix sont enregistrés automatiquement',cloud:'Synchronisé avec votre compte Plixo',local:'Enregistré sur cet appareil jusqu’à votre connexion',off:'Musique : OFF',tap:'Touchez pour démarrer la musique',playing:'Lecture en cours'}
};
const tr = k => (TXT[localStorage.getItem('app_lang') || 'en'] || TXT.en)[k] || TXT.en[k] || k;
const defaults = () => ({songs:['creative-fire'],games:[]});
const normalize = v => {
 const legacySong = v && SONGS[v.song] ? v.song : 'creative-fire';
 const isNewSettings = Array.isArray(v && v.songs);
 const songs = isNewSettings ? v.songs.filter(id => SONGS[id]) : [legacySong];
 const canKeepGameChoices = isNewSettings || (v && v.enabled === true);
 const games = canKeepGameChoices && Array.isArray(v && v.games) ? v.games : [];
 return {songs:Array.from(new Set(songs)),games:Array.from(new Set(games.filter(x => GAMES.some(g => g[0] === x && !UNSUPPORTED_GAMES.has(g[0])))))};
};
let settings = defaults(), db = null, accountCode = null, cloudReady = false, audio = null, playlistIndex = 0;
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
function playlist() { return settings.songs.filter(id => SONGS[id]); }
function currentSong() { const ids=playlist(); return SONGS[ids[playlistIndex % Math.max(ids.length,1)]] || null; }
function audioEl() {
 if (!audio) { audio=document.createElement('audio'); audio.id='plixo-music-audio'; audio.loop=false; audio.preload='auto'; audio.volume=.35; document.body.appendChild(audio);
  audio.addEventListener('ended',() => { const ids=playlist(); if (!ids.length || !here()) return; playlistIndex=(playlistIndex+1)%ids.length; playback(true); });
 }
 return audio;
}
function currentGameId() { return isHome ? 'home' : gameId; }
function here() { return settings.games.includes(currentGameId()); }
async function playback(advance=false) {
 const a=audioEl(), ids=playlist();
 if (!ids.length || !here()) { a.pause(); playerRefresh(); return; }
 if (playlistIndex>=ids.length) playlistIndex=0;
 const song=currentSong(); if (!song) { a.pause(); playerRefresh(); return; }
 const sourceChanged=!a.src.endsWith(song.src);
 if (sourceChanged) { a.pause(); a.src=song.src; a.load(); }
 if (advance || a.paused || sourceChanged) { try { await a.play(); } catch(e) { playerRefresh(true); return; } }
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
 const enabled=here(), active=audio && !audio.paused;
 b.textContent=active?'Ⅱ':'▶';
 b.setAttribute('aria-label',active?'Turn music off for this game':'Turn music on for this game');
 b.setAttribute('aria-pressed',active?'true':'false');
 b.style.opacity=playlist().length?'1':'.45'; b.disabled=!playlist().length;
 s.textContent=blocked ? tr('tap') : active ? tr('playing')+': '+(currentSong()?.title || '') : enabled ? tr('tap') : tr('off');
}
function player() {
 if (document.getElementById('plixo-music-player')) return;
 const wrap=document.createElement('div'); wrap.id='plixo-music-player';
 wrap.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:9px;padding:9px 12px;background:rgba(10,10,15,.94);border:1px solid #2a2a42;color:#e8e8ff;font:13px Inconsolata,monospace;box-shadow:0 4px 18px #0008;max-width:calc(100vw - 28px)';
 const b=document.createElement('button'); b.id='plixo-music-toggle'; b.textContent='▶'; b.style.cssText='background:#00ff88;color:#000;border:0;padding:7px 10px;font-weight:bold;cursor:pointer';
 const s=document.createElement('span'); s.id='plixo-music-player-status'; wrap.append(b,s); document.body.appendChild(wrap);
 b.addEventListener('click',async () => {
  const id=currentGameId();
  if (here() && audio && !audio.paused) {
   settings.games=settings.games.filter(x=>x!==id);
   save(); audioEl().pause(); playerRefresh();
   return;
  }
  if (!here()) settings.games=settings.games.concat(id);
  save();
  try { await playback(true); } catch(e) { playerRefresh(true); }
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
  p.innerHTML='<div class="info-wrap" style="max-width:760px"><h2 id="plixo-music-title"></h2><div class="info-block" style="border-left-color:var(--accent-green)"><p id="plixo-music-desc"></p><div class="form-group" style="margin-top:22px"><label id="plixo-music-song-label"></label><p id="plixo-music-song-help" style="font-size:.82rem;color:var(--text-muted);margin:8px 0 14px"></p><div id="plixo-music-songs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px"></div></div><p id="plixo-music-saved" style="font-size:.78rem;color:var(--text-muted);margin-top:14px"></p><p id="plixo-music-status" style="font-size:.78rem;color:var(--accent-green);margin-top:6px"></p></div></div>';
  const info=document.getElementById('page-info'); if(info&&info.parentElement) info.parentElement.insertBefore(p,info.nextSibling); else document.body.appendChild(p);
 }
 refresh();
}
function refresh() {
 if (!isHome) { playerRefresh(); return; }
 const p=document.getElementById('page-music'); if(!p) return;
 const nav=document.getElementById('plixo-music-nav'); if(nav) nav.textContent=tr('nav');
 p.querySelector('#plixo-music-title').textContent=tr('title');
 p.querySelector('#plixo-music-desc').textContent=tr('desc');
 p.querySelector('#plixo-music-song-label').textContent=tr('song');
 p.querySelector('#plixo-music-song-help').textContent=tr('songHelp');
 p.querySelector('#plixo-music-saved').textContent=tr('saved');
 const list=p.querySelector('#plixo-music-songs'); list.innerHTML='';
 Object.entries(SONGS).forEach(([id,song])=>{
  const label=document.createElement('label'); label.style.cssText='display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);padding:14px;color:var(--text);font-size:.9rem;cursor:pointer;border-radius:8px';
  const input=document.createElement('input'); input.type='checkbox'; input.checked=settings.songs.includes(id); input.style.cssText='accent-color:var(--accent-green);width:18px;height:18px;flex:0 0 auto';
  input.addEventListener('change',()=>{settings.songs=input.checked?settings.songs.concat(id):settings.songs.filter(x=>x!==id); playlistIndex=0; save();});
  const info=document.createElement('span'); info.style.cssText='display:flex;flex-direction:column;gap:4px';
  const name=document.createElement('strong'); name.textContent=song.title;
  const hint=document.createElement('small'); hint.style.color='var(--text-muted)'; hint.textContent=tr('songEnabled');
  info.append(name,hint); label.append(input,info); list.appendChild(label);
 });
 status(); playerRefresh();
}
function init() {
 if (isHome) { homePage(); player(); } else if (gameId) player();
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