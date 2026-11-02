import test from "node:test";
import assert from "node:assert/strict";
import {headsetYaw,playerAnchor} from "../src/xr-anchor.js";

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,String(a)+" != "+String(b));
test("neutral orientation gives zero heading",()=>{
 close(headsetYaw({x:0,y:0,z:0,w:1}),0);
});
test("right and left yaw are preserved",()=>{
 const q=(angle)=>({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});
 close(headsetYaw(q(Math.PI/2)),Math.PI/2);
 close(headsetYaw(q(-Math.PI/2)),-Math.PI/2);
});
test("pitch does not distort intended horizontal heading",()=>{
 const yaw=Math.PI/4,pitch=Math.PI/6;
 const q={
  x:Math.sin(pitch/2)*Math.cos(yaw/2),
  y:Math.cos(pitch/2)*Math.sin(yaw/2),
  z:-Math.sin(pitch/2)*Math.sin(yaw/2),
  w:Math.cos(pitch/2)*Math.cos(yaw/2)
 };
 close(headsetYaw(q),yaw);
});
test("head origin is recentered in X and Z but eye height remains tracked",()=>{
 const pose={transform:{position:{x:1.25,y:1.68,z:-2},orientation:{x:0,y:0,z:0,w:1}}};
 const anchor=playerAnchor(pose);
 assert.deepEqual(anchor.position,{x:1.25,y:0,z:-2});
 assert.deepEqual(anchor.orientation,{x:0,y:0,z:0,w:1});
});
test("bad poses do not create an anchor",()=>{
 assert.equal(playerAnchor(null),null);
 assert.equal(playerAnchor({transform:{position:{x:NaN,z:2},orientation:null}}),null);
 close(headsetYaw(null),0);
});
