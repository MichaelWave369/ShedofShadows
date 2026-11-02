import test from "node:test";
import assert from "node:assert/strict";
import { NightShift, STAGES, MAX_HEALTH, AMMO_CAP, TOTAL_WAVES } from "../src/engine.js";
import { createReceipt, CONTRACT_VERSION } from "../src/sidecar.js";

test("the full six-wave campaign advances and can restart",()=>{
 const g=new NightShift();g.start();
 assert.equal(TOTAL_WAVES,6);
 for(let i=0;i<TOTAL_WAVES;i++){
  g.toSpawn=0;g.enemies=[];g.transition=0;g.update(.01);
  if(i<TOTAL_WAVES-1)assert.ok(g.transition>0);
 }
 assert.equal(g.phase,"won");assert.ok(g.score>0);
 g.start();assert.equal(g.phase,"playing");assert.equal(g.health,MAX_HEALTH);assert.equal(g.ammo,AMMO_CAP);
});
test("shot, miss, timed reload and empty chamber",()=>{
 const g=new NightShift(1);g.start();
 g.enemies=[{id:1,type:"shadow",x:.5,y:.5,radius:.07,hp:1,maxHp:1,age:0,attackTime:9}];
 assert.equal(g.shoot(.5,.5).kind,"hit");assert.equal(g.ammo,5);assert.equal(g.enemies.length,0);
 assert.equal(g.shoot(.01,.01).kind,"miss");assert.equal(g.combo,0);
 assert.equal(g.reload(),true);assert.equal(g.shoot(.5,.5).kind,"empty");
 for(let i=0;i<11;i++)g.update(.1);
 assert.equal(g.ammo,AMMO_CAP);
});
test("headshot applies extra damage and bonus points",()=>{
 const g=new NightShift();g.start();
 g.enemies=[{id:2,type:"heavy",x:.5,y:.5,radius:.08,hp:2,maxHp:2,age:0,attackTime:7}];
 const r=g.shoot(.5,.5-.08*.4);
 assert.equal(r.headshot,true);assert.equal(r.killed,true);assert.ok(g.score>=200);
});
test("the world freezes while paused and enemies attack after countdown",()=>{
 const g=new NightShift();g.start();
 g.toSpawn=0;g.enemies=[{id:1,type:"runner",x:.5,y:.5,radius:.05,hp:1,maxHp:1,age:0,attackTime:.1}];
 g.pause();g.update(.1);assert.equal(g.health,MAX_HEALTH);
 g.resume();g.update(.1);assert.equal(g.health,MAX_HEALTH-1);
});
test("seeded spawns are deterministic and final encounter is the Warden",()=>{
 const a=new NightShift(33),b=new NightShift(33);a.start();b.start();a.spawn();b.spawn();
 assert.deepEqual(a.enemies,b.enemies);
 a.stage=STAGES.length-1;a.wave=1;a.toSpawn=1;a.spawn();
 assert.equal(a.enemies.at(-1).type,"warden");
});
test("receipt is available only on victory and is expressly unverified",()=>{
 const g=new NightShift();g.start();assert.equal(createReceipt(g),null);
 g.phase="won";const receipt=createReceipt(g);
 assert.equal(receipt.version,CONTRACT_VERSION);assert.equal(receipt.verified,false);
 assert.equal(receipt.evidence[0].id,"sos.sealed-hold.k-marked-ledger");
});
