import test from "node:test";
import assert from "node:assert/strict";
import {NightShift,AMMO_CAP} from "../src/engine.js";

test("dual mode is explicit, new game resets to classic single cylinder",()=>{
 const game=new NightShift();game.start();
 assert.equal(game.dualEnabled,false);
 assert.deepEqual(game.shootHand("left",.5,.5),{kind:"blocked"});
 game.enableDual();
 assert.equal(game.dualEnabled,true);
 assert.deepEqual(game.handAmmo,{left:AMMO_CAP,right:AMMO_CAP});
 game.start();
 assert.equal(game.dualEnabled,false);
 assert.equal(game.ammo,AMMO_CAP);
});
test("left and right each have six independent shots",()=>{
 const game=new NightShift();game.startDual();game.toSpawn=20;game.spawnTimer=10;
 for(let i=0;i<AMMO_CAP;i++)assert.equal(game.shootHand("left",.01,.01).kind,"miss");
 assert.equal(game.handAmmo.left,0);
 assert.equal(game.handAmmo.right,AMMO_CAP);
 assert.equal(game.shootHand("left",.01,.01).kind,"empty");
 assert.equal(game.shootHand("right",.01,.01).kind,"miss");
 assert.equal(game.handAmmo.right,AMMO_CAP-1);
 assert.equal(game.shots,AMMO_CAP+1);
});
test("hand reloads are independently timed and paused with the game",()=>{
 const game=new NightShift();game.startDual();game.toSpawn=20;game.spawnTimer=10;
 game.shootHand("left",.01,.01);game.shootHand("right",.01,.01);
 assert.equal(game.reloadHand("left"),true);
 assert.equal(game.reloadHand("left"),false);
 assert.equal(game.handReload.right,0);
 game.pause();game.update(.1);assert.equal(game.handReload.left,.95);
 game.resume();for(let i=0;i<11;i++)game.update(.1);
 assert.equal(game.handAmmo.left,AMMO_CAP);
 assert.equal(game.handAmmo.right,AMMO_CAP-1);
});
test("unrecognized hands, shot during reload and transitions are blocked",()=>{
 const game=new NightShift();game.startDual();game.toSpawn=20;game.spawnTimer=10;
 assert.equal(game.reloadHand("none"),false);
 assert.equal(game.shootHand("none",.5,.5).kind,"blocked");
 game.shootHand("left",.01,.01);
 assert.equal(game.reloadHand("left"),true);
 assert.equal(game.shootHand("left",.01,.01).kind,"empty");
 game.transition=1;
 assert.equal(game.shootHand("right",.01,.01).kind,"blocked");
 assert.equal(game.reloadHand("right"),false);
});
test("single-player desktop revolver behavior remains unchanged",()=>{
 const game=new NightShift();game.start();game.toSpawn=20;game.spawnTimer=10;
 game.shoot(.01,.01);assert.equal(game.ammo,AMMO_CAP-1);
 assert.equal(game.reload(),true);assert.equal(game.shoot(.01,.01).kind,"empty");
 for(let i=0;i<11;i++)game.update(.1);
 assert.equal(game.ammo,AMMO_CAP);
});
