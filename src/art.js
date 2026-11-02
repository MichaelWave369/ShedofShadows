// Original generative Canvas artwork, independent of game-state rules.
const W=960,H=540;
function fill(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(ctx,x,y,ex,ey,color,width=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function crate(ctx,x,y,w,h){fill(ctx,x,y,w,h,"#131b22");fill(ctx,x+5,y+5,w-10,h-10,"#3c4448");line(ctx,x,y,x+w,y+h,"#101820",5);line(ctx,x+w,y,x,y+h,"#101820",5);}
export function drawScene(ctx,stage,time){
 const sky=["#142937","#18232d","#221e2c"][stage];
 const fog=["#3a565d","#51504e","#51454e"][stage];
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,sky);g.addColorStop(.8,fog);g.addColorStop(1,"#121821");
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.globalAlpha=.24;ctx.fillStyle="#e8d1aa";ctx.beginPath();ctx.arc(800,95,44,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(let i=0;i<13;i++){
  const x=i*91-16,h=110+(i*57%130);
  fill(ctx,x,355-h,84,h+80,i%3?"#172631":"#24343e");
  for(let j=0;j<4;j++)fill(ctx,x+13+(j%2)*33,373-h+Math.floor(j/2)*50,11,17,"#c69f73");
 }
 fill(ctx,0,365,W,175,"#1b2429");
 for(let y=380;y<H;y+=Math.max(14,(y-350)*.27))line(ctx,0,y,W,y,"#323940",1);
 for(let x=-50;x<W+50;x+=110)line(ctx,480,360,x,H,"#3d4241",1);
 if(stage===0){
  fill(ctx,65,139,320,234,"#2b3940");fill(ctx,101,193,240,169,"#0e1a24");
  fill(ctx,436,100,394,277,"#26343a");fill(ctx,498,160,270,207,"#101a23");
  fill(ctx,62,135,768,16,"#111c23");
  for(let i=0;i<6;i++)crate(ctx,31+i*150,362-(i%2)*27,116,85);
  line(ctx,20,75,945,75,"#131c25",7);
  for(let x=70;x<W;x+=142)line(ctx,x,74,x,363,"#1b272c",3);
 }else if(stage===1){
  fill(ctx,68,62,824,329,"#2b353a");fill(ctx,114,106,728,262,"#111923");
  for(let x=127;x<835;x+=138){
   fill(ctx,x,98,19,296,"#374048");fill(ctx,x+33,129,54,75,"#97806a");
   line(ctx,x+18,258,x+128,170,"#5b5e5c",5);
  }
  for(let i=0;i<6;i++)crate(ctx,48+i*160,350+(i%2)*19,126,97);
 }else{
  fill(ctx,94,65,772,352,"#363940");fill(ctx,131,91,698,321,"#191f28");
  for(let x=151;x<835;x+=139){fill(ctx,x,111,15,303,"#46474c");line(ctx,x,111,x+88,415,"#333943",5);}
  fill(ctx,360,134,251,263,"#283038");fill(ctx,375,151,221,240,"#0b141c");
  ctx.font="bold 80px Georgia";ctx.fillStyle="#89503c";ctx.textAlign="center";ctx.fillText("K",488,289);
  for(let i=0;i<3;i++)crate(ctx,52+i*318,388,145,91);
 }
 for(let i=0;i<120;i++){
  const x=(i*73+time*(60+i%7*13))%1020-20;
  const y=(i*137+time*(155+i%5*25))%560-20;
  line(ctx,x,y,x-4,y+13,"#8297a0",.75);
 }
 const v=ctx.createRadialGradient(480,260,90,480,260,600);
 v.addColorStop(0,"#00000000");v.addColorStop(1,"#000000d6");
 ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}
export function drawEnemies(ctx,enemies){
 for(const e of enemies){
  const x=e.x*W,y=e.y*H,r=e.radius*W,urgent=e.age/e.attackTime>.72;
  ctx.save();ctx.shadowColor=urgent?"#e34b3a":"#05090d";ctx.shadowBlur=urgent?23:11;
  ctx.fillStyle=e.type==="warden"?"#39292d":"#0b1118";
  ctx.beginPath();ctx.ellipse(x,y+r*.28,r*.7,r*.95,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x,y-r*.4,r*.35,0,Math.PI*2);ctx.fill();
  fill(ctx,x-r*.56,y-r*.8,r*1.12,r*.15,"#11151b");
  fill(ctx,x-r*.33,y-r*1.1,r*.66,r*.35,"#171a20");
  ctx.shadowColor="#ee593e";ctx.shadowBlur=12;
  fill(ctx,x-r*.22,y-r*.43,r*.14,r*.08,"#eb684d");
  fill(ctx,x+r*.08,y-r*.43,r*.14,r*.08,"#eb684d");
  ctx.shadowBlur=0;ctx.strokeStyle=urgent?"#fa694c":"#b7a28b";ctx.lineWidth=urgent?3:1;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  fill(ctx,x-r,y+r*1.13,r*2,5,"#0d1017");
  fill(ctx,x-r,y+r*1.13,r*2*Math.max(0,1-e.age/e.attackTime),5,urgent?"#ed6552":"#d7b28a");
  if(e.maxHp>1)fill(ctx,x-r,y+r*1.26,r*2*e.hp/e.maxHp,3,"#e6c399");
  ctx.restore();
 }
}
export function drawOverlay(ctx,aim,time){
 const x=aim.x*W,y=aim.y*H;
 ctx.strokeStyle="#f8d5a1";ctx.lineWidth=1.7;
 ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.stroke();
 for(const [dx,dy] of [[-28,0],[28,0],[0,-28],[0,28]])line(ctx,x+dx*.62,y+dy*.62,x+dx,y+dy,"#f8d5a1",2);
 ctx.fillStyle="#05080c28";for(let i=0;i<H;i+=5)ctx.fillRect(0,i,W,1);
 fill(ctx,Math.floor(time*17)%19,0,1,H,"#ffffff15");
 ctx.fillStyle="#cdbda5";ctx.font="12px monospace";ctx.textAlign="left";
 ctx.fillText("SOUTH BRANCH // NIGHT SHIFT // 1947",22,30);
}
