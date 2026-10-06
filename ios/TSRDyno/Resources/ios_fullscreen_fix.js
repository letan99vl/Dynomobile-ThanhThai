(function(){
'use strict';
if(window.__TSR37_IOS_FULLSCREEN__)return;
window.__TSR37_IOS_FULLSCREEN__=true;

function install(){
  let meta=document.querySelector('meta[name="viewport"]');
  if(meta){
    meta.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  }
  if(document.getElementById('tsr37-ios-fullscreen-style'))return;
  const s=document.createElement('style');
  s.id='tsr37-ios-fullscreen-style';
  s.textContent=`
    html,body,#app{
      width:100%!important;
      height:100%!important;
      min-height:100%!important;
      margin:0!important;
      padding:0!important;
      overflow:hidden!important;
    }
    body{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100dvh!important;
      min-height:100dvh!important;
    }
  `;
  (document.head||document.documentElement).appendChild(s);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',install,{once:true});
}else{
  install();
}
})();