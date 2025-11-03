// client/src/utils/personalizer_sync.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadModel, saveModel } from './personalizer';
import { flush } from './telemetry';

const LAST_M='omni_last_maint_v1', LAST_G='omni_last_global_v1';

function decay(m,decay=1e-4){ if(!m?.w) return m; const d=1-decay; m.w=m.w.map(v=>v*d); m.b=(m.b||0)*d; return m; }

export async function runLocalMaintenance({ allowTelemetry=false, decayRate=1e-4 }={}) {
  const now=Date.now(), last=Number(await AsyncStorage.getItem(LAST_M)||0);
  if(now-last < 24*3600*1000) return;
  const m = await loadModel(); if(m) await saveModel(decay({...m}, decayRate));
  if(allowTelemetry) try{ await flush({ allowTelemetry:true }); }catch{}
  await AsyncStorage.setItem(LAST_M, String(now));
}

export async function pullAndBlendGlobalWeights(url,{blend=0.6}={}) {
  if(!url) return;
  const now=Date.now(), last=Number(await AsyncStorage.getItem(LAST_G)||0);
  if(now-last < 24*3600*1000) return;
  try{
    const res = await fetch(url, { cache:'no-store' }); if(!res.ok) return;
    const gw = await res.json(); if(!gw?.w) return;
    const local = await loadModel();
    if(!local?.w || local.w.length !== gw.dim) {
      await saveModel({ w: gw.w, b: gw.b||0, n:0 });
    } else {
      const w = local.w.map((wi,i)=> blend*(gw.w[i]||0) + (1-blend)*wi );
      const b = blend*(gw.b||0) + (1-blend)*(local.b||0);
      await saveModel({ ...local, w, b });
    }
    await AsyncStorage.setItem(LAST_G, String(now));
  }catch{}
}

export async function maybeNightlyTasks({ allowTelemetry=false, globalUrl=null }={}) {
  await runLocalMaintenance({ allowTelemetry });
  await pullAndBlendGlobalWeights(globalUrl, { blend:0.6 });
}
