// XR-standard Gamepad fallback controls, separated from the renderer.
// WebXR select remains the single firing path. We do NOT also fire from
// Gamepad trigger polling, which could cause accidental double-shots.
// Button 1 = squeeze/grip; button 5 = B/Y; button 4 = A/X.
// Events and fallback polling may both report grip, but NightShift.reload()
// already debounces reload while the cylinder is being refilled.
export function makeXRButtonTracker(){
 const states=new Map();
 function update(inputSources){
  const actions=[];
  const seen=new Set();
  for(const source of inputSources || []){
   if(!source || !source.gamepad || source.gamepad.mapping!=="xr-standard")continue;
   seen.add(source);
   const buttons=source.gamepad.buttons||[];
   const next={
    grip:Boolean(buttons[1]?.pressed),
    auxiliary:Boolean(buttons[5]?.pressed),
    recenter:Boolean(buttons[4]?.pressed)
   };
   const old=states.get(source)||{grip:false,auxiliary:false,recenter:false};
   if((next.grip&&!old.grip)||(next.auxiliary&&!old.auxiliary)){
    actions.push({kind:"reload",hand:source.handedness||"unknown"});
   }
   if(next.recenter&&!old.recenter){
    actions.push({kind:"recenter",hand:source.handedness||"unknown"});
   }
   states.set(source,next);
  }
  for(const key of states.keys())if(!seen.has(key))states.delete(key);
  return actions;
 }
 return {update,reset(){states.clear();}};
}
