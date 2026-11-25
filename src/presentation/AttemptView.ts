import './attempt.css';
import { rewardPreview } from '../domain/results/settlement';
import type { AttemptApplication, MapSelection } from '../application/attempt/AttemptApplication';
import type { ActiveRun } from '../domain/run/run';
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type Difficulty } from '../domain/attempt/rules';
import type { StartAttemptRequest } from '../domain/attempt/attempt';

function element<T extends HTMLElement>(root:HTMLElement,id:string):T {
  const found=root.querySelector<T>(`[data-testid="${id}"]`); if(!found) throw Error('Attempt view control missing: '+id); return found;
}
function message(error:unknown):string { return error instanceof Error?error.message:String(error); }
function confirmAction(root:HTMLElement,title:string,detail:string,affirm:string,invoker:HTMLElement):Promise<boolean> {
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog'); dialog.className='at-dialog'; dialog.dataset.testid='attempt-confirmation';
    const heading=document.createElement('h2'), text=document.createElement('p'), cancel=document.createElement('button'), confirm=document.createElement('button');
    heading.textContent=title; text.textContent=detail; heading.id='attempt-confirm-heading'; dialog.setAttribute('aria-labelledby',heading.id);
    cancel.textContent='Cancel'; cancel.className='secondary'; cancel.dataset.testid='cancel-attempt'; cancel.autofocus=true;
    confirm.textContent=affirm; confirm.className='primary'; confirm.dataset.testid='confirm-attempt';
    cancel.onclick=()=>dialog.close('cancel'); confirm.onclick=()=>dialog.close('confirm');
    dialog.append(heading,text,cancel,confirm); root.append(dialog);
    dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='confirm';dialog.remove();if(invoker.isConnected) invoker.focus();resolve(accepted);},{once:true});
    dialog.showModal();
  });
}

export function mountMapSelection(root:HTMLElement,app:AttemptApplication,initial:MapSelection,
  callbacks:{back:()=>Promise<void>;started:(run:ActiveRun)=>Promise<void>}):()=>void {
  const controller=new AbortController(),signal=controller.signal;
  let disposed=false,busy=false,pending:'start'|'difficulty'|null=null;
  let selection=structuredClone(initial);
  root.innerHTML=`<div class="shell at-shell"><section class="panel at-panel">
    <span class="at-eyebrow" data-testid="selection-capability"></span><h1>Map and difficulty</h1>
    <p data-testid="selection-description"></p>
    <dl class="facts"><div><dt>Run</dt><dd data-testid="selection-run"></dd></div><div><dt>Content</dt><dd data-testid="selection-content"></dd></div><div><dt>Ruleset</dt><dd data-testid="selection-ruleset"></dd></div></dl>
    <p data-testid="map-content-unavailable" class="muted" hidden></p>
    <div class="form-grid"><label>Map<select data-testid="map-selection"></select></label><label>Difficulty<select data-testid="difficulty-selection"></select></label></div>
    <p data-testid="launch-blockers" class="error"></p><p data-testid="launch-size-warning" class="error" hidden>Use a viewport of at least 1280 x 720 before starting.</p>
    <p data-testid="no-offense-advisory" class="muted" hidden>This ship has no offensive output. Start anyway requires explicit confirmation.</p>
    <p data-testid="map-rewards" class="muted"></p><p data-testid="launch-status" role="status" aria-live="polite"></p>
    <div class="actions"><button class="primary" data-testid="start-attempt">Start Map diagnostic</button><button class="primary" data-testid="retry-attempt" hidden>Retry the same operation</button><button class="secondary" data-testid="back-to-build">Back to Build</button></div>
  </section></div>`;
  const get=<T extends HTMLElement=HTMLElement>(id:string)=>element<T>(root,id);
  const map=get<HTMLSelectElement>('map-selection'), difficulty=get<HTMLSelectElement>('difficulty-selection'), start=get<HTMLButtonElement>('start-attempt'), retry=get<HTMLButtonElement>('retry-attempt'), back=get<HTMLButtonElement>('back-to-build');
  get('selection-run').textContent=selection.run.runId;get('selection-content').textContent=selection.run.contentVersion;get('selection-ruleset').textContent=selection.run.rulesetVersion;
  for(const entry of selection.maps) { const option=document.createElement('option');option.value=entry.mapId;option.textContent=entry.name;map.append(option); }
  map.value=selection.mapId;
  const combat=selection.capability==='combat';
  get('selection-capability').textContent=combat?'DEVELOPMENT / COMBAT AND DURABLE COLLECTION':'DEVELOPMENT / LAUNCH AND RECOVERY ONLY';
  get('selection-description').textContent=combat?'Play the approved Scout and Boss encounters. Collection is saved to unresolved Salvage. Review saved outcomes in Results, then resolve Salvage before replay.':'No combat runs in this diagnostic. Starting saves an Attempt; reload returns to Build without victory rewards.';
  start.textContent=combat?'Start Map':'Start Map diagnostic';
  for(const entry of DIFFICULTIES) { const option=document.createElement('option');option.value=entry;option.textContent=entry;difficulty.append(option); }
  difficulty.value=selection.difficulty;
  const largeEnough=()=>window.innerWidth>=1280&&window.innerHeight>=720;
  const hardBlocked=()=>selection.blockers.length>0||!selection.maps.length||!largeEnough();
  function update():void {
    if(disposed) return;
    const frozen=busy||app.hasPendingSave();
    if(selection.rewards&&selection.firstClearEligible!==undefined){const reward=rewardPreview(selection.rewards,selection.difficulty,selection.firstClearEligible);get('map-rewards').textContent=(selection.run.clearedMapIds?.includes(selection.mapId)?'Replay in this Run. ':'')+(selection.firstClearEligible?'First-Clear eligible. ':'First-Clear already received. ')+'Victory: '+reward.repeatable.credits+' repeatable Credits; one-time bonus '+reward.firstClearBonus.credits+' Credits / '+reward.firstClearBonus.celestium+' Celestium. Rewards are saved from completed outcomes, not at Start.';}
    start.disabled=frozen||hardBlocked();back.disabled=frozen;difficulty.disabled=frozen;map.disabled=frozen||!selection.maps.length;
    retry.hidden=!pending||!app.hasPendingSave();retry.disabled=busy;
    get('map-content-unavailable').hidden=!selection.contentMessage;get('map-content-unavailable').textContent=selection.contentMessage;
    get('launch-blockers').textContent=selection.blockers.join(' ');get('launch-size-warning').hidden=largeEnough();get('no-offense-advisory').hidden=!selection.noOffense||hardBlocked();
  }
  async function launch(confirmed:boolean):Promise<void> {
    if(busy||hardBlocked()||disposed) return;
    busy=true;pending='start';get('launch-status').textContent='Saving Attempt startup...';update();
    try {
      const request:StartAttemptRequest={operationId:crypto.randomUUID(),pilotId:selection.run.pilotId,runId:selection.run.runId,mapId:map.value,difficulty:selection.difficulty,expectedBuildRevision:selection.run.shipBuild?.revision??0,confirmNoOffense:confirmed};
      const run=await app.start(request);pending=null;if(!disposed) await callbacks.started(run);
    } catch(error) { if(!disposed) get('launch-status').textContent=message(error); }
    finally {busy=false;update();}
  }
  start.addEventListener('click',()=>{
    if(busy||hardBlocked()) return;
    if(selection.noOffense) void confirmAction(root,'No offensive output',combat?'The ship cannot deal damage. This is not a hard launch blocker. Start this Map anyway?':'The ship cannot deal damage. This is not a hard launch blocker. Start this diagnostic anyway?','Start anyway',start).then(yes=>{if(yes&&!disposed) void launch(true);});
    else void launch(false);
  },{signal});
  difficulty.addEventListener('change',()=>{
    if(busy||app.hasPendingSave()) return;
    const chosen=difficulty.value as Difficulty;
    busy=true;pending='difficulty';get('launch-status').textContent='Saving difficulty...';update();
    void app.chooseDifficulty({operationId:crypto.randomUUID(),pilotId:selection.run.pilotId,difficulty:chosen}).then(pilot=>{
      selection.difficulty=pilot.lastDifficulty??DEFAULT_DIFFICULTY;pending=null;if(!disposed) get('launch-status').textContent='Difficulty saved.';
    },error=>{if(!disposed) get('launch-status').textContent=message(error);}).finally(()=>{busy=false;if(!disposed) difficulty.value=selection.difficulty;update();});
  },{signal});
  retry.addEventListener('click',()=>{
    if(busy||!pending) return;
    busy=true;const action=pending;get('launch-status').textContent='Retrying the same operation...';update();
    void (async()=>{
      try {
        if(action==='start') {const run=await app.retryStart();pending=null;if(!disposed) await callbacks.started(run);}
        else {const pilot=await app.retryDifficulty();selection.difficulty=pilot.lastDifficulty??DEFAULT_DIFFICULTY;pending=null;if(!disposed){difficulty.value=selection.difficulty;get('launch-status').textContent='Difficulty saved.';}}
      } catch(error) {if(!disposed)get('launch-status').textContent=message(error);}
      finally {busy=false;update();}
    })();
  },{signal});
  back.addEventListener('click',()=>{if(busy||app.hasPendingSave())return;busy=true;update();void callbacks.back().catch(error=>{if(!disposed){get('launch-status').textContent=message(error);busy=false;update();}});},{signal});
  window.addEventListener('resize',update,{signal});update();start.focus();
  return ()=>{disposed=true;controller.abort();for(const dialog of root.querySelectorAll('dialog')) dialog.close('cancel');};
}

export function mountAttemptDiagnostic(root:HTMLElement,app:AttemptApplication,run:ActiveRun,onEnded:(run:ActiveRun)=>Promise<void>):()=>void {
  if(run.phase!=='attempt'||run.attempt?.status!=='running') throw Error('The diagnostic requires a committed active Attempt.');
  const envelope=structuredClone(run.attempt),controller=new AbortController(),signal=controller.signal;
  let disposed=false,busy=false;
  root.innerHTML=`<div class="shell at-shell"><section class="panel at-panel"><span class="at-eyebrow">DEVELOPMENT / DIAGNOSTIC PAUSED</span><h1>Map Attempt diagnostic</h1>
    <p data-testid="diagnostic-capability">Launch/recovery only. Combat, timers, enemies and victory rewards are not implemented or simulated.</p>
    <dl class="facts"><div><dt>Attempt</dt><dd data-testid="attempt-id"></dd></div><div><dt>Map</dt><dd data-testid="attempt-map"></dd></div><div><dt>Difficulty</dt><dd data-testid="attempt-difficulty"></dd></div><div><dt>Content</dt><dd data-testid="attempt-content"></dd></div><div><dt>Ruleset</dt><dd data-testid="attempt-ruleset"></dd></div><div><dt>Seed</dt><dd data-testid="attempt-seed"></dd></div><div><dt>Status</dt><dd data-testid="attempt-status">running / diagnostic paused</dd></div></dl>
    <h2>Frozen startup layout</h2><p data-testid="attempt-layout"></p><p data-testid="attempt-retained"></p>
    <p>Reloading marks this Attempt interrupted and preserves the saved Build. No exact combat resume or victory reward is claimed.</p>
    <p data-testid="attempt-end-status" role="status" aria-live="polite"></p>
    <div class="actions"><button class="secondary" data-testid="end-diagnostic">End diagnostic and return to Build</button><button class="primary" data-testid="retry-end-attempt" hidden>Retry the same return</button></div>
  </section></div>`;
  const get=<T extends HTMLElement=HTMLElement>(id:string)=>element<T>(root,id);
  get('attempt-id').textContent=envelope.attemptId;get('attempt-map').textContent=envelope.startup.map.name;get('attempt-difficulty').textContent=envelope.difficulty;
  get('attempt-content').textContent=envelope.contentVersion;get('attempt-ruleset').textContent=envelope.rulesetVersion;get('attempt-seed').textContent=envelope.seed;
  get('attempt-layout').textContent=envelope.startup.placements.map(p=>{const tile=envelope.startup.retainedTiles.find(t=>t.id===p.tileId)!;return `${String.fromCharCode(65+p.x)}${p.y+1}: ${tile.letter} / ${tile.subtype}`;}).join('; ')||'No equipped tiles.';
  get('attempt-retained').textContent='Retained tiles: '+envelope.startup.retainedTiles.length;
  const end=get<HTMLButtonElement>('end-diagnostic'),retry=get<HTMLButtonElement>('retry-end-attempt');
  function update():void {if(disposed)return;end.disabled=busy||app.hasPendingSave();retry.hidden=!app.hasPendingSave();retry.disabled=busy;}
  async function finish(retrying:boolean):Promise<void> {
    if(busy||disposed)return;busy=true;get('attempt-end-status').textContent='Saving return to Build...';update();
    try {const next=retrying?await app.retryEnd():await app.end({kind:'abandon-attempt',operationId:crypto.randomUUID(),pilotId:run.pilotId,runId:run.runId,attemptId:envelope.attemptId});if(!disposed)await onEnded(next);}
    catch(error){if(!disposed)get('attempt-end-status').textContent=message(error);}
    finally{busy=false;update();}
  }
  end.addEventListener('click',()=>{if(busy||app.hasPendingSave())return;void confirmAction(root,'End this diagnostic Attempt?','Return to Build with the saved layout and retained tiles. This abandons the Attempt; no victory reward is granted.','End and return',end).then(yes=>{if(yes&&!disposed)void finish(false);});},{signal});
  retry.addEventListener('click',()=>void finish(true),{signal});update();end.focus();
  return ()=>{disposed=true;controller.abort();for(const dialog of root.querySelectorAll('dialog'))dialog.close('cancel');};
}
