import { voice } from './VoiceService';

// Bridge from intents → your AR screen state (replace with real handlers)
export function makeARAdapter(refs) {
  const say = (t) => voice.say(t);

  return {
    say,
    reset: (msg) => { refs.reset?.(); say(msg); },
    rotate: (deg, msg) => { refs.rotateBy?.(deg); say(msg); },
    zoom: (factor, msg) => { refs.zoomBy?.(factor); say(msg); },
    setColor: (hex, msg) => { refs.setColor?.(hex); say(msg); },
    setStyle: (styleKey, msg) => { refs.setStyle?.(styleKey); say(msg); },
    setLength: (len, msg) => { refs.setLength?.(len); say(msg); },
    setBangs: (dir, msg) => { refs.setBangs?.(dir); say(msg); },
    setAge: (dir, msg) => { refs.setAging?.(dir); say(msg); },
  };
}
