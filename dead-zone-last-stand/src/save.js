const KEY='deadZoneLastStand.v1';
export const freshProfile=()=>({settings:{music:true,sfx:true,shake:true,reduced:false},stats:{bestWave:0,totalKills:0,bestTime:0,totalRuns:0,bestScore:0},unlocks:[]});
export function loadProfile(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x||typeof x!=='object')return freshProfile();return {...freshProfile(),...x,settings:{...freshProfile().settings,...x.settings},stats:{...freshProfile().stats,...x.stats}}}catch{return freshProfile()}}
export function saveProfile(p){try{localStorage.setItem(KEY,JSON.stringify(p));return true}catch{return false}}
export function loadRun(){try{const s=JSON.parse(localStorage.getItem(KEY+'.run')||'null');if(!s||!s.run||!Number.isFinite(s.run.wave)||s.run.wave<0||!Array.isArray(s.run.owned))return null;return s}catch{return null}}
export function saveRun(run){try{localStorage.setItem(KEY+'.run',JSON.stringify({run,checkpoint:Date.now()}));return true}catch{return false}}
export function clearRun(){try{localStorage.removeItem(KEY+'.run')}catch{}}
export function resetAll(){try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+'.run')}catch{}}
