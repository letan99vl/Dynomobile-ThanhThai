(function(){
'use strict';
if(window.__TSR37_IOS_BLE__)return;
window.__TSR37_IOS_BLE__=true;

const SERVICE='d7a10001-7c35-4a6d-9f0e-2ea3117f1000';

function post(m){window.webkit.messageHandlers.iosBLE.postMessage(m)}
function asU8(d){
  if(d instanceof Uint8Array)return d;
  if(d instanceof ArrayBuffer)return new Uint8Array(d);
  if(ArrayBuffer.isView(d))return new Uint8Array(d.buffer,d.byteOffset,d.byteLength);
  return new Uint8Array(d||[]);
}
function toB64(d){
  const u=asU8(d);let s='';
  for(let i=0;i<u.length;i+=0x4000){
    s+=String.fromCharCode.apply(null,Array.from(u.subarray(i,Math.min(i+0x4000,u.length))));
  }
  return btoa(s);
}
function fromB64(v){
  const s=atob(v||''),u=new Uint8Array(s.length);
  for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;
  return u;
}

let writeSeq=0;
const writePending=new Map();
function nativeWrite(uuid,data,withResponse){
  if(!withResponse){
    post({action:'write',uuid,base64:toB64(data),withResponse:false,token:0});
    return Promise.resolve();
  }
  return new Promise((resolve,reject)=>{
    const token=(writeSeq=writeSeq%1000000+1);
    const timer=setTimeout(()=>{
      writePending.delete(token);
      reject(new Error('iOS BLE write timeout'));
    },5000);
    writePending.set(token,{resolve,reject,timer});
    post({action:'write',uuid,base64:toB64(data),withResponse:true,token});
  });
}
window.__iosBleWriteDone=function(token,ok,status){
  const p=writePending.get(Number(token)||0);
  if(!p)return;
  writePending.delete(Number(token)||0);
  clearTimeout(p.timer);
  if(ok)p.resolve();else p.reject(new Error('iOS BLE write error '+status));
};

const chars=new Map();
function makeCharacteristic(uuid){
  uuid=String(uuid).toLowerCase();
  if(chars.has(uuid))return chars.get(uuid);
  const listeners=[];
  const ch={
    uuid,
    startNotifications(){return Promise.resolve(ch)},
    stopNotifications(){return Promise.resolve(ch)},
    addEventListener(type,fn){
      if(type==='characteristicvaluechanged'&&typeof fn==='function')listeners.push(fn);
    },
    removeEventListener(type,fn){
      const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);
    },
    writeValueWithoutResponse(data){return nativeWrite(uuid,data,false)},
    writeValueWithResponse(data){return nativeWrite(uuid,data,true)},
    writeValue(data){return nativeWrite(uuid,data,false)},
    __emit(bytes){
      const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      listeners.slice().forEach(fn=>{try{fn({target:{value:dv}})}catch(e){console.error(e)}});
    }
  };
  chars.set(uuid,ch);
  return ch;
}

const service={
  uuid:SERVICE,
  getCharacteristic(uuid){return Promise.resolve(makeCharacteristic(uuid))}
};
const server={
  connected:true,
  getPrimaryService(uuid){
    if(String(uuid).toLowerCase()!==SERVICE)return Promise.reject(new Error('BLE service mismatch'));
    return Promise.resolve(service);
  }
};

const disconnected=[];
const device={
  name:'BT Speed Dyno',
  id:'ios-native-ble',
  gatt:{
    connected:false,
    connect(){this.connected=true;server.connected=true;return Promise.resolve(server)},
    disconnect(){try{post({action:'disconnect'})}catch(e){}}
  },
  addEventListener(type,fn){
    if(type==='gattserverdisconnected'&&typeof fn==='function')disconnected.push(fn);
  },
  removeEventListener(type,fn){
    if(type!=='gattserverdisconnected')return;
    const i=disconnected.indexOf(fn);if(i>=0)disconnected.splice(i,1);
  }
};

let pendingResolve=null,pendingReject=null,pendingTimer=null;
const api={
  requestDevice(){
    return new Promise((resolve,reject)=>{
      pendingResolve=resolve;pendingReject=reject;
      clearTimeout(pendingTimer);
      pendingTimer=setTimeout(()=>{
        pendingResolve=pendingReject=null;
        reject(new Error('iOS BLE scan timeout'));
      },20000);
      post({action:'requestDevice'});
    });
  },
  getAvailability(){return Promise.resolve(true)},
  getDevices(){return Promise.resolve(device.gatt.connected?[device]:[])},
  setScreenDimEnabled(enabled){
    try{post({action:'keepScreenOn',enabled:!enabled})}catch(e){}
    return Promise.resolve();
  }
};

try{
  Object.defineProperty(navigator,'bluetooth',{configurable:true,enumerable:true,value:api});
}catch(e){
  try{navigator.bluetooth=api}catch(_e){}
}

window.__iosBleConnected=function(name){
  clearTimeout(pendingTimer);
  device.name=name||'BT Speed Dyno';
  device.gatt.connected=true;server.connected=true;
  if(pendingResolve){
    const r=pendingResolve;pendingResolve=pendingReject=null;r(device);
  }
};
window.__iosBleConnectError=function(message){
  clearTimeout(pendingTimer);
  if(pendingReject){
    const r=pendingReject;pendingResolve=pendingReject=null;
    r(new Error(message||'BLE error'));
  }
};
window.__iosBleDisconnected=function(){
  device.gatt.connected=false;server.connected=false;
  disconnected.slice().forEach(fn=>{try{fn({target:device})}catch(e){}});
};
window.__iosBlePacket=function(uuid,b64){
  try{makeCharacteristic(String(uuid).toLowerCase()).__emit(fromB64(b64))}
  catch(e){console.error('37TSR iOS BLE packet',e)}
};

console.log('37TSR Dyno native iOS BLE bridge installed');
})();