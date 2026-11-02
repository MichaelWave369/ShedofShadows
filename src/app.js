import {NightShift,STAGES,AMMO_CAP,MAX_HEALTH,TOTAL_WAVES} from "./engine.js";
import {drawScene,drawEnemies,drawOverlay} from "./art.js";
import {createReceipt,downloadReceipt} from "./sidecar.js";
const el=id=>document.getElementById(id);
const canvas=el("game"),ctx=canvas.getContext("2d",{alpha:false}),game=new NightShift();
const aim={x:.5,y:.5};
const bestKey="shed-of-shadows.best.v1";
let previous=0,elapsed=0,lastNotice="",lastTargets="",lastPhase="",sound=false,audio=null,prevFire=false,prevReload=false;
function best(){try{return Number(localStorage.getItem(bestKey))||0;}catch{return 0;}}
function record(){try{if(game.score>best())localStorage.setItem(bestKey,String(game.score));}catch{/* private browsing */}}
function beep(freq=180){
 if(!sound)return;
 try{
  audio ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type="sawtooth";oscillator.frequency.setValueAtTime(freq,audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.4),audio.currentTime+.11);
  gain.gain.setValueAtTime(.04,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.11);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.11);
 }catch{sound=false;}
}
function fire(x=aim.x,y=aim.y){
 const result=game.shoot(x,y);
 if(result.kind==="blocked")return;
 beep(result.kind==="hit"?260:100);
 if(result.kind!=="empty"){
  el("flash").classList.add("lit");
  setTimeout(()=>el("flash").classList.remove("lit"),55);
 }
 record();
}
function reload(){if(game.reload())beep(330);}
function togglePause(){if(game.phase==="playing")game.pause();else if(game.phase==="paused")game.resume();}
function setOverlay(){
 if(lastPhase===game.phase)return;
 lastPhase=game.phase;
 const screens={
  title:["A NIGHT SHIFT STORY","THE WAREHOUSE IS BREATHING","Six shots. No backup. Three locations. Survive long enough to bring something back to daylight.","BEGIN NIGHT SHIFT"],
  paused:["SHIFT INTERRUPTED","KEEP THE LIGHT ON","The warehouse won't go anywhere.","RESUME SHIFT"],
  lost:["CASE FILE CLOSED","THE SHADOWS GOT YOU","Your last shift ended in the dark. Try again to uncover the sealed hold.","TRY AGAIN"],
  won:["SURVIVOR'S REPORT","YOU MADE IT TO DAWN","A K-marked ledger fragment was recovered. Export your local souvenir, or play again.","PLAY AGAIN"]
 };
 const [k,title,copy,button]=screens[game.phase];
 el("overlay").hidden=game.phase==="playing";
 el("overlay-kicker").textContent=k;el("overlay-title").textContent=title;
 el("overlay-copy").textContent=copy;el("play").textContent=button;
 el("receipt").hidden=game.phase!=="won";
 el("pause").textContent=game.phase==="paused"?"RESUME":"PAUSE";
}
function updateTargets(){
 const mark=game.phase+":"+game.transition+":"+game.enemies.map(e=>e.id+"-"+e.hp).join(",");
 if(mark===lastTargets)return;lastTargets=mark;
 const targetArea=el("targets");targetArea.replaceChildren();
 if(!game.enemies.length){
  const p=document.createElement("p");p.className="muted";
  p.textContent=game.phase==="playing"?"Scanning for movement...":"Enemies appear here during combat.";
  targetArea.appendChild(p);return;
 }
 for(const enemy of game.enemies){
  const b=document.createElement("button");b.type="button";
  const name=enemy.type==="warden"?"Warehouse Warden":enemy.type==="heavy"?"Armored Shadow":enemy.type==="runner"?"Fast Shadow":"Dock Shadow";
  b.textContent=name+" #"+enemy.id+" • "+enemy.hp+" HP";
  b.disabled=game.phase!=="playing"||game.transition>0;
  b.addEventListener("click",()=>{aim.x=enemy.x;aim.y=enemy.y;fire(enemy.x,enemy.y);});
  targetArea.appendChild(b);
 }
}
function updateHud(){
 const stage=STAGES[game.stage];
 el("location").textContent=stage.name;el("score").textContent=String(game.score).padStart(6,"0");
 el("health").textContent="♥ ".repeat(game.health)+"♡ ".repeat(MAX_HEALTH-game.health);
 el("ammo").textContent=game.reloadTime?"RELOADING":"● ".repeat(game.ammo)+"○ ".repeat(AMMO_CAP-game.ammo);
 el("chapter").textContent=stage.name+" // 0"+(game.stage+1);
 el("story").textContent=stage.subtitle;
 el("wave").textContent=String(game.waveNumber()).padStart(2,"0")+" / "+String(TOTAL_WAVES).padStart(2,"0");
 el("combo").textContent="×"+game.combo;
 el("best").textContent=String(Math.max(best(),game.score)).padStart(6,"0");
 el("reload").disabled=game.phase!=="playing"||game.reloadTime>0||game.ammo===AMMO_CAP;
 el("fire").disabled=game.phase!=="playing";
 if(lastNotice!==game.notice){lastNotice=game.notice;el("message").textContent=game.notice;}
 setOverlay();updateTargets();
}
function gamepad(dt){
 const pads=navigator.getGamepads?navigator.getGamepads():[];
 const pad=Array.from(pads).find(Boolean);
 if(!pad){prevFire=false;prevReload=false;return;}
 const x=pad.axes[0]||0,y=pad.axes[1]||0;
 if(Math.abs(x)>.16)aim.x=Math.max(.04,Math.min(.96,aim.x+x*dt*.65));
 if(Math.abs(y)>.16)aim.y=Math.max(.05,Math.min(.95,aim.y+y*dt*.65));
 const f=Boolean(pad.buttons[7]?.pressed||pad.buttons[0]?.pressed);
 const r=Boolean(pad.buttons[1]?.pressed);
 if(f&&!prevFire)fire();if(r&&!prevReload)reload();
 prevFire=f;prevReload=r;
}
function tick(now){
 if(!previous)previous=now;
 const dt=Math.max(0,Math.min(.1,(now-previous)/1000));previous=now;elapsed+=dt;
 gamepad(dt);game.update(dt);
 if(game.phase==="won")record();
 drawScene(ctx,game.stage,elapsed);drawEnemies(ctx,game.enemies);
 if(game.phase==="playing"||game.phase==="paused")drawOverlay(ctx,aim,elapsed);
 updateHud();requestAnimationFrame(tick);
}
function aimFromPointer(event){
 const bounds=canvas.getBoundingClientRect();
 aim.x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
 aim.y=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
}
canvas.addEventListener("pointermove",aimFromPointer);
canvas.addEventListener("pointerdown",event=>{if(event.button!==0)return;aimFromPointer(event);fire();});
document.addEventListener("keydown",event=>{
 if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
 const active=document.activeElement?.tagName;
 if(active==="BUTTON"&&(event.code==="Space"||event.code==="Enter"))return;
 if(event.code==="KeyR"){event.preventDefault();reload();}
 if(event.code==="Space"){event.preventDefault();fire();}
 if(event.code==="Escape"){event.preventDefault();togglePause();}
});
el("play").addEventListener("click",()=>{if(game.phase==="paused")game.resume();else game.start();canvas.focus();});
el("fire").addEventListener("click",()=>fire());
el("reload").addEventListener("click",reload);
el("pause").addEventListener("click",togglePause);
el("sound").addEventListener("click",()=>{sound=!sound;el("sound").textContent=sound?"SOUND ON":"SOUND OFF";el("sound").setAttribute("aria-pressed",String(sound));if(sound)beep(420);});
el("receipt").addEventListener("click",()=>downloadReceipt(createReceipt(game)));
document.addEventListener("visibilitychange",()=>{if(document.hidden)game.pause();});
requestAnimationFrame(tick);
