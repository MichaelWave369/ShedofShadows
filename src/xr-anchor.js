// A Quest gallery belongs in front of the viewer, not room origin.
// Keep vertical position relative to local-floor tracking.
export function headsetYaw(q){
 if(!q)return 0;
 const {x,y,z,w}=q;
 if(![x,y,z,w].every(Number.isFinite))return 0;
 const fx=-2*(x*z+w*y);
 const fz=-(1-2*(x*x+y*y));
 return Math.atan2(-fx,-fz);
}
export function playerAnchor(pose){
 if(!pose?.transform?.position)return null;
 const {position,orientation}=pose.transform;
 if(![position.x,position.z].every(Number.isFinite))return null;
 const yaw=headsetYaw(orientation);
 return {
  position:{x:position.x,y:0,z:position.z},
  orientation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}
 };
}
