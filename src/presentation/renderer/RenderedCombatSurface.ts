import type { ContentPackManifest } from '../../domain/content/contentPack';
import type { CombatProjection } from '../../application/combat/CombatApplication';
import { equippedWords } from '../../domain/build/shipBuild';
import { FixedCameraRenderer } from './FixedCameraRenderer';
import './renderedCombat.css';

/** Renderer lifetime and DOM composition; the Combat view remains the sole application/input owner. */
export class RenderedCombatSurface {
  private readonly host:HTMLDivElement;
  private readonly stage:HTMLDivElement;
  private readonly status:HTMLParagraphElement;
  private readonly retry:HTMLButtonElement;
  private readonly playerWords:HTMLDivElement;
  private readonly enemyWords:HTMLDivElement;
  private readonly observer:ResizeObserver;
  private renderer:FixedCameraRenderer|null=null;
  private generation=0;
  private ended=false;
  private error=false;
  private samples=0;
  private readonly pack:ContentPackManifest;

  constructor(private readonly root:HTMLElement,pack:ContentPackManifest,private readonly callbacks:{fault(message:string):void;ready():void}) {
    this.pack=pack;
    const shell=root.querySelector('.cb-shell')!;shell.classList.add('cb-rendered');
    const hud=root.querySelector<HTMLElement>('.cb-hud')!;
    this.stage=document.createElement('div');this.stage.className='cb-stage';
    for(const selector of ['h2','.identity','.cb-resource-grid','.cb-facts'])this.stage.append(hud.querySelector(selector)!);
    this.host=document.createElement('div');this.host.className='cb-scene';this.host.dataset.testid='combat-scene';this.stage.append(this.host);
    const footer=document.createElement('div');footer.className='cb-render-footer';
    const words=document.createElement('section');words.className='cb-fleet-words';words.setAttribute('aria-label','Equipped words on actual ships');
    const wordPanel=(title:string,id:string)=>{const panel=document.createElement('section'),heading=document.createElement('h3'),list=document.createElement('div');heading.textContent=title;list.dataset.testid=id;list.className='cb-word-list';panel.append(heading,list);words.append(panel);return list;};
    this.playerWords=wordPanel('Your equipped words','player-equipped-words');this.enemyWords=wordPanel('Enemy equipped words','enemy-equipped-words');footer.append(words);
    this.status=document.createElement('p');this.status.dataset.testid='graphics-status';this.status.setAttribute('role','status');
    this.retry=document.createElement('button');this.retry.dataset.testid='retry-graphics';this.retry.className='secondary';this.retry.textContent='Retry graphics';this.retry.hidden=true;
    footer.append(this.status,this.retry);
    while(hud.firstChild)footer.append(hud.firstChild);
    hud.append(this.stage,footer);
    this.retry.onclick=()=>this.start();
    this.observer=new ResizeObserver(()=>this.layout());this.observer.observe(root.querySelector('.cb-game')!);this.observer.observe(shell);
    this.layout();this.start();
  }
  get available():boolean{return !!this.renderer?.available&&!this.error&&!this.ended;}
  private layout():void {
    if(this.ended)return;
    const well=this.root.querySelector<HTMLElement>('[data-testid="combat-board"]')!;
    const height=well.getBoundingClientRect().bottom-this.stage.getBoundingClientRect().top;
    if(height>0)this.stage.style.height=height+'px';
  }
  private start():void {
    if(this.ended)return;
    const generation=++this.generation;
    this.renderer?.dispose();this.renderer=null;this.error=false;
    this.retry.hidden=true;this.status.textContent='Loading validated ship graphics. Both games wait for graphics readiness.';
    try {
      this.renderer=new FixedCameraRenderer(this.host,this.pack,{
        failed:error=>this.fail(error),
        lost:()=>{if(!this.ended){this.status.textContent='Graphics context lost. Both games are paused.';this.callbacks.fault('Paused: graphics context lost. Restore graphics before resuming.');}},
        restored:()=>{if(!this.ended){this.status.textContent='Graphics restored. Choose Resume when ready.';this.callbacks.ready();}},
      });
      void this.renderer.ready.then(()=>{
        if(this.ended||generation!==this.generation)return;
        this.status.textContent='';this.layout();this.callbacks.ready();
      }).catch(error=>{if(!this.ended&&generation===this.generation)this.fail(error);});
    } catch(error) { this.fail(error); }
  }
  private fail(error:unknown):void {
    if(this.ended||this.error)return;
    this.error=true;this.renderer?.dispose();this.renderer=null;
    this.host.dataset.rendererState='error';this.status.textContent='Graphics unavailable: '+(error instanceof Error?error.message:String(error));this.retry.hidden=false;
    this.callbacks.fault('Paused: graphics are unavailable. Retry graphics or abandon safely.');
  }
  render(view:CombatProjection):void {
    if(this.ended)return;
    this.retry.disabled=view.status==='pending';
    if(this.available&&view.status==='playing'&&this.status.textContent?.startsWith('Graphics restored.'))this.status.textContent='';
    const spellings=view.run.attempt!.startup.supportedSpellings!;
    const updateWords=(host:HTMLElement,ship:CombatProjection['simulation']['battle']['enemy'])=>{
      const rows=ship?equippedWords(ship.modules,spellings).filter(word=>word.supported):[];
      const signature=JSON.stringify(rows);if(host.dataset.signature===signature)return;host.dataset.signature=signature;
      host.replaceChildren(...rows.map(word=>{const row=document.createElement('p');row.dataset.word=word.spelling;row.dataset.axis=word.axis;const multipliers=ship!.modules.filter(module=>word.tileIds.includes(module.id)).map(module=>module.multiplier);const low=Math.min(...multipliers),high=Math.max(...multipliers);row.textContent=word.spelling+' / '+word.axis+' / x'+(low/100).toFixed(2)+(high===low?'':'-'+(high/100).toFixed(2));return row;}));
      if(!rows.length)host.textContent='No equipped supported words.';
    };
    updateWords(this.playerWords,view.simulation.battle.player);updateWords(this.enemyWords,view.simulation.battle.enemy);
    if(!this.available)return;
    try {
      this.renderer!.render(view);
      if(++this.samples%30===1||view.status!=='playing')this.host.dataset.diagnostics=JSON.stringify(this.renderer!.diagnostics());
    } catch(error) { this.fail(error); }
  }
  dispose():void {
    if(this.ended)return;
    this.ended=true;this.generation++;this.observer.disconnect();this.retry.onclick=null;this.renderer?.dispose();this.renderer=null;
  }
}
