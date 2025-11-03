// client/src/utils/telemetry.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const QKEY='omni_telem_q_v1', LKEY='omni_label_q_v1', IID='omni_install_id_v1';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TELEM_URL = process.env.EXPO_PUBLIC_TELEM_URL; // e.g. https://your-tunnel.example/ingest
const TELEM_KEY = process.env.EXPO_PUBLIC_TELEM_KEY; // shared secret

async function iid(){ let id=await AsyncStorage.getItem(IID); if(!id){id=Math.random().toString(36).slice(2)+Date.now().toString(36); await AsyncStorage.setItem(IID,id);} return id; }
async function getQ(){ try{return JSON.parse(await AsyncStorage.getItem(QKEY)||'[]');}catch{return[];} }
async function setQ(q){ await AsyncStorage.setItem(QKEY, JSON.stringify(q)); }
async function getL(){ try{return JSON.parse(await AsyncStorage.getItem(LKEY)||'[]');}catch{return[];} }
async function setL(q){ await AsyncStorage.setItem(LKEY, JSON.stringify(q)); }

export async function track(event, payload={}, { enabled=true }={}) {
  if(!enabled) return;
  const q = await getQ();
  q.push({ event, ts: Date.now(), iid: await iid(), app_ver: Application.nativeApplicationVersion||'dev', payload });
  if(q.length>1000) q.splice(0,q.length-1000);
  await setQ(q);
}

export async function queueLabel(x,y,strength='strong',{enabled=true}={}){
  if(!enabled || !Array.isArray(x) || !x.length) return;
  const q = await getL();
  q.push({ ts: Date.now(), iid: await iid(), x, y, strength });
  if(q.length>2000) q.splice(0,q.length-2000);
  await setL(q);
}

export async function flush({ allowTelemetry=false }={}) {
  if(!allowTelemetry) return;
  const [events, labels] = await Promise.all([getQ(), getL()]);
  if(!events.length && !labels.length) return;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    await post(`${SUPABASE_URL}/rest/v1/events`, events, { Authorization:`Bearer ${SUPABASE_ANON_KEY}`, apikey:SUPABASE_ANON_KEY, Prefer:'return=minimal' });
    await post(`${SUPABASE_URL}/rest/v1/labels`, labels, { Authorization:`Bearer ${SUPABASE_ANON_KEY}`, apikey:SUPABASE_ANON_KEY, Prefer:'return=minimal' });
  } else if (TELEM_URL && TELEM_KEY) {
    await post(`${TELEM_URL}/events`, events, { 'X-TELEM-KEY': TELEM_KEY });
    await post(`${TELEM_URL}/labels`, labels, { 'X-TELEM-KEY': TELEM_KEY });
  }

  await Promise.all([ setQ([]), setL([]) ]);
}

async function post(url, body, headersExtra={}) {
  const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', ...headersExtra }, body: JSON.stringify(body) });
  if(!res.ok) throw new Error(`post ${url} -> ${res.status}`);
}
