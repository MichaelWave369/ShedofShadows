// DOM-free WebXR coordinate conversion. World units are meters.
// The gallery is anchored in front of the player's initial head position.
export const GALLERY_Z = -3.8;
export const GALLERY_WIDTH = 3.6;
export const GALLERY_HEIGHT = 2.2;

export function worldPoint(x,y,eyeHeight=0,z=GALLERY_Z){
 return [(x-.5)*GALLERY_WIDTH, eyeHeight+(.5-y)*GALLERY_HEIGHT,z];
}

export function normalizedPoint(worldX,worldY,eyeHeight=0){
 return {x:worldX/GALLERY_WIDTH+.5,y:.5-(worldY-eyeHeight)/GALLERY_HEIGHT};
}

export function rayPlaneHit(matrix,eyeHeight=0,z=GALLERY_Z){
 if(!matrix||matrix.length!==16)return null;
 const [ox,oy,oz]=[matrix[12],matrix[13],matrix[14]];
 // WebXR targetRaySpace pose has forward along negative local Z.
 const [dx,dy,dz]=[-matrix[8],-matrix[9],-matrix[10]];
 if(![ox,oy,oz,dx,dy,dz].every(Number.isFinite)||Math.abs(dz)<1e-5)return null;
 const t=(z-oz)/dz;
 if(!(t>0))return null;
 const wx=ox+dx*t,wy=oy+dy*t;
 const {x,y}=normalizedPoint(wx,wy,eyeHeight);
 return {x,y,world:[wx,wy,z],distance:t};
}
