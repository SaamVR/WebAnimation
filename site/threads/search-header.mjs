// Static storefront inline search: the field expands LEFT of its unchanged icon.
export function initInlineSearch(root=document){
 const toggle=root.getElementById('search-button');
 const form=root.getElementById('search-area');
 const input=root.getElementById('search-input');
 if(!toggle||!form||!input)return;
 const setOpen=(open,{focus=true}={})=>{
  form.classList.toggle('is-open',open);
  form.setAttribute('aria-hidden',String(!open));
  toggle.setAttribute('aria-expanded',String(open));
  input.tabIndex=open?0:-1;
  if('inert' in form) form.inert=!open;
  if(focus){
   if(open){input.focus();requestAnimationFrame(()=>{if(form.classList.contains('is-open'))input.focus()});}
   else toggle.focus();
  }
 };
 setOpen(false,{focus:false});
 toggle.addEventListener('click',()=>setOpen(!form.classList.contains('is-open')));
 root.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&form.classList.contains('is-open')){
   e.preventDefault();setOpen(false);
  }
 });
 form.addEventListener('submit',e=>{
  e.preventDefault();
  const query=input.value.trim();
  if(!query){input.focus();return}
  window.location.href='/search/?q='+encodeURIComponent(query);
 });
 // Prevent category header shifts and preserve query when returning to results.
 const q=new URLSearchParams(window.location.search).get('q');
 if(q&&root.body?.dataset?.page==='search')input.value=q;
 return {setOpen};
}
