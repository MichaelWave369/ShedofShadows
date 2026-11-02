// Export-only, player-editable souvenir. Not a BLACKOUT save importer.
export const CONTRACT_ID="blackout-sidecar-receipt";
export const CONTRACT_VERSION=1;
export function createReceipt(game){
 if(game.phase!=="won")return null;
 return {
  contract:CONTRACT_ID,version:CONTRACT_VERSION,source:"shed-of-shadows",
  target:"blackout",kind:"local-narrative-receipt",verified:false,
  completedCampaign:"night-shift",score:game.score,hits:game.hits,shots:game.shots,
  evidence:[{id:"sos.sealed-hold.k-marked-ledger",label:"K-marked ledger fragment",provenance:"Shed of Shadows: Sealed Hold"}],
  disclaimer:"Narrative souvenir only. Not imported into BLACKOUT."
 };
}
export function downloadReceipt(receipt){
 if(!receipt)return false;
 const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="shed-of-shadows-case-receipt.json";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),0);return true;
}
