// CHAPCHITRA C08: approved 240-frame Wordmark Reprint (Version B, −90°).
// Original Lottie keyframes and all SVG artwork are immutable; runtime only controls
// triggers and playback. The installed C01 lottie-web 5.13.0 player is reused.
const PLAYER = '/motion/c01/vendor/lottie.min.js';
const SOURCE = '/assets/c08/wordmark-reprint-original.json';
const HERO = '/assets/c08/wordmark-reprint-hero-light.json';
const CSS = '/motion/c08/logo-player.css';

const DURATION_FRAMES = 240;
const HOVER = matchMedia('(hover:hover) and (pointer:fine)');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
let playerPromise;
const dataCache = new Map();

function runtime() {
  if (window.lottie?.loadAnimation) return Promise.resolve(window.lottie);
  if (playerPromise) return playerPromise;
  playerPromise = new Promise((resolve,reject) => {
    const done = () => window.lottie?.loadAnimation
      ? resolve(window.lottie) : reject(new Error('C08 lottie-web runtime unavailable'));
    const loaded = [...document.scripts].find(s => {
      try { return new URL(s.src,location.href).pathname===PLAYER; } catch { return false; }
    });
    const script = loaded || Object.assign(document.createElement('script'),{src:PLAYER,async:true});
    script.addEventListener('load',done,{once:true});
    script.addEventListener('error',()=>reject(new Error('C08 lottie-web asset failed')),{once:true});
    // The C01 module might have completed its own load before this listener.
    if (window.lottie?.loadAnimation) { done(); return; }
    if (!loaded) document.head.appendChild(script);
  }).catch(error => {
    playerPromise=null;
    throw error;
  });
  return playerPromise;
}
async function validatedData(url) {
  if (!dataCache.has(url)) dataCache.set(url,fetch(url,{cache:'force-cache'})
    .then(response => {
      if (!response.ok) throw new Error('C08 JSON HTTP '+response.status);
      return response.json();
    }).then(data => {
      if (data.w!==2400||data.h!==550||data.fr!==60||data.ip!==0||data.op!==DURATION_FRAMES||
          data.layers?.length!==6||data.assets?.length) throw new Error('C08 approved source metadata mismatch');
      const names=data.layers.map(layer=>layer.nm);
      if (JSON.stringify(names)!==JSON.stringify([
        'ROLLER_ASSEMBLY_MASTER','ROLLER_HANDLE_ROD','ROLLER_CYLINDER',
        'HIDDEN_T','PRINT_REVEAL','BASE_WORDMARK'
      ])) throw new Error('C08 approved vector layer hierarchy mismatch');
      return data;
    }).catch(error=>{dataCache.delete(url);throw error}));
  return dataCache.get(url);
}
async function loadAnimation(holder,src) {
  const [engine,data] = await Promise.all([runtime(),validatedData(src)]);
  return new Promise((resolve,reject) => {
    const instance=engine.loadAnimation({
      container:holder,renderer:'svg',animationData:data,
      loop:false,autoplay:false,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
    });
    const onReady=()=>{instance.pause();instance.goToAndStop(0,true);resolve(instance)};
    if (instance.isLoaded) onReady();
    else {
      instance.addEventListener('DOMLoaded',onReady);
      instance.addEventListener('data_failed',()=>reject(new Error('C08 renderer failed to parse supplied Lottie')));
    }
  });
}

// The Artist's Edit app runs from /releases/<sha>/app.mjs and does not
// include the homepage stylesheet. Load the *scoped* C08 CSS from the
// canonical root only when missing. Do not touch the worktable runtime.
function ensureC08Stylesheet() {
  const found = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .some(link => new URL(link.href,location.href).pathname===CSS);
  if(found)return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=CSS;
  link.dataset.c08Styles='true';
  document.head.appendChild(link);
}

export function mountC08({navbar,heroImage=null,heroStage=null,onHeroHolding=()=>{}}={}) {
  if(navbar||heroImage)ensureC08Stylesheet();
  const nav={ready:false,playing:false,loadRequested:false,completed:0,loaded:false,hovered:false,armed:true,instance:null};
  const hero={ready:false,playing:false,completed:0,autoplay:0,instance:null,failed:false,stage:null,trigger:null};

  if (navbar && !navbar.dataset.c08Mounted) {
    navbar.dataset.c08Mounted='true';
    const target=navbar.querySelector('.c08-navbar-animation');
    const showStatic=()=>{
      if (!nav.playing) navbar.classList.remove('c08-navbar-playing');
    };
    const prepare=async()=>{
      if(nav.instance)return nav.instance;
      if(nav.loadRequested)return null;
      nav.loadRequested=true;
      try{
        nav.instance=await loadAnimation(target,SOURCE);
        nav.ready=true;
        nav.instance.addEventListener('complete',()=>{
          nav.playing=false;
          nav.completed++;
          nav.instance.goToAndStop(DURATION_FRAMES-1,true);
          if(!nav.hovered)showStatic();
        });
        return nav.instance;
      }catch(error){
        nav.failed=true;
        navbar.classList.remove('c08-navbar-playing');
        console.warn('C08 navbar kept original static logo:',error);
        return null;
      }finally{nav.loadRequested=false}
    };
    const play=async()=>{
      if(REDUCED.matches||nav.playing||!nav.hovered||nav.failed)return;
      const instance=nav.instance||await prepare();
      if(!instance||!nav.hovered||nav.playing||REDUCED.matches)return;
      nav.playing=true;
      navbar.classList.add('c08-navbar-playing');
      instance.goToAndStop(0,true);
      instance.play();
    };
    navbar.addEventListener('pointerenter',e=>{
      if(!HOVER.matches||e.pointerType!=='mouse')return;
      nav.hovered=true;
      if(nav.armed){nav.armed=false;void play()}
    });
    navbar.addEventListener('pointerleave',()=>{
      nav.hovered=false;
      nav.armed=true;
      showStatic();
    });
    REDUCED.addEventListener('change',()=>{
      if(!REDUCED.matches)return;
      nav.instance?.pause();
      nav.playing=false;
      showStatic();
    });
    // Navbar remains an ordinary Home link, including on touch. Never prevent navigation.
  }
  if (heroImage && heroStage && !heroStage.dataset.c08Mounted) {
    heroStage.dataset.c08Mounted='true';
    hero.stage=heroStage;
    const parent=heroImage.parentElement;
    const slot=document.createElement('div');
    slot.className='c08-hero-wordmark';
    slot.setAttribute('aria-hidden','true');
    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='c08-hero-trigger';
    trigger.setAttribute('aria-label','Replay CHAPCHITRA animated logo');
    trigger.title='Replay logo animation';
    heroStage.append(slot,trigger);
    hero.trigger=trigger;
    const place=()=>{
      const box=heroImage.getBoundingClientRect();
      const origin=parent.getBoundingClientRect();
      if(box.width>0&&box.height>0) Object.assign(heroStage.style,{
        left:(box.left-origin.left)+'px',top:(box.top-origin.top)+'px',
        width:box.width+'px',height:box.height+'px'
      });
    };
    let resizeRAF=0;
    const requestPlace=()=>{
      if(resizeRAF)return;
      resizeRAF=requestAnimationFrame(()=>{resizeRAF=0;place()});
    };
    if(typeof ResizeObserver==='function')new ResizeObserver(requestPlace).observe(heroImage);
    window.addEventListener('resize',requestPlace,{passive:true});
    document.fonts?.ready.then(requestPlace);
    place();
    let hoverArmed=true;
    const finish=()=>{
      hero.playing=false;
      hero.completed++;
      hero.instance?.goToAndStop(DURATION_FRAMES-1,true);
      onHeroHolding(false);
    };
    const play=({autoplay=false}={})=>{
      if(hero.playing||REDUCED.matches||!hero.ready||document.hidden||heroImage.closest('.hero-slide')?.hidden)return false;
      hero.playing=true;
      if(autoplay)hero.autoplay++;
      onHeroHolding(true);
      parent.classList.add('c08-hero-shown');
      hero.instance.goToAndStop(0,true);
      hero.instance.play();
      return true;
    };
    trigger.addEventListener('pointerenter',e=>{
      if(!HOVER.matches||e.pointerType!=='mouse')return;
      if(hoverArmed&&!hero.playing&&hero.completed>0){hoverArmed=false;play()}
    });
    trigger.addEventListener('pointerleave',()=>{hoverArmed=true});
    trigger.addEventListener('click',e=>{
      // Touch taps and keyboard activation replay; desktop pointer uses hover only.
      if(REDUCED.matches||hero.playing||hero.completed===0)return;
      if(HOVER.matches&&e.detail>0)return;
      play();
    });
    let heroPreparing=false;
    const prepareHero=async()=>{
      if(heroPreparing||hero.ready||REDUCED.matches)return;
      heroPreparing=true;
      try{
        hero.instance=await loadAnimation(slot,HERO);
        hero.ready=true;
        hero.instance.addEventListener('complete',finish);
        if(REDUCED.matches){onHeroHolding(false);return}
        if(document.hidden){
          const onVisible=()=>{
            if(document.hidden)return;
            document.removeEventListener('visibilitychange',onVisible);
            if(!REDUCED.matches&&hero.autoplay===0&&hero.completed===0){
              if(!play({autoplay:true}))onHeroHolding(false);
            }
          };
          document.addEventListener('visibilitychange',onVisible);
        }else if(!play({autoplay:true}))onHeroHolding(false);
      }catch(error){
        hero.failed=true;
        trigger.hidden=true;
        parent.classList.remove('c08-hero-shown');
        onHeroHolding(false);
        console.warn('C08 hero retained original static logo:',error);
      }finally{heroPreparing=false}
    };
    const reflectReduced=()=>{
      if(REDUCED.matches){
        hero.instance?.pause();
        hero.playing=false;
        parent.classList.remove('c08-hero-shown');
        trigger.hidden=true;
        onHeroHolding(false);
      }else{
        trigger.hidden=false;
        if(hero.ready){
          if(hero.completed>0)parent.classList.add('c08-hero-shown');
          else if(!hero.playing&&!document.hidden){
            if(!play({autoplay:true}))onHeroHolding(false);
          }
        }else if(!hero.failed)void prepareHero();
      }
    };
    REDUCED.addEventListener('change',reflectReduced);
    document.addEventListener('visibilitychange',()=>{
      if(!hero.instance||!hero.playing)return;
      if(document.hidden)hero.instance.pause();
      else hero.instance.play();
    });
    reflectReduced();
  }
  // Compact read-only visual-QA diagnostics, no extra clock and no owner UI changes.
  window.__chapchitraC08={
    get hero(){return {ready:hero.ready,playing:hero.playing,completed:hero.completed,
      autoplay:hero.autoplay,failed:hero.failed,frame:hero.instance?.currentFrame??null}},
    get navbar(){return {ready:nav.ready,playing:nav.playing,completed:nav.completed,
      hovered:nav.hovered,loaded:!!nav.instance,frame:nav.instance?.currentFrame??null}},
    seekHeroForQA(frame){
      if(!hero.instance)return false;
      hero.instance.pause();hero.instance.goToAndStop(frame,true);
      heroImage?.parentElement?.classList.add('c08-hero-shown');return true;
    },
    seekNavForQA(frame){
      if(!nav.instance)return false;
      nav.instance.pause();nav.instance.goToAndStop(frame,true);
      navbar.classList.add('c08-navbar-playing');return true;
    }
  };
}
