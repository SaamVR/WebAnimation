// CHAPCHITRA C08: approved 240-frame Wordmark Reprint (Version B, −90°).
// Original Lottie keyframes and all SVG artwork are immutable; runtime only controls
// triggers and playback. The installed C01 lottie-web 5.13.0 player is reused.
const PLAYER = '/motion/c01/vendor/lottie.min.js';
const SOURCE = '/assets/c08/wordmark-reprint-original.json';
const HERO = '/assets/c08/wordmark-reprint-dark-inverted-v2.json';
// Paint-only derivative: the Illustrator-approved Cream #F4EBE4, with identical
// 240-frame C08 choreography and original Source/Legacy dark JSON untouched.
const DARK = '/assets/c08/wordmark-reprint-dark-owner-cream.json';
const themedSource = () => document.documentElement.dataset.theme==='dark' ? DARK : SOURCE;
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

export function mountC08({navbar,heroImage=null,heroStage=null,heroVariant='dark',onHeroHolding=()=>{}}={}) {
  if(navbar||heroImage)ensureC08Stylesheet();
  const nav={ready:false,playing:false,loadRequested:false,completed:0,loaded:false,hovered:false,armed:true,instance:null,source:null};
  const hero={ready:false,playing:false,completed:0,autoplay:0,instance:null,failed:false,stage:null,trigger:null,source:null};

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
        const request=themedSource();
        const instance=await loadAnimation(target,request);
        if(request!==themedSource()){instance.destroy();return null;}
        nav.instance=instance;
        nav.source=request;
        nav.ready=true;
        nav.instance.addEventListener('complete',()=>{
          nav.playing=false;
          nav.completed++;
          nav.instance.goToAndStop(DURATION_FRAMES-1,true);
          // The final frame is not a replacement for the approved compact
          // raster wordmark. Even while the pointer remains hovered, restore
          // the original static identity when playback completes; a new
          // pointerleave/enter still rearms the SAME approved C08 sequence.
          showStatic();
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
    // Invalidate only the paint renderer on a theme change. The approved
    // hover trigger and full 240-frame C08 timeline run unmodified on re-entry.
    new MutationObserver(()=>{
      if(!nav.instance||nav.source===themedSource())return;
      nav.instance.pause();
      nav.instance.destroy();
      nav.instance=null;
      nav.source=null;
      nav.ready=false;
      nav.playing=false;
      nav.armed=true;
      navbar.classList.remove('c08-navbar-playing');
    }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
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
    // The exact Illustrator Cloth_patch stays ABOVE the unchanged C08
    // Lottie wordmark; its static full-logo twin is hidden during playback.
    const cloth=document.createElement('img');
    cloth.className='c08-hero-cloth';
    cloth.src=document.documentElement.dataset.theme==='dark'
      ?'/assets/brand/chapchitra-dark-cloth.svg'
      :'/assets/brand/chapchitra-light-cloth.svg';
    cloth.dataset.ccThemeBrand='cloth';
    cloth.alt='';
    cloth.setAttribute('aria-hidden','true');
    cloth.draggable=false;
    heroStage.append(slot,cloth,trigger);
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
    const heroSource=()=>heroVariant==='paper'?themedSource():HERO;
    let heroPreparing=false,heroSwapping=false;
    const prepareHero=async()=>{
      if(heroPreparing||hero.ready||REDUCED.matches)return;
      heroPreparing=true;
      try{
        const requested=heroSource();
        const instance=await loadAnimation(slot,requested);
        if(requested!==heroSource()){
          instance.destroy();
          // A theme toggle while first loading should not show the wrong ink.
          queueMicrotask(()=>{if(!hero.ready&&!REDUCED.matches)void prepareHero()});
          return;
        }
        hero.instance=instance;
        hero.source=requested;
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
    // Theme changes replace only SVG renderers, never the timing, keyframes,
    // easing, replay state, roller rig or Wordmark Reprint playback sequence.
    // While the new painter loads, show the complete original static SVG.
    const refreshHeroTheme=async()=>{
      if(heroSwapping||heroPreparing||!hero.ready||hero.source===heroSource()||REDUCED.matches)return;
      heroSwapping=true;
      const wasShown=parent.classList.contains('c08-hero-shown');
      const wasPlaying=hero.playing;
      const frame=Math.min(DURATION_FRAMES-1,hero.instance?.currentFrame??0);
      hero.instance?.pause();
      hero.instance?.destroy();
      hero.instance=null;
      hero.ready=false;
      hero.playing=false;
      parent.classList.remove('c08-hero-shown');
      try{
        let next,requested;
        for(let attempt=0;attempt<6;attempt++){
          requested=heroSource();
          next=await loadAnimation(slot,requested);
          if(requested===heroSource())break;
          next.destroy();next=null;
        }
        if(!next)throw new Error('C08 theme changed during renderer replacement');
        hero.instance=next;
        hero.source=requested;
        hero.ready=true;
        next.addEventListener('complete',finish);
        if(REDUCED.matches){onHeroHolding(false);return}
        if(wasShown){
          parent.classList.add('c08-hero-shown');
          next.goToAndStop(frame,true);
          if(wasPlaying&&!document.hidden){hero.playing=true;next.play();}
          else{
            if(hero.completed>0)next.goToAndStop(DURATION_FRAMES-1,true);
            onHeroHolding(false);
          }
        }else if(hero.autoplay===0&&hero.completed===0&&!document.hidden){
          play({autoplay:true});
        }else onHeroHolding(false);
      }catch(error){
        hero.failed=true;
        trigger.hidden=true;
        parent.classList.remove('c08-hero-shown');
        onHeroHolding(false);
        console.warn('C08 theme renderer retained original static artwork:',error);
      }finally{heroSwapping=false;}
    };
    new MutationObserver(()=>{void refreshHeroTheme()}).observe(
      document.documentElement,{attributes:true,attributeFilter:['data-theme']});
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
          if(hero.source!==heroSource()){void refreshHeroTheme();return;}
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
      autoplay:hero.autoplay,failed:hero.failed,source:hero.source,frame:hero.instance?.currentFrame??null}},
    get navbar(){return {ready:nav.ready,playing:nav.playing,completed:nav.completed,
      hovered:nav.hovered,loaded:!!nav.instance,source:nav.source,frame:nav.instance?.currentFrame??null}},
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
