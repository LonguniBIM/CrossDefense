import type { CombatRepository } from './CombatRepository';
import type { CombatEvent } from '../../domain/combat/battle';
export interface CombatObservation { id:string; tick:number; event:CombatEvent; }
import type { ActiveRun } from '../../domain/run/run';
import type { StarterTile } from '../../domain/preRun/salvage';
import { clearBoardInput, type BoardInput } from '../../domain/preRun/board';
import { createCombatSimulation,stepCombatSimulation,type CombatSimulation } from '../../domain/combat/simulation';
import { combatPayloadEntries } from '../../domain/combat/payload';
import { CombatRejection,type CombatCommit,type CombatOutcome } from '../../domain/combat/collection';
import { AttemptRejection,type EndAttemptCommand } from '../../domain/attempt/attempt';
import { RunOperationConflictError } from '../run/RunRepository';

export interface CombatProjection {
  recentEvents:CombatObservation[]; run:ActiveRun; simulation:CombatSimulation; collected:StarterTile[]; lastCollected:StarterTile[]; outcome:CombatOutcome|null;
  status:'playing'|'paused'|'pending'|'save-failed'|'ended'|'runtime-fault'; pauseReason:string|null; resumeRemaining:number|null; error:string|null;
}
const STEP=1000/60;
type Pending={kind:'tick';command:CombatCommit}|{kind:'end';command:EndAttemptCommand};

/** Owns shared clock, ordered inputs, durable barrier and retry identity. Views receive copies only. */
export class CombatApplication {
  private run:ActiveRun|null=null;
  private simulation:CombatSimulation|null=null;
  private pending:Pending|null=null;
  private saving=false;
  private error:string|null=null;
  private fatal=false;
  private pauseReason:string|null=null;
  private resumeRemaining:number|null=null;
  private accumulator=0;
  private inputs:BoardInput[]=[];
  private lastCollected:StarterTile[]=[];
  private outcome:CombatOutcome|null=null;
  private recentEvents:CombatObservation[]=[];

  constructor(private readonly repository:CombatRepository,private readonly generateId:()=>string,private readonly now:()=>string=()=>new Date().toISOString()){}

  async open(pilotId:string,attemptId:string):Promise<CombatProjection>{
    if(this.run||this.saving)throw Error('This combat session is already open.');
    this.saving=true;
    try {
      const run=await this.repository.getActiveRun(pilotId);
      if(!run||run.attempt?.attemptId!==attemptId)throw Error('The acknowledged Attempt is unavailable.');
      this.simulation=createCombatSimulation(run);this.run=run;
    }finally{this.saving=false;}
    return this.projection();
  }
  projection():CombatProjection {
    const run=this.requireRun();
    const envelope=run.attempt!,ids=envelope.combatProgress!.collectedIds;
    const status=this.fatal?'runtime-fault':this.pending?(this.error?'save-failed':'pending'):run.phase!=='attempt'?'ended':this.pauseReason?'paused':'playing';
    return structuredClone({recentEvents:this.recentEvents,run,simulation:this.simulation!,collected:combatPayloadEntries(envelope.attemptId,envelope.startup.combat!).filter(t=>ids.includes(t.id)),
      lastCollected:this.lastCollected,outcome:this.outcome,status,pauseReason:this.pauseReason,resumeRemaining:this.resumeRemaining,error:this.error});
  }
  pause(reason:string):void {this.pauseReason=reason;this.resumeRemaining=null;this.accumulator=0;this.clearInput();}
  requestResume():void {
    if(this.pending||this.saving||this.fatal||this.requireRun().phase!=='attempt'||!this.pauseReason)return;
    this.resumeRemaining=3000;this.accumulator=0;this.clearInput();
  }
  clearInput():void {this.inputs=[];if(this.simulation)this.simulation.board=clearBoardInput(this.simulation.board);}
  hasPendingSave():boolean{return this.pending!==null;}

  async advance(inputs:readonly BoardInput[]=[]):Promise<CombatProjection>{
    const run=this.requireRun();
    if(this.saving||this.pending||this.fatal||this.pauseReason||run.phase!=='attempt')return this.projection();
    try {
      const step=stepCombatSimulation(this.simulation!,inputs);this.simulation=step.state;
      const tick=step.state.battle.tick;
      this.recentEvents=this.recentEvents.filter(item=>tick-item.tick<=60);
      this.recentEvents.push(...step.state.battle.events.map((event,index)=>({id:tick+':'+index,tick,event:structuredClone(event)})));
      // 26 mounted modules, at most one hit/activation per tick each; bounded visual history only.
      this.recentEvents=this.recentEvents.slice(-4096);
      if(step.events.cleared.length||step.state.battle.terminal){
        this.pending={kind:'tick',command:{kind:'combat-tick',operationId:this.generateId(),pilotId:run.pilotId,runId:run.runId,attemptId:run.attempt!.attemptId,
          expectedRevision:run.attempt!.combatProgress!.revision,tick:step.state.battle.tick,payloadIds:step.events.cleared.map(t=>t.id),terminal:step.state.battle.terminal,recordedAt:this.now()}};
        this.clearInput();return this.persistPending();
      }
      return this.projection();
    }catch(error){this.error=String(error);this.fatal=true;this.clearInput();throw error;}
  }
  async retry():Promise<CombatProjection>{
    if(!this.pending||this.saving||this.fatal)return this.projection();return this.persistPending();
  }
  async abandon():Promise<CombatProjection>{
    const run=this.requireRun();
    if(this.pending||this.saving||this.fatal||run.phase!=='attempt')return this.projection();
    this.pause('Abandoning this Attempt.');
    this.pending={kind:'end',command:{kind:'abandon-attempt',operationId:this.generateId(),pilotId:run.pilotId,runId:run.runId,attemptId:run.attempt!.attemptId,endedAt:this.now()}};
    return this.persistPending();
  }
  private async persistPending():Promise<CombatProjection>{
    const pending=this.pending!;this.saving=true;this.error=null;
    try {
      const result=pending.kind==='tick'?await this.repository.commitCombat(pending.command):{run:await this.repository.endAttempt(pending.command),outcome:null};
      const envelope=result.run.attempt;
      if(!envelope||envelope.attemptId!==this.run?.attempt?.attemptId)throw new CombatRejection('STALE_SESSION','A receipt resolved to a different Attempt; reload for recovery.');
      this.run=result.run;
      if(pending.kind==='tick'){
        this.lastCollected=combatPayloadEntries(envelope.attemptId,envelope.startup.combat!).filter(t=>pending.command.payloadIds.includes(t.id));
        this.outcome=result.outcome;
      }else this.outcome=await this.repository.getCombatOutcome(result.run.pilotId,envelope.attemptId)??null;
      this.pending=null;
    }catch(error){
      this.error=error instanceof Error?error.message:String(error);
      this.fatal=error instanceof CombatRejection||error instanceof AttemptRejection||error instanceof RunOperationConflictError;
    }finally{this.saving=false;}
    return this.projection();
  }

  /** Elapsed wall time feeds a bounded accumulator; hidden/paused/barrier time is never simulated. */
  async frame(elapsed:number,inputs:readonly BoardInput[]=[]):Promise<{projection:CombatProjection;resetClock:boolean}>{
    if(!Number.isFinite(elapsed)||elapsed<0)throw Error('Frame elapsed time must be finite and nonnegative.');
    if(this.resumeRemaining!==null){
      this.resumeRemaining=Math.max(0,this.resumeRemaining-elapsed);
      if(this.resumeRemaining===0){this.resumeRemaining=null;this.pauseReason=null;this.clearInput();}
      this.accumulator=0;return {projection:this.projection(),resetClock:this.resumeRemaining===null};
    }
    if(this.projection().status!=='playing'){this.accumulator=0;this.inputs=[];return {projection:this.projection(),resetClock:true};}
    if(elapsed>STEP*6){this.pause('Paused after a delayed frame. No elapsed play was simulated.');return {projection:this.projection(),resetClock:true};}
    this.accumulator+=elapsed;this.inputs.push(...structuredClone(inputs));
    while(this.accumulator+1e-7>=STEP){
      this.accumulator-=STEP;const commands=this.inputs;this.inputs=[];
      const update=this.advance(commands),barrier=this.pending!==null;
      await update;
      if(barrier||this.projection().status!=='playing'){this.accumulator=0;return {projection:this.projection(),resetClock:true};}
    }
    return {projection:this.projection(),resetClock:false};
  }
  private requireRun():ActiveRun {if(!this.run||!this.simulation)throw Error('Open the acknowledged combat Attempt first.');return this.run;}
}
