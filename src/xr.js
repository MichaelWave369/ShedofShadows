import {GALLERY_Z,worldPoint,rayPlaneHit} from "./xr-math.js";
import {playerAnchor} from "./xr-anchor.js";
import {makeXRButtonTracker} from "./xr-controls.js";
import {makeTiltReload,muzzleY} from "./xr-reload.js";

// WebGL1 stereo arcade gallery. The 2D Canvas is not an XR layer.
function compile(gl,type,source){
 const s=gl.createShader(type);
 gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
  const err=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error("XR shader: "+err);
 }
 return s;
}
function makeProgram(gl,vertex,fragment){
 const v=compile(gl,gl.VERTEX_SHADER,vertex),f=compile(gl,gl.FRAGMENT_SHADER,fragment);
 const p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
 gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error("XR program: "+gl.getProgramInfoLog(p));
 return p;
}
const COLOR_VS="attribute vec3 aPosition;attribute vec3 aColor;uniform mat4 uProjection;uniform mat4 uView;varying vec3 vColor;void main(){vColor=aColor;gl_Position=uProjection*uView*vec4(aPosition,1.0);}";
const COLOR_FS="precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}";
const TEXT_VS="attribute vec3 aPosition;attribute vec2 aUv;uniform mat4 uProjection;uniform mat4 uView;varying vec2 vUv;void main(){vUv=aUv;gl_Position=uProjection*uView*vec4(aPosition,1.0);}";
const TEXT_FS="precision mediump float;uniform sampler2D uTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTexture,vUv);}";
class Geometry {
 constructor(){this.tri=[];this.lines=[];}
 vertex(out,p,c){out.push(p[0],p[1],p[2],c[0],c[1],c[2]);}
 quad(a,b,c,d,color){for(const p of [a,b,c,a,c,d])this.vertex(this.tri,p,color);}
 xy(x1,y1,x2,y2,z,color){this.quad([x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z],color);}
 line(a,b,c){this.vertex(this.lines,a,c);this.vertex(this.lines,b,c);}
 ellipse(x,y,z,rx,ry,c){
  for(let i=0;i<16;i++){
   const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
   for(const p of [[x,y,z],[x+Math.cos(a)*rx,y+Math.sin(a)*ry,z],[x+Math.cos(b)*rx,y+Math.sin(b)*ry,z]])this.vertex(this.tri,p,c);
  }
 }
 ring(x,y,z,rx,ry,c){
  for(let i=0;i<24;i++){
   const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
   this.line([x+Math.cos(a)*rx,y+Math.sin(a)*ry,z],[x+Math.cos(b)*rx,y+Math.sin(b)*ry,z],c);
  }
 }
}
const C={
 wall:[.07,.13,.17],floor:[.06,.08,.11],grid:[.16,.24,.27],iron:[.19,.23,.27],
 gold:[.72,.49,.31],window:[.50,.39,.28],wood:[.20,.20,.19],black:[.012,.027,.043],
 shadow:[.035,.04,.065],heavy:[.15,.115,.13],eye:[1,.24,.16],
 danger:[1,.32,.17],safe:[.56,.58,.49],beam:[.98,.70,.34],boss:[.20,.07,.12]
};
// A tiny original procedural revolver, built around the tracked target-ray
// transform. Barrel follows -Z, so aiming visuals and physics share a ray.
// Never override or move the player's tracked hands.
function weaponPoint(m,x,y,z){
 return [m[0]*x+m[4]*y+m[8]*z+m[12],
         m[1]*x+m[5]*y+m[9]*z+m[13],
         m[2]*x+m[6]*y+m[10]*z+m[14]];
}
function addRevolver(g,m,hand,flash){
 if(hand!=="left"&&hand!=="right")return;
 const p=(x,y,z)=>weaponPoint(m,x,y,z);
 const finish=hand==="left"?[.42,.48,.59]:[.62,.43,.26];
 const dark=[.12,.13,.15],brass=[.75,.55,.32],grip=[.22,.13,.09];
 // Barrel, top rib, cylinder, angled wooden handle, sight and hammer.
 g.quad(p(-.036,-.025,-.24),p(.036,-.025,-.24),p(.036,.027,-.24),p(-.036,.027,-.24),finish);
 g.quad(p(-.036,-.025,-.07),p(.036,-.025,-.07),p(.036,.027,-.07),p(-.036,.027,-.07),finish);
 for(const x of [-.036,.036]){
  g.line(p(x,.027,-.07),p(x,.027,-.24),brass);
  g.line(p(x,-.025,-.07),p(x,-.025,-.24),dark);
 }
 g.ellipse(...p(0,0,-.067),.055,.047,brass);
 g.ellipse(...p(0,0,-.064),.034,.032,dark);
 g.quad(p(-.028,-.04,-.042),p(.028,-.04,-.042),p(.053,-.14,.085),p(-.045,-.14,.085),grip);
 g.line(p(-.02,.035,-.25),p(.02,.035,-.25),brass);
 g.line(p(-.025,.055,.015),p(.020,.055,.015),finish);
 if(flash>0){
  const mouth=p(0,0,-.26);
  const bright=[1,.72,.27];
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   g.line(mouth,p(Math.cos(angle)*.13,Math.sin(angle)*.13,-.34),bright);
  }
 }
}
function buildWorld(game,eye,controllers,flashes){
 const g=new Geometry(),s=game.stage;
 g.xy(-3,eye-1.6,3,eye+1.9,-4.65,s===2?[.12,.10,.15]:C.wall);
 g.quad([-3,eye-1.6,-2.4],[3,eye-1.6,-2.4],[3,eye-1.6,-5],[-3,eye-1.6,-5],C.floor);
 for(let i=0;i<9;i++){
  const x=-2.85+i*.70;g.line([x,eye-1.6,-2.5],[x,eye-1.6,-5.1],C.grid);
 }
 for(let i=0;i<5;i++){
  const z=-2.5-i*.52;g.line([-3,eye-1.597,z],[3,eye-1.597,z],C.grid);
 }
 for(let i=0;i<6;i++){
  const x=-2.9+i*1.15;
  g.xy(x,eye-.9,x+.12,eye+1.5,-4.55,C.iron);
  g.xy(x+.23,eye+.35,x+.72,eye+.89,-4.54,s===2?C.danger:C.window);
 }
 for(let i=0;i<5;i++){
  const x=-2.7+i*1.30;
  g.xy(x,eye-1.34,x+.63,eye-.53,-4.1,C.wood);
  g.line([x,eye-1.34,-4.08],[x+.63,eye-.53,-4.08],C.iron);
  g.line([x+.63,eye-1.34,-4.08],[x,eye-.53,-4.08],C.iron);
 }
 if(s===0){
  g.xy(-2.3,eye+.99,2.3,eye+1.12,-4.0,C.iron);
  g.xy(-2.1,eye-.85,-1.36,eye+.24,-4.03,C.black);
 }else if(s===1){
  g.xy(-2.55,eye+.8,2.55,eye+.94,-4.0,C.iron);
  g.xy(-.62,eye-.75,.62,eye+.51,-4.18,C.black);
 }else{
  g.xy(-1,eye-1.11,1,eye+.7,-4.18,C.black);
  g.xy(-1,eye+.7,1,eye+.8,-4.17,C.danger);
  g.line([-1,eye-1.11,-4.1],[1,eye+.7,-4.1],C.iron);
 }
 for(const e of game.enemies){
  const [x,y]=worldPoint(e.x,e.y,eye);
  const rx=e.radius*3.6,ry=e.radius*2.2;
  const urgent=e.age/e.attackTime>.7;
  const body=e.type==="warden"?C.boss:e.type==="heavy"?C.heavy:C.shadow;
  g.ellipse(x,y-.018,GALLERY_Z+.025,rx*.68,ry*.70,body);
  g.ellipse(x,y+ry*.47,GALLERY_Z+.030,rx*.36,ry*.39,body);
  g.xy(x-rx*.50,y+ry*.68,x+rx*.50,y+ry*.84,GALLERY_Z+.035,C.black);
  g.xy(x-rx*.29,y+ry*.72,x+rx*.29,y+ry*1.00,GALLERY_Z+.034,C.black);
  g.xy(x-rx*.19,y+ry*.49,x-rx*.045,y+ry*.55,GALLERY_Z+.041,C.eye);
  g.xy(x+rx*.06,y+ry*.49,x+rx*.20,y+ry*.55,GALLERY_Z+.041,C.eye);
  g.ring(x,y,GALLERY_Z+.047,rx,ry,urgent?C.danger:C.safe);
  g.xy(x-rx,y-ry*1.35,x-rx+2*rx*e.hp/e.maxHp,y-ry*1.27,GALLERY_Z+.05,urgent?C.danger:C.gold);
 }
 for(const controller of controllers){
  const m=controller.pose.transform.matrix;
  const origin=[m[12],m[13],m[14]];
  const hit=rayPlaneHit(m,eye);
  const end=hit?.world??[origin[0]-m[8]*4,origin[1]-m[9]*4,origin[2]-m[10]*4];
  const color=controller.side==="left"?[.65,.71,.84]:C.beam;
  g.line(origin,end,color);
  addRevolver(g,m,controller.side,flashes[controller.side]||0);
  if(hit){
   g.ring(hit.world[0],hit.world[1],GALLERY_Z+.095,.055,.055,color);
   g.line([hit.world[0]-.10,hit.world[1],GALLERY_Z+.096],[hit.world[0]+.10,hit.world[1],GALLERY_Z+.096],color);
   g.line([hit.world[0],hit.world[1]-.10,GALLERY_Z+.096],[hit.world[0],hit.world[1]+.10,GALLERY_Z+.096],color);
  }
 }
 g.xy(-1.9,eye+.67,1.9,eye+1.18,-3.46,C.black);
 g.line([-1.9,eye+.67,-3.45],[1.9,eye+.67,-3.45],C.gold);
 return g;
}
function createRenderer(gl){
 const color=makeProgram(gl,COLOR_VS,COLOR_FS),txt=makeProgram(gl,TEXT_VS,TEXT_FS);
 const mesh=gl.createBuffer(),lines=gl.createBuffer(),textBuffer=gl.createBuffer(),texture=gl.createTexture();
 const hud=document.createElement("canvas");hud.width=1024;hud.height=192;
 const pen=hud.getContext("2d");
 const cp=gl.getAttribLocation(color,"aPosition"),cc=gl.getAttribLocation(color,"aColor");
 const cproj=gl.getUniformLocation(color,"uProjection"),cview=gl.getUniformLocation(color,"uView");
 const tp=gl.getAttribLocation(txt,"aPosition"),tu=gl.getAttribLocation(txt,"aUv");
 const tproj=gl.getUniformLocation(txt,"uProjection"),tview=gl.getUniformLocation(txt,"uView");
 const tsamp=gl.getUniformLocation(txt,"uTexture");
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 let lastHud="";
 function updateText(game,controllers,lastAction){
  const left=controllers.some(c=>c.side==="left");
  const right=controllers.some(c=>c.side==="right");
  const tracking="L:"+(left?"OK":"--")+" R:"+(right?"OK":"--");
  const hint=game.phase==="won"?"DAWN SURVIVED · TRIGGER TO REPLAY":game.phase==="lost"?"SHIFT LOST · TRIGGER TO REPLAY":game.phase==="paused"?"PAUSED · TRIGGER TO RESUME":"TRIGGER FIRE · SQUEEZE RELOAD · SYSTEM MENU EXIT";
  const key=[game.phase,game.score,game.health,game.dualEnabled,game.handAmmo.left,game.handAmmo.right,game.handReload.left>0,game.handReload.right>0,game.stage,game.wave,tracking,lastAction].join(":");
  if(key===lastHud)return;
  lastHud=key;
  pen.clearRect(0,0,1024,192);
  pen.fillStyle="#09121b";pen.fillRect(0,0,1024,192);
  pen.strokeStyle="#ac7958";pen.lineWidth=4;pen.strokeRect(3,3,1018,186);
  pen.fillStyle="#f2e3c8";pen.font="bold 44px Georgia,serif";pen.fillText("SHED OF SHADOWS",28,58);
  pen.font="24px monospace";pen.fillStyle="#aec5b7";pen.fillText(tracking,786,58);
  pen.font="bold 27px monospace";pen.fillStyle="#e9b58b";
  pen.fillText("L "+(game.handReload.left>0?"LOAD":game.handAmmo.left+"/6")+"  R "+(game.handReload.right>0?"LOAD":game.handAmmo.right+"/6")+"   LIFE "+game.health+"/6  SCORE "+game.score,30,114);
  pen.font="20px monospace";pen.fillStyle="#d5c9af";pen.fillText(hint,30,150);
  pen.font="15px monospace";pen.fillStyle="#c0d1c7";pen.fillText("LAST INPUT: "+lastAction,30,177);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,hud);
 }
 function upload(buffer,data){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);}
 function drawColor(buffer,count,mode,view){
  if(!count)return;
  gl.useProgram(color);
  gl.uniformMatrix4fv(cproj,false,view.projectionMatrix);
  gl.uniformMatrix4fv(cview,false,view.transform.inverse.matrix);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.enableVertexAttribArray(cp);gl.enableVertexAttribArray(cc);
  gl.vertexAttribPointer(cp,3,gl.FLOAT,false,24,0);
  gl.vertexAttribPointer(cc,3,gl.FLOAT,false,24,12);
  gl.drawArrays(mode,0,count);
 }
 function drawText(view,eye){
  const z=-3.43,x1=-1.85,x2=1.85,y1=eye+.69,y2=eye+1.16;
  upload(textBuffer,[x1,y1,z,0,0,x2,y1,z,1,0,x2,y2,z,1,1,x1,y1,z,0,0,x2,y2,z,1,1,x1,y2,z,0,1]);
  gl.useProgram(txt);
  gl.uniformMatrix4fv(tproj,false,view.projectionMatrix);
  gl.uniformMatrix4fv(tview,false,view.transform.inverse.matrix);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform1i(tsamp,0);
  gl.enableVertexAttribArray(tp);gl.enableVertexAttribArray(tu);
  gl.vertexAttribPointer(tp,3,gl.FLOAT,false,20,0);
  gl.vertexAttribPointer(tu,2,gl.FLOAT,false,20,12);
  gl.drawArrays(gl.TRIANGLES,0,6);
 }
 return {
  render(session,pose,frame,refSpace,eye,game,lastAction,flashes){
   const controllers=[];
   for(const source of session.inputSources){
    if(!source.targetRaySpace)continue;
    const p=frame.getPose(source.targetRaySpace,refSpace);
    if(p)controllers.push({pose:p,side:source.handedness});
   }
   const geometry=buildWorld(game,eye,controllers,flashes);
   upload(mesh,geometry.tri);upload(lines,geometry.lines);updateText(game,controllers,lastAction);
   const layer=session.renderState.baseLayer;
   gl.bindFramebuffer(gl.FRAMEBUFFER,layer.framebuffer);
   gl.enable(gl.DEPTH_TEST);gl.enable(gl.SCISSOR_TEST);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   for(const view of pose.views){
    const v=layer.getViewport(view);
    gl.viewport(v.x,v.y,v.width,v.height);gl.scissor(v.x,v.y,v.width,v.height);
    gl.clearColor(.018,.027,.042,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    drawColor(mesh,geometry.tri.length/6,gl.TRIANGLES,view);
    drawColor(lines,geometry.lines.length/6,gl.LINES,view);
    drawText(view,eye);
   }
   gl.disable(gl.SCISSOR_TEST);
  },
  dispose(){
   gl.deleteBuffer(mesh);gl.deleteBuffer(lines);gl.deleteBuffer(textBuffer);
   gl.deleteTexture(texture);gl.deleteProgram(color);gl.deleteProgram(txt);
  }
 };
}

// Runtime WebXR feature detection. No WebXR dependency in desktop mode.
export function createXRBridge({game,onFire,onReload,onState,onError}){
 let session=null,baseSpace=null,refSpace=null,eye=0,renderer=null,canvas=null,lastFrame=0,anchored=false;
 let supported=false,suspended=false;
 const buttons=makeXRButtonTracker();
 const tilt=makeTiltReload();
 const flashes={left:0,right:0};
 let lastAction="NONE";
 function clear(){
  session=null;baseSpace=null;refSpace=null;lastFrame=0;eye=0;anchored=false;
  buttons.reset();tilt.reset();flashes.left=0;flashes.right=0;lastAction="NONE";
  game.dualEnabled=false;
  renderer?.dispose();renderer=null;canvas?.remove();canvas=null;
  if(game.phase==="playing")game.pause();
  onState?.(false,supported);
 }
 async function checkSupport(){
  try{supported=Boolean(navigator.xr&&await navigator.xr.isSessionSupported("immersive-vr"));}
  catch{supported=false;}
  onState?.(Boolean(session),supported);
  return supported;
 }
 async function enter(){
  if(session)return;
  if(!navigator.xr)throw new Error("WebXR unavailable. Use Quest Browser on an HTTPS page.");
  // First await starts user-activated session immediately on a real button press.
  const current=await navigator.xr.requestSession("immersive-vr",{optionalFeatures:["local-floor"]});
  session=current;
  current.addEventListener("end",()=>{if(session===current)clear();});
  try{
   canvas=document.createElement("canvas");
   canvas.style.cssText="position:fixed;left:-10000px;top:0;width:1px;height:1px;pointer-events:none";
   document.body.appendChild(canvas);
   const gl=canvas.getContext("webgl",{xrCompatible:true,alpha:false,antialias:true});
   if(!gl)throw new Error("WebGL is unavailable.");
   if(gl.makeXRCompatible)await gl.makeXRCompatible();
   if(typeof XRWebGLLayer==="undefined")throw new Error("XRWebGLLayer unavailable.");
   current.updateRenderState({baseLayer:new XRWebGLLayer(current,gl)});
   try{baseSpace=await current.requestReferenceSpace("local-floor");}
   catch{baseSpace=await current.requestReferenceSpace("local");}
   refSpace=baseSpace;
   baseSpace.addEventListener?.("reset",()=>{
    // Quest system recenter should re-anchor the gallery on the next frame.
    refSpace=baseSpace;eye=0;anchored=false;lastFrame=0;
   });
   renderer=createRenderer(gl);
   current.addEventListener("select",event=>{
    if(!refSpace)return;
    if(game.phase==="won"||game.phase==="lost"){game.startDual();return;}
    if(game.phase==="paused"){game.resume();return;}
    let p;
    try{p=event.frame.getPose(event.inputSource.targetRaySpace,refSpace);}catch{return;}
    if(!p)return;
    const hit=rayPlaneHit(p.transform.matrix,eye);
    if(hit){
     const hand=event.inputSource.handedness;
     if(hand!=="left"&&hand!=="right")return;
     onFire(hit.x,hit.y,hand);flashes[hand]=6;
     lastAction=hand.toUpperCase()+" FIRE";
    }
   });
   current.addEventListener("squeeze",event=>{
    const hand=event.inputSource?.handedness;
    if(hand!=="left"&&hand!=="right")return;
    const alreadyUsed=tilt.consumeSqueeze(hand);
    if(game.phase==="playing"&&!alreadyUsed){
     onReload(hand);lastAction=hand.toUpperCase()+" GRIP RELOAD";
    }
   });
   current.addEventListener("visibilitychange",()=>{
    if(current.visibilityState==="hidden"&&game.phase==="playing"){game.pause();suspended=true;}
    else if(current.visibilityState==="visible"&&suspended){suspended=false;game.resume();}
   });
   game.startDual();onState?.(true,supported);
   const frameLoop=(time,frame)=>{
    if(session!==current)return;
    current.requestAnimationFrame(frameLoop);
    let pose=frame.getViewerPose(refSpace);
    if(!pose)return;
    if(!anchored){
     // Fixes a subtle but serious comfort bug: local-floor origin may be
     // meters away from the headset, or the player may face another wall.
     const anchor=playerAnchor(pose);
     if(anchor&&typeof XRRigidTransform!=="undefined"){
      try{refSpace=baseSpace.getOffsetReferenceSpace(new XRRigidTransform(anchor.position,anchor.orientation));}
      catch{refSpace=baseSpace;}
     }
     anchored=true;
     pose=frame.getViewerPose(refSpace);
     if(!pose)return;
    }
    if(eye===0)eye=pose.transform.position.y||.0001;
    const dt=lastFrame?Math.max(0,Math.min(.1,(time-lastFrame)/1000)):0;
    lastFrame=time;
    for(const action of buttons.update(current.inputSources)){
     if(action.kind==="reload"&&game.phase==="playing"){
      // Grip is handled by tilt gesture or the squeeze event. Only
      // the distinct B/Y button is an immediate reload fallback.
      const input=Array.from(current.inputSources).find(s=>s.handedness===action.hand);
      if(input?.gamepad?.buttons?.[5]?.pressed){
       onReload(action.hand);lastAction=action.hand.toUpperCase()+" B/Y RELOAD";
      }
     }else if(action.kind==="recenter"){
      // Re-anchor on next XR frame so it uses the new tracking origin.
      refSpace=baseSpace;anchored=false;eye=0;lastFrame=0;
      lastAction=action.hand.toUpperCase()+" RECENTER";
      return;
     }
    }
    for(const source of current.inputSources){
     const hand=source.handedness;
     if(hand!=="left"&&hand!=="right")continue;
     const gripping=Boolean(source.gamepad?.mapping==="xr-standard"&&source.gamepad?.buttons?.[1]?.pressed);
     const p=source.targetRaySpace?frame.getPose(source.targetRaySpace,refSpace):null;
     if(tilt.update(hand,gripping,muzzleY(p?.transform?.matrix),dt)&&game.phase==="playing"){
      onReload(hand);lastAction=hand.toUpperCase()+" TILT RELOAD";
     }
    }
    game.update(dt);
    renderer.render(current,pose,frame,refSpace,eye,game,lastAction,flashes);
    flashes.left=Math.max(0,flashes.left-1);
    flashes.right=Math.max(0,flashes.right-1);
   };
   current.requestAnimationFrame(frameLoop);
  }catch(error){
   try{await current.end();}catch{/* already ended */}
   if(session===current)clear();
   throw error;
  }
 }
 async function toggle(){
  if(session){try{await session.end();}catch(error){onError?.(error.message||"Unable to exit VR.");}return;}
  try{await enter();}catch(error){onError?.(error.message||"Unable to enter VR.");}
 }
 return {get active(){return Boolean(session);},get supported(){return supported;},checkSupport,toggle};
}
