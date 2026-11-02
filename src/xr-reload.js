// Physical-style opt-in reload: hold grip, point muzzle downward for
// >= 0.2 seconds, raise it while still gripping. B/Y and completed squeeze
// remain accessible fallbacks. No body/hand pose inference is required.
export function muzzleY(matrix){
 if(!matrix||matrix.length!==16||!Number.isFinite(matrix[9]))return null;
 // XR controller -Z is the targeting/muzzle direction.
 return -matrix[9];
}
export function makeTiltReload(){
 const byHand=new Map();
 function update(hand,pressed,directionY,dt){
  if(hand!=="left"&&hand!=="right")return false;
  let s=byHand.get(hand);
  if(!s){s={pressed:false,downTime:0,armed:false,completed:false};byHand.set(hand,s);}
  if(!pressed){s.pressed=false;s.downTime=0;s.armed=false;return false;}
  if(!s.pressed){s.pressed=true;s.downTime=0;s.armed=false;s.completed=false;}
  if(s.completed||!Number.isFinite(directionY))return false;
  if(directionY<=-.53){
   s.downTime+=Math.min(.1,Math.max(0,dt));
   if(s.downTime>=.20)s.armed=true;
  }else if(directionY>=-.12){
   if(s.armed){s.completed=true;s.armed=false;return true;}
   s.downTime=0;
  }
  return false;
 }
 function consumeSqueeze(hand){
  const s=byHand.get(hand);
  if(!s)return false;
  const completed=s.completed;
  s.completed=false;s.armed=false;s.downTime=0;s.pressed=false;
  return completed;
 }
 return {update,consumeSqueeze,reset(){byHand.clear();}};
}
