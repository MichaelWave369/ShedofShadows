import test from "node:test";
import assert from "node:assert/strict";
import {GALLERY_Z,worldPoint,normalizedPoint,rayPlaneHit} from "../src/xr-math.js";

test("normalized to world-space target positions round trip",()=>{
 for(const x of [.1,.3,.5,.9])for(const y of [.1,.6,.9]){
  const [wx,wy]=worldPoint(x,y,1.65);
  const actual=normalizedPoint(wx,wy,1.65);
  assert.ok(Math.abs(actual.x-x)<1e-9);
  assert.ok(Math.abs(actual.y-y)<1e-9);
 }
});
test("straight-ahead target ray meets centered gallery at eye height",()=>{
 const m=[1,0,0,0,0,1,0,0,0,0,1,0,0,1.6,0,1];
 const hit=rayPlaneHit(m,1.6);
 assert.ok(hit);
 assert.equal(hit.world[2],GALLERY_Z);
 assert.equal(hit.x,.5);
 assert.equal(hit.y,.5);
});
test("parallel rays and backward rays do not falsely hit",()=>{
 const parallel=[1,0,0,0,0,0,-1,0,0,1,0,0,0,1.6,0,1];
 assert.equal(rayPlaneHit(parallel,1.6),null);
 const backwards=[-1,0,0,0,0,1,0,0,0,0,-1,0,0,1.6,0,1];
 assert.equal(rayPlaneHit(backwards,1.6),null);
 assert.equal(rayPlaneHit(null),null);
});
test("controller pointing slightly off-center maps consistently",()=>{
 const m=[1,0,0,0,0,1,0,0,0,0,1,0,.36,1.5,.1,1];
 const hit=rayPlaneHit(m,1.5);
 assert.ok(hit.x>.5);
 assert.equal(hit.y,.5);
});
