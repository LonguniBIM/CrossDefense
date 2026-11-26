import './preRun.css';
import './combat.css';
import type {ContentPackManifest} from '../domain/content/contentPack';
import {RenderedCombatSurface} from './renderer/RenderedCombatSurface';
import {subtypeIcon} from './renderer/SubtypeIcon';
import type {CombatApplication} from '../application/combat/CombatApplication';
import type {BoardInput} from '../domain/preRun/board';
import type { SettingsAccess } from './SettingsView';
import { controlsText, GameplayKeyboard } from './GameplayInput';
import {MODULE_SUBTYPES} from '../domain/content/contentPack';
import {RESOURCE_SCALE} from '../domain/combat/rules';
import {renderCombatBoard} from './CombatBoardSurface';
const display=(value:number)=>(value/RESOURCE_SCALE).toFixed(2).replace(/\.?0+$/,'')||'0';

/** Minimal factual HUD. Ticket08 owns the separate 2.5D renderer. */
export function mountCombat(root:HTMLElement,app:CombatApplication,onReturn:()=>Promise<void>,renderPack?:ContentPackManifest,onResults?:()=>Promise<void>,settings?:SettingsAccess):()=>void{
  const controller=new AbortController(),signal=controller.signal;
  let visuals:RenderedCombatSurface|null=null;
  let live=true,frameId=0,last:number|null=null,busy=false,inputs:BoardInput[]=[];
  const keyboard=new GameplayKeyboard(input=>inputs.push(input),()=>pause('Paused by player.'));
  root.innerHTML=`<main class="cb-shell"><header class="cb-header"><div><span>DEVELOPMENT COMBAT</span><h1>Map combat</h1></div><div class="actions"><button data-testid="pause-combat" class="secondary">Pause</button><button data-testid="resume-combat" class="primary" hidden>Resume</button><button data-testid="retry-combat" class="primary" hidden>Retry save</button><button data-testid="abandon-combat" class="secondary">Abandon</button><button data-testid="combat-results" class="primary" hidden>View results</button><button data-testid="return-combat-build" class="primary" hidden>Return to Build</button></div></header>
    <div class="cb-layout"><section class="cb-panel cb-hud" aria-label="Deterministic combat HUD">
      <h2 data-testid="combat-map-name"></h2><p class="identity" data-testid="combat-attempt-id"></p>
      <div class="cb-resource-grid"><section><h3>Your ship</h3><label>Hull <strong data-testid="player-hull"></strong></label><progress data-testid="player-hull-bar"></progress><label>Shield <strong data-testid="player-shield"></strong></label><progress data-testid="player-shield-bar"></progress><small data-testid="player-shield-status"></small></section>
      <section><h3 data-testid="combat-enemy-name"></h3><label>Hull <strong data-testid="enemy-hull"></strong></label><progress data-testid="enemy-hull-bar"></progress><label>Shield <strong data-testid="enemy-shield"></strong></label><progress data-testid="enemy-shield-bar"></progress><small data-testid="enemy-shield-status"></small></section></div>
      <dl class="cb-facts"><dt>Threat</dt><dd data-testid="combat-threat"></dd><dt>Encounter remaining</dt><dd data-testid="combat-time"></dd><dt>Combat tick</dt><dd data-testid="combat-tick"></dd><dt>Board tick</dt><dd data-testid="board-tick"></dd></dl>
      <p class="cb-status" data-testid="combat-status" role="status" aria-live="polite"></p><p class="cb-notice" data-testid="combat-pause" hidden></p><p class="error" data-testid="combat-error" role="alert" hidden></p>
      <p data-testid="combat-receipt">No Map payloads collected yet.</p><p class="muted" data-testid="combat-settlement">Collected tiles are saved to unresolved Salvage. Review saved outcomes and resolve Salvage from Build before the next Attempt.</p>
      <p class="cb-controls">Left/Right: move; Down: soft drop; Up/X or Z: rotate; Space: hard drop; C/Shift: Hold; Esc: pause. Only clearing a payload cell collects its tile.</p>
    </section><section class="cb-panel cb-game" aria-label="Falling Blocks and committed harvest">
      <div class="pr-cluster"><section><p class="pr-label" data-testid="hold-label">HOLD</p><div data-testid="hold-piece"></div></section><section><p class="pr-label" data-testid="stack-warning">FALLING BLOCKS</p><div class="pr-well" data-testid="combat-board" tabindex="0" role="img" aria-label="Falling Blocks board, ten columns and twenty rows"><div class="pr-layer" data-testid="locked-cells"></div><div class="pr-layer" data-testid="ghost-cells" aria-hidden="true"></div><div class="pr-layer" data-testid="active-piece"></div></div></section><section><p class="pr-label">NEXT</p><div data-testid="next-pieces"></div></section></div>
      <h3 class="cb-harvest-title">Harvested this attempt: <span data-testid="combat-collected">0</span> / 24</h3><div class="pr-harvest" data-testid="combat-harvest"></div>
    </section></div></main>`;
  const get=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>(`[data-testid="${id}"]`)!;
  const safe=()=>window.innerWidth>=1280&&window.innerHeight>=720&&!document.hidden;
  function render():void{
    if(!live)return;
    const view=app.projection(),battle=view.simulation.battle,enemy=battle.enemy,run=view.run;
    root.querySelector<HTMLElement>('.cb-controls')!.textContent=controlsText(settings?.current())+' Only clearing a payload cell collects its tile.';
    get('combat-map-name').textContent=run.attempt!.startup.map.name+' / '+run.attempt!.difficulty;
    get('combat-attempt-id').textContent=run.attempt!.attemptId;
    for(const [prefix,ship] of [['player',battle.player],['enemy',enemy]] as const){
      get(prefix+'-hull').textContent=ship?display(ship.hull):'0';get(prefix+'-shield').textContent=ship?display(ship.shield):'0';
      const hull=get<HTMLProgressElement>(prefix+'-hull-bar'),shield=get<HTMLProgressElement>(prefix+'-shield-bar');
      hull.max=ship?.maxHull??1;hull.value=ship?.hull??0;shield.max=ship?.maxShield||1;shield.value=ship?.shield??0;
      get(prefix+'-shield-status').textContent=!ship?.maxShield?'No Shield':ship.shield===ship.maxShield?'Shield full':ship.lastDamageTick!==null&&battle.tick-ship.lastDamageTick<180?'Recharge delayed':'Recharging';
    }
    get('combat-enemy-name').textContent=enemy?battle.definition.encounters[battle.encounterIndex]!.name:'Encounter transition';
    get('combat-threat').textContent=String(view.simulation.board.locks);
    const remaining=enemy?Math.max(0,battle.definition.encounters[battle.encounterIndex]!.limitTicks-(battle.tick-battle.encounterStartedAt)):Math.max(0,(battle.nextEncounterAt??battle.tick)-battle.tick);
    get('combat-time').textContent=(remaining/60).toFixed(1)+' s';get('combat-tick').textContent=String(battle.tick);get('board-tick').textContent=String(view.simulation.board.tick);
    get('combat-status').textContent=view.status==='ended'?'Outcome saved: '+(view.outcome?.terminal.kind??run.attempt!.status)+(view.outcome?.terminal.causes.length?' - '+view.outcome.terminal.causes.join(', '):''):
      view.status==='pending'?'Saving outcome. Both simulations are stopped.':view.status==='save-failed'?'Save failed. Retry the same operation.':view.status==='runtime-fault'?'Runtime stopped. Reload to recover the saved Attempt.':view.status==='paused'?'Paused.':'Auto-battle and Falling Blocks share one simulation clock.';
    get('combat-pause').hidden=!view.pauseReason;get('combat-pause').textContent=view.resumeRemaining!==null?'Resuming in '+Math.max(1,Math.ceil((view.resumeRemaining-1e-7)/1000))+'...':view.pauseReason;
    get('combat-error').hidden=!view.error;get('combat-error').textContent=view.error;
    get<HTMLButtonElement>('pause-combat').disabled=view.status==='ended'||view.status==='runtime-fault'||!!view.pauseReason;
    get<HTMLButtonElement>('resume-combat').hidden=!view.pauseReason||view.status==='ended';get<HTMLButtonElement>('resume-combat').disabled=!safe()||view.resumeRemaining!==null||busy||app.hasPendingSave()||view.status==='runtime-fault'||(!!renderPack&&!visuals?.available);
    get<HTMLButtonElement>('retry-combat').hidden=view.status!=='save-failed';get<HTMLButtonElement>('retry-combat').disabled=busy;
    get<HTMLButtonElement>('abandon-combat').hidden=view.status==='ended';get<HTMLButtonElement>('abandon-combat').disabled=busy||app.hasPendingSave()||view.status==='runtime-fault';
    get<HTMLButtonElement>('combat-results').hidden=view.status!=='ended'||!onResults;get<HTMLButtonElement>('combat-results').disabled=busy;
    get<HTMLButtonElement>('return-combat-build').hidden=view.status!=='ended';get<HTMLButtonElement>('return-combat-build').disabled=busy;
    get('combat-collected').textContent=String(view.collected.length);
    if(view.lastCollected.length)get('combat-receipt').textContent='Saved to Salvage: '+view.lastCollected.map(t=>t.letter+' / '+t.subtype).join(', ');
    if(view.status==='ended')get('combat-settlement').textContent='Outcome saved; currency has not been granted. Open Results to save eligible rewards, then resolve Salvage from Build.';
    get('combat-harvest').replaceChildren(...MODULE_SUBTYPES.map(subtype=>{
      const selected=view.collected.filter(t=>t.subtype===subtype),node=document.createElement('div');node.className='pr-harvest-item';node.dataset.subtype=subtype;
      const label=document.createElement('span'),count=document.createElement('strong'),letters=document.createElement('small');label.textContent=subtype;if(renderPack)label.prepend(subtypeIcon(subtype));count.textContent=String(selected.length);
      letters.textContent=selected.length?[...new Set(selected.map(t=>t.letter))].sort().map(letter=>letter+' x'+selected.filter(t=>t.letter===letter).length).join(', '):'No letters';node.append(label,count,letters);return node;
    }));
    renderCombatBoard(root,view.simulation.board,view.status!=='playing',!!renderPack);
    visuals?.render(view);
  }
  function clearInput():void{inputs=[];keyboard.clear();app.clearInput();}
  function pause(reason:string):void{app.pause(reason);clearInput();last=null;render();}
  async function action(fn:()=>Promise<unknown>):Promise<void>{
    if(busy)return;busy=true;clearInput();
    try{const pending=fn();render();await pending;}catch(error){pause(error instanceof Error?error.message:String(error));}
    finally{busy=false;last=null;if(live){render();if(app.projection().status==='playing')get('combat-board').focus();}}
  }
  const onKey=(event:KeyboardEvent)=>{
    const view=app.projection();
    keyboard.handle(event,{bindings:settings?.current().bindings,
      pieceId:!busy&&(!renderPack||visuals?.available)&&view.status==='playing'?view.simulation.board.active.id:null});
  };
  get('pause-combat').addEventListener('click',()=>pause('Paused by player.'),{signal});
  get('resume-combat').addEventListener('click',()=>{if(safe()){app.requestResume();clearInput();last=null;render();}},{signal});
  get('retry-combat').addEventListener('click',()=>void action(()=>app.retry()),{signal});
  get('combat-results').addEventListener('click',()=>{if(onResults)void action(onResults);},{signal});
  get('return-combat-build').addEventListener('click',()=>void action(onReturn),{signal});
  get('abandon-combat').addEventListener('click',()=>{
    if(busy||app.hasPendingSave())return;pause('Paused for abandonment confirmation.');
    const dialog=document.createElement('dialog');dialog.className='at-dialog';dialog.dataset.testid='combat-abandon-confirmation';
    const title=document.createElement('h2'),text=document.createElement('p'),cancel=document.createElement('button'),confirm=document.createElement('button');
    title.textContent='Abandon this Attempt?';title.id='combat-abandon-title';dialog.setAttribute('aria-labelledby',title.id);
    text.textContent='Keep already saved payloads and return to Build. No victory reward is granted.';cancel.textContent='Cancel';confirm.textContent='Abandon';cancel.autofocus=true;confirm.dataset.testid='confirm-combat-abandon';
    cancel.onclick=()=>dialog.close('cancel');confirm.onclick=()=>dialog.close('confirm');dialog.append(title,text,cancel,confirm);root.append(dialog);
    dialog.addEventListener('close',()=>{const yes=dialog.returnValue==='confirm';dialog.remove();if(live){get('abandon-combat').focus();if(yes)void action(()=>app.abandon());}},{once:true});dialog.showModal();
  },{signal});
  window.addEventListener('keydown',onKey,{signal});window.addEventListener('keyup',onKey,{signal});
  window.addEventListener('blur',()=>pause('Paused because the game lost focus.'),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Paused because the tab is hidden.');},{signal});
  window.addEventListener('resize',()=>{if(!safe())pause('Paused: use a viewport of at least 1280 x 720.');else render();},{signal});
  async function frame(timestamp:number):Promise<void>{
    if(!live)return;
    try{
      const elapsed=last===null?0:Math.max(0,timestamp-last);last=timestamp;
      if(!busy&&(!renderPack||visuals?.available)){
        const queued=inputs;inputs=[];const wasCountdown=app.projection().resumeRemaining!==null;
        const result=app.frame(elapsed,queued);
        if(app.hasPendingSave()){clearInput();render();}
        const updated=await result;
        if(updated.resetClock){last=null;clearInput();}
        if(wasCountdown&&updated.projection.status==='playing')get('combat-board').focus();
      }else {last=null;clearInput();}
      render();
    }catch(error){pause(error instanceof Error?error.message:String(error));}
    finally{if(live)frameId=requestAnimationFrame(frame);}
  }
  if(safe()&&!document.hasFocus())pause('Paused because the game lost focus.');
  settings?.attach(root,()=>pause('Paused for Settings. Close Settings, then choose Resume.'));
  if(renderPack)visuals=new RenderedCombatSurface(root,renderPack,{fault:reason=>pause(reason),ready:()=>{last=null;clearInput();if(live){render();if(app.projection().status==='playing'&&!document.querySelector('dialog[open]'))get('combat-board').focus();}}});
  if(!safe())pause('Paused: window is hidden or below the minimum size.');
  render();get('combat-board').focus();frameId=requestAnimationFrame(frame);
  return ()=>{live=false;visuals?.dispose();controller.abort();cancelAnimationFrame(frameId);clearInput();for(const dialog of root.querySelectorAll('dialog'))dialog.close('cancel');};
}
