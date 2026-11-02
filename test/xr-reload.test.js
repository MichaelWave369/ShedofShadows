import test from "node:test";
import assert from "node:assert/strict";
import {muzzleY,makeTiltReload} from "../src/xr-reload.js";

test("muzzle direction matches WebXR -Z orientation",()=>{
 const m=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 assert.equal(muzzleY(m),0);
 m[9]=1;assert.equal(muzzleY(m),-1);
 assert.equal(muzzleY(null),null);
});
test("downward grip hold then raise fires exactly one reload",()=>{
 const g=makeTiltReload();
 assert.equal(g.update("left",true,-.8,.1),false);
 assert.equal(g.update("left",true,-.8,.1),false);
 assert.equal(g.update("left",true,-.8,.1),false);
 assert.equal(g.update("left",true,.1,.04),true);
 assert.equal(g.update("left",true,.1,.04),false);
 assert.equal(g.consumeSqueeze("left"),true);
 assert.equal(g.consumeSqueeze("left"),false);
});
test("no false reload during aiming, quick flick, or untracked tilt",()=>{
 const g=makeTiltReload();
 assert.equal(g.update("right",true,-.8,.05),false);
 assert.equal(g.update("right",true,.1,.05),false);
 assert.equal(g.update("right",true,null,.1),false);
 assert.equal(g.consumeSqueeze("right"),false);
});
test("both hands remain isolated, and reset clears gestures",()=>{
 const g=makeTiltReload();
 g.update("left",true,-.9,.1);g.update("left",true,-.9,.1);
 assert.equal(g.update("right",true,.1,.1),false);
 assert.equal(g.update("left",true,0,.1),true);
 assert.equal(g.consumeSqueeze("right"),false);
 g.reset();
 assert.equal(g.consumeSqueeze("left"),false);
});
test("gesture re-arms on new grip press only",()=>{
 const g=makeTiltReload();
 g.update("left",true,-.7,.1);g.update("left",true,-.7,.1);
 assert.equal(g.update("left",true,0,.1),true);
 g.update("left",false,0,.1);
 g.update("left",true,-.7,.1);g.update("left",true,-.7,.1);
 assert.equal(g.update("left",true,0,.1),true);
});
