import test from "node:test";
import assert from "node:assert/strict";
import {makeXRButtonTracker} from "../src/xr-controls.js";

function source(hand="right",mapping="xr-standard"){
 const buttons=Array.from({length:6},()=>({pressed:false}));
 return {handedness:hand,gamepad:{mapping,buttons}};
}
test("B/Y press reloads only once while held",()=>{
 const t=makeXRButtonTracker(),right=source();
 assert.deepEqual(t.update([right]),[]);
 right.gamepad.buttons[5].pressed=true;
 assert.deepEqual(t.update([right]),[{kind:"reload",hand:"right"}]);
 assert.deepEqual(t.update([right]),[]);
 right.gamepad.buttons[5].pressed=false;t.update([right]);
 right.gamepad.buttons[5].pressed=true;
 assert.deepEqual(t.update([right]),[{kind:"reload",hand:"right"}]);
});
test("grip is a reload fallback and A/X recenters",()=>{
 const t=makeXRButtonTracker(),left=source("left");
 left.gamepad.buttons[1].pressed=true;
 left.gamepad.buttons[4].pressed=true;
 assert.deepEqual(t.update([left]),[
  {kind:"reload",hand:"left"},
  {kind:"recenter",hand:"left"}
 ]);
 assert.deepEqual(t.update([left]),[]);
});
test("one action is emitted for simultaneously pressed grip and B/Y",()=>{
 const t=makeXRButtonTracker(),right=source();
 right.gamepad.buttons[1].pressed=true;
 right.gamepad.buttons[5].pressed=true;
 assert.deepEqual(t.update([right]),[{kind:"reload",hand:"right"}]);
});
test("both hands are tracked independently and removal resets edge state",()=>{
 const t=makeXRButtonTracker(),left=source("left"),right=source("right");
 left.gamepad.buttons[5].pressed=true;
 right.gamepad.buttons[4].pressed=true;
 assert.deepEqual(t.update([left,right]),[
  {kind:"reload",hand:"left"},
  {kind:"recenter",hand:"right"}
 ]);
 t.update([]);
 assert.deepEqual(t.update([left]),[{kind:"reload",hand:"left"}]);
});
test("ignore generic gamepads, missing gamepads and standard trigger button",()=>{
 const t=makeXRButtonTracker(),invalid=source("unknown","standard"),right=source();
 right.gamepad.buttons[0].pressed=true;
 assert.deepEqual(t.update([right,invalid,{},null]),[]);
 assert.deepEqual(t.update([invalid]),[]);
 t.reset();
 assert.deepEqual(t.update([right]),[]);
});
