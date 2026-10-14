import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {loadProfile,saveProfile,loadRun,saveRun,clearRun} from '../src/save.js';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>{};globalThis.performance={now:()=>10000};globalThis.document={hidden:false,addEventListener:()=>{},fullscreenElement:null};
const noop=()=>{};const ctx=new Proxy({createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:0})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const ui={gameStarted(){},stateChanged(){},waveStart(){},updateHud(){},toast(){},boss(){},bossEnd(){},waveComplete(){},levelUp(){},gameOver(){},saveCheckpoint(){},saveResults(){}};
const canvas={width:0,height:0,style:{},getContext:()=>ctx,addEventListener:()=>{}};
const profile=loadProfile();profile.settings.sfx=false;const game=new Game(canvas,ui,profile);ui.game=game;
// Fresh run, arena, directional movement, firing cadence and ammunition.
game.start();assert.equal(game.mode,'playing');assert.equal(game.run.wave,1);const x0=game.player.x;game.keys.add('d');game.update(.1,10100);assert.ok(game.player.x>x0,'D moves player right');game.keys.clear();
game.mouse.x=game.W/2+100;game.mouse.y=game.H/2;game.shoot(11000);assert.equal(game.run.ammo.pistol,11,'shot consumes exactly one round');const count=game.bullets.length;game.shoot(11100);assert.equal(game.bullets.length,count,'fire-rate limit blocks early repeat');
// A projectile applies collision damage once and disappears on impact.
const target=game.makeEnemy('walker');target.x=game.player.x-60;target.y=game.player.y;target.hp=54;target.maxHp=54;game.entities=[target];game.bullets=[{x:target.x,y:target.y,vx:0,vy:0,life:1,damage:20,r:3}];game.update(.016,11150);assert.equal(target.hp,34,'projectile collision applies weapon damage');assert.equal(game.bullets.length,0,'bullet is removed after the hit');
// Reload transfers only available reserve, without duplication.
game.run.ammo.pistol=2;game.run.reserve.pistol=3;game.reload();game.player.reloadEnd=0;game.update(.01,12000);assert.equal(game.run.ammo.pistol,5);assert.equal(game.run.reserve.pistol,0);
// Purchase validation and state effects.
game.run.scrap=500;assert.equal(game.buyWeapon('shotgun'),true);assert.ok(game.run.owned.includes('shotgun'));assert.equal(game.buyWeapon('minigun'),false,'insufficient scrap is rejected');game.run.scrap=500;assert.equal(game.buyUpgrade('health'),true);assert.equal(game.player.maxHp,120);
// Rewards are once-only and wave clears only after queued spawns/enemies are gone.
const enemy=game.makeEnemy('walker');enemy.hp=1;const before=game.run.scrap;game.kill(enemy);const rewarded=game.run.scrap;game.kill(enemy);assert.equal(game.run.scrap,rewarded,'dead enemy cannot pay twice');assert.ok(rewarded>before);
game.spawnQueue=0;game.entities=[];game.mode='playing';game.update(.016,14000);assert.equal(game.mode,'between','cleared wave enters preparation/shop state');
// Run persistence is resilient to malformed JSON and stores a valid checkpoint.
storage.set('deadZoneLastStand.v1','{broken');assert.equal(loadProfile().stats.totalRuns,0);saveRun(game.run);assert.ok(loadRun());clearRun();assert.equal(loadRun(),null);saveProfile(profile);assert.equal(loadProfile().settings.sfx,false);
// Render pass works with canvas API stubs and doesn't depend on external assets.
game.draw(15000);console.log('PASS: start/move/fire rate/projectile hit/ammo/reload/shop/upgrades/rewards/wave transition/save corruption/render');
