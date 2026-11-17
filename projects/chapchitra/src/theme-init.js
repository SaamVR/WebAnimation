/* CHAPCHITRA theme initialization — synchronous head script, before paint.
 * Explicit choice wins; otherwise follow OS preference. No CSS/artwork mutation.
 */
(function(){
  'use strict';
  const KEY='chapchitra-color-theme-v1';
  const root=document.documentElement;
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  let stored=null;
  try{const v=window.localStorage.getItem(KEY);if(v==='dark'||v==='light')stored=v;}catch(_){}
  function resolved(){return stored|| (media.matches?'dark':'light')}
  function apply(){
    const theme=resolved();
    root.dataset.theme=theme;
    root.style.colorScheme=theme;
    try{window.dispatchEvent(new CustomEvent('chapchitra:themechange',{detail:{theme,preference:stored||'system'}}))}catch(_){}
    return theme;
  }
  window.chapchitraTheme={
    get:()=>resolved(),getPreference:()=>stored||'system',
    set(value){
      if(value!=='dark'&&value!=='light')return resolved();
      stored=value;
      try{window.localStorage.setItem(KEY,value)}catch(_){}
      return apply();
    },
    reset(){
      stored=null;
      try{window.localStorage.removeItem(KEY)}catch(_){}
      return apply();
    }
  };
  apply();
  const onSystem=()=>{if(!stored)apply()};
  if(media.addEventListener)media.addEventListener('change',onSystem);
  else if(media.addListener)media.addListener(onSystem);
  window.addEventListener('storage',event=>{
    if(event.key!==KEY)return;
    stored=event.newValue==='dark'||event.newValue==='light'?event.newValue:null;
    apply();
  });
})();
