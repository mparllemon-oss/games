(() => {
'use strict';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
const $ = id => document.getElementById(id);
const screens = ['menuScreen','settingsScreen','howScreen','pauseScreen','gameOverScreen'];
const hud = $('hud'), scoreValue=$('scoreValue'), livesValue=$('livesValue'), comboBadge=$('comboBadge'), comboText=$('comboText');
const BEST_KEY='juiceRushBest_v1', SET_KEY='juiceRushSettings_v1';
let dpr=1, W=innerWidth, H=innerHeight, last=0, raf=0;
let state='menu', score=0, lives=3, best=Number(localStorage.getItem(BEST_KEY)||0), sessionStartBest=best, newBest=false;
let objects=[], particles=[], splashes=[], texts=[], trails=[], stars=[];
let spawnTimer=0, spawnEvery=820, elapsed=0, combo=0, comboTimer=0, comboHideTimer=0, screenShake=0, flash=0;
let pointerDown=false, pointerId=null, lastPoint=null;
let settings={sound:true,music:true,haptics:true};
try{settings={...settings,...JSON.parse(localStorage.getItem(SET_KEY)||'{}')}}catch{}

const fruitTypes=[
 {name:'watermelon',skin:'#42bd67',flesh:'#ff4f76',seed:'#4b1731',r:36,points:10},
 {name:'orange',skin:'#ff9e2e',flesh:'#ffb33f',seed:'#fff1ba',r:31,points:10},
 {name:'kiwi',skin:'#8a6438',flesh:'#9cd94f',seed:'#273017',r:30,points:12},
 {name:'apple',skin:'#ef4c55',flesh:'#ffd9c6',seed:'#6a2a22',r:32,points:10},
 {name:'blueberry',skin:'#5667e8',flesh:'#7889ff',seed:'#c8ceff',r:25,points:14},
 {name:'lemon',skin:'#ffd83d',flesh:'#fff079',seed:'#fff9d6',r:29,points:11}
];

class AudioFX{
 constructor(){this.ac=null;this.master=null;this.musicGain=null;this.musicNodes=[];this.started=false}
 ensure(){if(this.ac)return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return; this.ac=new AC();this.master=this.ac.createGain();this.master.gain.value=.22;this.master.connect(this.ac.destination);this.musicGain=this.ac.createGain();this.musicGain.gain.value=.035;this.musicGain.connect(this.master)}
 tone(freq=440,dur=.08,type='sine',gain=.18,slide=0){if(!settings.sound)return;this.ensure();if(!this.ac)return;const t=this.ac.currentTime,o=this.ac.createOscillator(),g=this.ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02)}
 noise(dur=.09,gain=.12,cut=1200){if(!settings.sound)return;this.ensure();if(!this.ac)return;const sr=this.ac.sampleRate,b=this.ac.createBuffer(1,sr*dur,sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=this.ac.createBufferSource(),f=this.ac.createBiquadFilter(),g=this.ac.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=cut;g.gain.value=gain;s.connect(f);f.connect(g);g.connect(this.master);s.start()}
 slice(){this.tone(650,.065,'triangle',.12,320);this.noise(.05,.05,2500)}
 button(){this.tone(520,.045,'sine',.08,80)}
 combo(n){this.tone(620+n*45,.11,'triangle',.13,150)}
 bomb(){this.noise(.3,.25,500);this.tone(90,.28,'sawtooth',.16,-40)}
 bonus(){[740,930,1180].forEach((f,i)=>setTimeout(()=>this.tone(f,.12,'sine',.11,120),i*55))}
 gameover(){[360,280,210].forEach((f,i)=>setTimeout(()=>this.tone(f,.2,'triangle',.11,-50),i*120))}
 high(){[620,780,980,1240].forEach((f,i)=>setTimeout(()=>this.tone(f,.18,'sine',.1,100),i*75))}
 startMusic(){this.ensure(); if(!this.ac||this.started||!settings.music)return;this.started=true; const loop=()=>{if(!this.started||!settings.music)return; const base=[110,138.6,164.8,138.6];base.forEach((f,i)=>{const o=this.ac.createOscillator(),g=this.ac.createGain(),t=this.ac.currentTime+i*.3;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(g);g.connect(this.musicGain);o.start(t);o.stop(t+.3)});this.musicTimer=setTimeout(loop,1200)};loop()}
 stopMusic(){this.started=false;clearTimeout(this.musicTimer)}
}
const audio=new AudioFX();

function resize(){dpr=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);createStars()}
function createStars(){stars=Array.from({length:Math.min(70,Math.floor(W*H/18000))},()=>({x:Math.random()*W,y:Math.random()*H*.72,r:Math.random()*1.4+.3,a:Math.random()*.35+.08,p:Math.random()*6.28}))}
window.addEventListener('resize',resize,{passive:true}); resize();

function showScreen(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));}
function updateBestUI(){$('menuBest').textContent=best;$('finalBest').textContent=best}
function saveSettings(){localStorage.setItem(SET_KEY,JSON.stringify(settings))}
function syncToggles(){[['soundToggle','sound'],['musicToggle','music'],['hapticToggle','haptics']].forEach(([id,k])=>$(id).setAttribute('aria-checked',String(settings[k])))}
function setState(s){state=s; if(s==='playing'){showScreen(null);hud.classList.remove('hidden')} else {hud.classList.add('hidden'); if(s==='menu')showScreen('menuScreen');if(s==='pause')showScreen('pauseScreen');if(s==='gameover')showScreen('gameOverScreen')}}
function haptic(ms=12){if(settings.haptics&&navigator.vibrate)navigator.vibrate(ms)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),1400)}

function resetGame(){sessionStartBest=best;score=0;lives=3;objects=[];particles=[];splashes=[];texts=[];trails=[];spawnTimer=250;elapsed=0;spawnEvery=820;combo=0;comboTimer=0;screenShake=0;flash=0;newBest=false;updateHUD();setState('playing');audio.ensure();if(audio.ac?.state==='suspended')audio.ac.resume();if(settings.music)audio.startMusic();last=performance.now()}
function updateHUD(){scoreValue.textContent=score;livesValue.innerHTML='';for(let i=0;i<3;i++){const s=document.createElement('span');s.className='life'+(i>=lives?' lost':'');s.textContent='♥';livesValue.appendChild(s)}livesValue.setAttribute('aria-label',`${lives} lives`)}
function addScore(v,x,y,label){score+=v;updateHUD();texts.push({x,y,text:label||`+${v}`,life:1,max:1,vy:-38,scale:1}); if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best));updateBestUI()}}
function showCombo(){if(combo<2)return;comboText.textContent=`Combo x${combo}`;comboBadge.classList.add('show');clearTimeout(comboHideTimer);comboHideTimer=setTimeout(()=>comboBadge.classList.remove('show'),750)}

function spawnWave(){const level=Math.min(1,elapsed/70000);const count=(Math.random()<.28+level*.24?2:1)+(Math.random()<level*.18?1:0);for(let i=0;i<count;i++)spawnFruit(i,count,level);if(elapsed>9000&&Math.random()<.08+level*.09)spawnBomb();if(elapsed>14000&&Math.random()<.045)spawnBonus()}
function spawnFruit(i,count,level){const type=fruitTypes[(Math.random()*fruitTypes.length)|0];const margin=Math.min(100,W*.12);const x=margin+Math.random()*(W-margin*2);const targetX=W*(.28+Math.random()*.44);const flight=1.8+Math.random()*.55;const gravity=H*(1.15+level*.12);const vy=-(gravity*flight*.56+Math.random()*90);const vx=(targetX-x)/flight+(Math.random()-.5)*80;objects.push({kind:'fruit',type,x,y:H+type.r+8,vx,vy,g:gravity,r:type.r*(.9+Math.random()*.12),rot:Math.random()*6.28,vr:(Math.random()-.5)*5.4,sliced:false,age:0})}
function spawnBomb(){const r=31,x=W*(.15+Math.random()*.7),gravity=H*1.22,flight=2+Math.random()*.35;objects.push({kind:'bomb',x,y:H+r+6,vx:(Math.random()-.5)*130,vy:-(gravity*flight*.54+30),g:gravity,r,rot:0,vr:(Math.random()-.5)*3.8,sliced:false,age:0})}
function spawnBonus(){const r=29,x=W*(.18+Math.random()*.64),gravity=H*1.16,flight=2.15;objects.push({kind:'bonus',x,y:H+r+6,vx:(Math.random()-.5)*120,vy:-(gravity*flight*.56+40),g:gravity,r,rot:0,vr:2.4,sliced:false,age:0})}

function segmentCircle(ax,ay,bx,by,cx,cy,r){const abx=bx-ax,aby=by-ay,den=abx*abx+aby*aby||1,t=Math.max(0,Math.min(1,((cx-ax)*abx+(cy-ay)*aby)/den));const px=ax+abx*t,py=ay+aby*t,dx=cx-px,dy=cy-py;return dx*dx+dy*dy<=r*r}
function sliceSegment(a,b){if(state!=='playing')return;let hits=[];for(const o of objects){if(o.sliced)continue;if(segmentCircle(a.x,a.y,b.x,b.y,o.x,o.y,o.r+10))hits.push(o)}if(!hits.length)return;const fruits=hits.filter(o=>o.kind==='fruit'||o.kind==='bonus');if(fruits.length){combo+=fruits.length;comboTimer=.75; if(combo>=2){showCombo();audio.combo(Math.min(combo,8))}}
 for(const o of hits){if(o.sliced)continue;if(o.kind==='bomb'){hitBomb(o);continue} sliceObject(o,b.x-a.x,b.y-a.y)} }
function sliceObject(o,dx,dy){o.sliced=true;audio.slice();haptic(9);const angle=Math.atan2(dy,dx);if(o.kind==='bonus'){addScore(50,o.x,o.y,'+50 BONUS');audio.bonus();flash=.22;spawnBurst(o.x,o.y,'#ffe06a',34,190);texts.push({x:o.x,y:o.y-28,text:'GOLDEN!',life:1.2,max:1.2,vy:-22,scale:1.2})}else{const multi=Math.max(1,Math.min(combo,5));addScore(o.type.points*multi,o.x,o.y, multi>1?`+${o.type.points*multi}`:null);spawnBurst(o.x,o.y,o.type.flesh,18,130);splashes.push({x:o.x,y:o.y,r:o.r*1.15,color:o.type.flesh,life:.45,max:.45,angle});spawnHalves(o,angle)} }
function spawnHalves(o,angle){const n={...o,kind:'half',half:-1,life:1.25,max:1.25,vx:o.vx-70*Math.cos(angle+Math.PI/2),vy:o.vy*.3-30,g:o.g*.75,vr:o.vr-2};const p={...o,kind:'half',half:1,life:1.25,max:1.25,vx:o.vx+70*Math.cos(angle+Math.PI/2),vy:o.vy*.3-30,g:o.g*.75,vr:o.vr+2};objects.push(n,p)}
function hitBomb(o){o.sliced=true;lives--;combo=0;comboTimer=0;comboBadge.classList.remove('show');screenShake=12;flash=.45;audio.bomb();haptic(70);spawnBurst(o.x,o.y,'#ff5b68',38,250);spawnBurst(o.x,o.y,'#ffbf59',24,180);updateHUD();texts.push({x:o.x,y:o.y,text:'BOMB!',life:1,max:1,vy:-28,scale:1.3});if(lives<=0)setTimeout(endGame,520)}
function missFruit(o){if(o.kind!=='fruit'||o.sliced)return;lives--;combo=0;updateHUD();texts.push({x:o.x,y:H-36,text:'MISS',life:.8,max:.8,vy:-18,scale:.9});if(lives<=0)endGame()}
function endGame(){if(state!=='playing')return;state='ending';audio.stopMusic();audio.gameover();setTimeout(()=>{newBest=score>sessionStartBest; if(newBest)audio.high();$('finalScore').textContent=score;$('finalBest').textContent=best;$('newBest').classList.toggle('hidden',!newBest);setState('gameover')},420)}
function spawnBurst(x,y,color,n,speed){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=speed*(.25+Math.random()*.75);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:220+Math.random()*220,r:2+Math.random()*4,color,life:.45+Math.random()*.45,max:.9})}}

function update(dt){if(state!=='playing'&&state!=='ending')return;elapsed+=dt*1000;spawnEvery=Math.max(370,820-elapsed*.0045);spawnTimer-=dt*1000;if(state==='playing'&&spawnTimer<=0){spawnWave();spawnTimer=spawnEvery*(.75+Math.random()*.45)} if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0)combo=0}
 for(const o of objects){o.age+=dt;if(o.kind==='half'){o.life-=dt;o.vy+=o.g*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.rot+=o.vr*dt;continue}if(o.sliced)continue;o.vy+=o.g*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.rot+=o.vr*dt;if(o.y>H+o.r+28&&o.vy>0){missFruit(o);o.sliced=true}}
 objects=objects.filter(o=>o.kind==='half'?o.life>0:o.y<H+180&&!o.sliced || (o.sliced&&o.kind==='bomb'&&o.age<.4));
 for(const p of particles){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.99}
 particles=particles.filter(p=>p.life>0);for(const s of splashes)s.life-=dt;splashes=splashes.filter(s=>s.life>0);for(const t of texts){t.life-=dt;t.y+=t.vy*dt}texts=texts.filter(t=>t.life>0);for(const tr of trails)tr.life-=dt;trails=trails.filter(t=>t.life>0);screenShake=Math.max(0,screenShake-35*dt);flash=Math.max(0,flash-dt)}

function drawBackground(t){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#12233a');g.addColorStop(.54,'#0b1728');g.addColorStop(1,'#07101a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(t*.001+s.p));ctx.fillStyle='#bfe9ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill()}ctx.globalAlpha=1;const grd=ctx.createRadialGradient(W*.5,H*.95,20,W*.5,H*.95,Math.max(W,H)*.72);grd.addColorStop(0,'rgba(67,210,132,.10)');grd.addColorStop(.5,'rgba(40,170,200,.035)');grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H)}
function drawFruit(o,half=0){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);const r=o.r,t=o.type;ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=16;ctx.shadowOffsetY=8; if(half){ctx.beginPath();ctx.arc(0,0,r,half<0?Math.PI*.52:-Math.PI*.48,half<0?Math.PI*1.48:Math.PI*.48,half<0);ctx.closePath();ctx.fillStyle=t.skin;ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(0,0,r*.86,half<0?Math.PI*.52:-Math.PI*.48,half<0?Math.PI*1.48:Math.PI*.48,half<0);ctx.closePath();ctx.fillStyle=t.flesh;ctx.fill()}else{ctx.beginPath();ctx.arc(0,0,r,0,6.28);ctx.fillStyle=t.skin;ctx.fill();ctx.shadowBlur=0;const hi=ctx.createRadialGradient(-r*.35,-r*.4,1,-r*.2,-r*.25,r*.8);hi.addColorStop(0,'rgba(255,255,255,.42)');hi.addColorStop(.45,'rgba(255,255,255,.07)');hi.addColorStop(1,'rgba(0,0,0,.1)');ctx.fillStyle=hi;ctx.fill();if(t.name==='watermelon'){ctx.strokeStyle='rgba(9,86,46,.6)';ctx.lineWidth=3;for(let x=-r*.55;x<r*.6;x+=r*.3){ctx.beginPath();ctx.moveTo(x,-r*.85);ctx.quadraticCurveTo(x+6,0,x,r*.85);ctx.stroke()}}if(t.name==='kiwi'){ctx.strokeStyle='rgba(43,31,16,.25)';ctx.lineWidth=1.5;for(let a=0;a<6.28;a+=.45){ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r*.92,Math.sin(a)*r*.92);ctx.stroke()}}ctx.fillStyle='#4aa14a';ctx.beginPath();ctx.ellipse(2,-r*.96,7,14,.5,0,6.28);ctx.fill()}ctx.restore()}
function drawHalf(o){ctx.globalAlpha=Math.max(0,o.life/o.max);drawFruit(o,o.half);ctx.globalAlpha=1}
function drawBomb(o){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=18;ctx.shadowOffsetY=9;const g=ctx.createRadialGradient(-10,-12,2,0,0,o.r);g.addColorStop(0,'#596174');g.addColorStop(.28,'#252c39');g.addColorStop(1,'#090c12');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,o.r,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#7f5a3a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(8,-o.r+5);ctx.quadraticCurveTo(20,-o.r-15,17,-o.r-26);ctx.stroke();ctx.fillStyle='#ffcb55';ctx.beginPath();ctx.arc(17,-o.r-28,5+Math.sin(performance.now()*.02)*1.4,0,6.28);ctx.fill();ctx.restore()}
function drawBonus(o){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ctx.shadowColor='rgba(255,204,72,.5)';ctx.shadowBlur=22;const g=ctx.createRadialGradient(-8,-10,2,0,0,o.r);g.addColorStop(0,'#fff8b0');g.addColorStop(.3,'#ffd95d');g.addColorStop(1,'#ff9d35');ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?o.r*.52:o.r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.arc(-7,-8,5,0,6.28);ctx.fill();ctx.restore()}
function drawSplash(s){const a=s.life/s.max;ctx.save();ctx.globalAlpha=a*.42;ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.fillStyle=s.color;ctx.beginPath();ctx.ellipse(0,0,s.r*(1.8-a*.35),s.r*.35,0,0,6.28);ctx.fill();ctx.restore();ctx.globalAlpha=1}
function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill()}ctx.globalAlpha=1}
function drawTrails(){if(trails.length<2)return;ctx.lineCap='round';for(let i=1;i<trails.length;i++){const a=trails[i-1],b=trails[i],alpha=Math.min(a.life,b.life)/.22;ctx.strokeStyle=`rgba(190,247,255,${alpha*.75})`;ctx.lineWidth=2+alpha*7;ctx.shadowColor='rgba(84,218,255,.55)';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.shadowBlur=0}
function drawTexts(){ctx.textAlign='center';ctx.font='900 19px system-ui';for(const t of texts){const a=t.life/t.max;ctx.globalAlpha=Math.min(1,a*2);ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=8;ctx.font=`900 ${19*t.scale}px system-ui`;ctx.fillText(t.text,t.x,t.y)}ctx.globalAlpha=1;ctx.shadowBlur=0}
function render(t){ctx.save();const sx=screenShake?(Math.random()-.5)*screenShake:0,sy=screenShake?(Math.random()-.5)*screenShake:0;ctx.translate(sx,sy);drawBackground(t);for(const s of splashes)drawSplash(s);for(const o of objects){if(o.kind==='fruit'&&!o.sliced)drawFruit(o);else if(o.kind==='half')drawHalf(o);else if(o.kind==='bomb'&&!o.sliced)drawBomb(o);else if(o.kind==='bonus'&&!o.sliced)drawBonus(o)}drawParticles();drawTrails();drawTexts();ctx.restore();if(flash>0){ctx.fillStyle=`rgba(255,92,87,${Math.min(.32,flash)})`;ctx.fillRect(0,0,W,H)}}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);render(t);raf=requestAnimationFrame(loop)}raf=requestAnimationFrame(loop);

function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()}}
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;pointerDown=true;pointerId=e.pointerId;canvas.setPointerCapture?.(e.pointerId);lastPoint=pointFromEvent(e);trails.push({...lastPoint,life:.22});e.preventDefault()},{passive:false});
canvas.addEventListener('pointermove',e=>{if(state!=='playing'||!pointerDown||e.pointerId!==pointerId)return;const p=pointFromEvent(e);if(lastPoint){const dx=p.x-lastPoint.x,dy=p.y-lastPoint.y;if(dx*dx+dy*dy>9){sliceSegment(lastPoint,p);trails.push({...p,life:.22});if(trails.length>22)trails.splice(0,trails.length-22);lastPoint=p}}e.preventDefault()},{passive:false});
function pointerEnd(e){if(e.pointerId!==pointerId)return;pointerDown=false;pointerId=null;lastPoint=null}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('contextmenu',e=>e.preventDefault());

$('playBtn').onclick=()=>{audio.button();resetGame()};$('howPlayBtn').onclick=()=>{audio.button();resetGame()};
$('settingsBtn').onclick=()=>{audio.button();showScreen('settingsScreen')};$('howBtn').onclick=()=>{audio.button();showScreen('howScreen')};
document.querySelectorAll('[data-back="menu"]').forEach(b=>b.onclick=()=>{audio.button();showScreen('menuScreen')});
$('pauseBtn').onclick=()=>{if(state==='playing'){audio.button();state='pause';showScreen('pauseScreen')}};
$('resumeBtn').onclick=()=>{audio.button();showScreen(null);state='playing';last=performance.now();hud.classList.remove('hidden')};
$('pauseHomeBtn').onclick=()=>{audio.button();audio.stopMusic();setState('menu')};
$('restartBtn').onclick=()=>{audio.button();resetGame()};$('homeBtn').onclick=()=>{audio.button();setState('menu')};
[['soundToggle','sound'],['musicToggle','music'],['hapticToggle','haptics']].forEach(([id,k])=>{$(id).onclick=()=>{settings[k]=!settings[k];$(id).setAttribute('aria-checked',String(settings[k]));saveSettings();audio.button();if(k==='music'){settings.music?audio.startMusic():audio.stopMusic()}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing'){state='pause';showScreen('pauseScreen');hud.classList.add('hidden')}});
window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Escape'){if(state==='playing')$('pauseBtn').click();else if(state==='pause')$('resumeBtn').click()}});
updateBestUI();syncToggles();updateHUD();
})();