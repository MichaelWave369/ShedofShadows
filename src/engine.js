// A DOM-free, seeded arcade game engine. All positions are normalized 0..1.
// Future WebXR adapters can call shoot(x,y) without changing combat rules.
export const STAGES = Object.freeze([
 {id:"dock",name:"DOCK GATE",subtitle:"The watchman's lantern still burns. The shadows move alone.",waves:[3,4],cadence:1.25},
 {id:"freight",name:"FREIGHT HALL",subtitle:"Something walks between the sealed freight crates.",waves:[4,5],cadence:1.08},
 {id:"hold",name:"SEALED HOLD",subtitle:"The last container bears a black K. Whatever is inside wants out.",waves:[5,6],cadence:.95}
]);
export const AMMO_CAP=6, MAX_HEALTH=6;
export const TOTAL_WAVES=STAGES.reduce((n,s)=>n+s.waves.length,0);

export class NightShift {
 constructor(seed=369){this.seed=seed>>>0;this.reset();}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 reset(){this.phase="title";this.stage=0;this.wave=0;this.score=0;this.combo=0;this.health=MAX_HEALTH;this.ammo=AMMO_CAP;this.reloadTime=0;this.enemies=[];this.toSpawn=0;this.spawnTimer=0;this.transition=0;this.nextId=1;this.shots=0;this.hits=0;this.notice="The warehouse is breathing.";}
 start(){this.reset();this.phase="playing";this.openWave();this.notice="Night shift begun. Shoot the shadows.";}
 openWave(){this.enemies=[];this.toSpawn=STAGES[this.stage].waves[this.wave];this.spawnTimer=.45;}
 pause(){if(this.phase==="playing"){this.phase="paused";this.notice="Night shift paused.";}}
 resume(){if(this.phase==="paused"){this.phase="playing";this.notice="Watch the shadows.";}}
 reload(){
  if(this.phase!=="playing"||this.transition>0||this.reloadTime>0||this.ammo===AMMO_CAP)return false;
  this.reloadTime=.95;this.notice="Reloading revolver...";return true;
 }
 spawn(){
  const boss=this.stage===2&&this.wave===1&&this.toSpawn===1;
  const heavy=!boss&&this.stage>0&&this.random()<.27;
  const runner=!boss&&!heavy&&this.random()<.35;
  const type=boss?"warden":heavy?"heavy":runner?"runner":"shadow";
  const hp=boss?5:heavy?2:1;
  this.enemies.push({
   id:this.nextId++,type,hp,maxHp:hp,
   x:.14+this.random()*.72,y:.4+this.random()*.29,
   radius:boss?.085:heavy?.06:runner?.044:.052,
   age:0,attackTime:boss?7.5:runner?3.7:heavy?7.0:5.8
  });
 }
 shoot(x,y){
  if(this.phase!=="playing"||this.transition>0)return {kind:"blocked"};
  if(this.reloadTime>0||this.ammo<1){this.notice="Empty cylinder. Reload!";return {kind:"empty"};}
  this.ammo--;this.shots++;
  let target=null,closest=Infinity;
  for(const enemy of this.enemies){
   const distance=Math.hypot(x-enemy.x,y-enemy.y);
   if(distance<enemy.radius&&distance<closest){target=enemy;closest=distance;}
  }
  if(!target){this.combo=0;this.notice="Shot missed.";return {kind:"miss"};}
  this.hits++;this.combo++;
  const headshot=Math.abs(x-target.x)<target.radius*.42&&Math.abs(y-(target.y-target.radius*.4))<target.radius*.24;
  target.hp-=headshot?2:1;
  const killed=target.hp<=0;
  this.score+=(headshot?150:75)+Math.min(this.combo,12)*10+(killed?50:0);
  this.notice=killed?(headshot?"HEADSHOT! Shadow down.":"Shadow down!"):"Hit confirmed.";
  if(killed)this.enemies=this.enemies.filter(e=>e!==target);
  return {kind:"hit",headshot,killed,type:target.type};
 }
 update(seconds){
  if(this.phase!=="playing")return;
  const dt=Math.max(0,Math.min(seconds,.1));
  if(this.reloadTime>0){
   this.reloadTime=Math.max(0,this.reloadTime-dt);
   if(this.reloadTime===0){this.ammo=AMMO_CAP;this.notice="Cylinder loaded.";}
  }
  if(this.transition>0){
   this.transition=Math.max(0,this.transition-dt);
   if(this.transition===0)this.openWave();
   return;
  }
  if(this.toSpawn>0){
   this.spawnTimer-=dt;
   if(this.spawnTimer<=0){this.spawn();this.toSpawn--;this.spawnTimer=STAGES[this.stage].cadence;}
  }
  for(const e of [...this.enemies]){
   e.age+=dt;
   if(e.age>=e.attackTime){
    this.health--;this.combo=0;this.notice="The shadows hit back!";
    this.enemies=this.enemies.filter(other=>other!==e);
    if(this.health<=0){this.health=0;this.phase="lost";this.notice="Night shift lost.";return;}
   }
  }
  if(this.toSpawn===0&&this.enemies.length===0){
   if(this.wave<STAGES[this.stage].waves.length-1){this.wave++;this.transition=1.5;this.notice="Wave cleared. Shadows incoming.";}
   else if(this.stage<STAGES.length-1){
    this.stage++;this.wave=0;this.transition=2.3;
    this.health=Math.min(MAX_HEALTH,this.health+1);this.notice="Area secured. Moving deeper into the docks.";
   }else{
    this.phase="won";this.score+=this.health*200;this.notice="You survived. Evidence recovered.";
   }
  }
 }
 waveNumber(){return STAGES.slice(0,this.stage).reduce((n,s)=>n+s.waves.length,0)+this.wave+1;}
}
