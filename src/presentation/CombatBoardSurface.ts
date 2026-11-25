import {canonicalPiece,ghostCells,type BoardCell,type Piece,type BoardState} from '../domain/preRun/board';
import {subtypeIcon} from './renderer/SubtypeIcon';
const labels:Readonly<Record<string,string>>={Ballistic:'BAL',Missile:'MIS',Laser:'LAS',Armor:'ARM',Shield:'SHD',System:'SYS',Engine:'ENG',Power:'PWR',Support:'SUP'};
function cellNode(cell:BoardCell,style:string,icons=false):HTMLSpanElement{
  const node=document.createElement('span');node.className='pr-cell '+style;
  node.style.setProperty('--x',String(cell.x));node.style.setProperty('--y',String(cell.y));
  node.dataset.cellId=cell.id;node.dataset.x=String(cell.x);node.dataset.y=String(cell.y);
  if(cell.payload&&style!=='ghost'){
    node.dataset.payloadId=cell.payload.id;node.dataset.letter=cell.payload.letter;node.dataset.subtype=cell.payload.subtype;
    const letter=document.createElement('b'),subtype=document.createElement('small');letter.textContent=cell.payload.letter;subtype.textContent=labels[cell.payload.subtype]??cell.payload.subtype;
    if(icons)subtype.replaceChildren(subtypeIcon(cell.payload.subtype));
    node.append(letter,subtype);node.title=cell.payload.letter+' / '+cell.payload.subtype;
  }
  return node;
}
function preview(piece:Piece,icons=false):HTMLDivElement{
  const node=document.createElement('div');node.className='pr-preview';node.dataset.pieceId=piece.id;
  node.setAttribute('aria-label',piece.shape+': '+(piece.payload?piece.payload.letter+' '+piece.payload.subtype:'no reward'));
  const cells=canonicalPiece(piece).cells,left=Math.min(...cells.map(c=>c.x)),top=Math.min(...cells.map(c=>c.y));
  node.append(...cells.map(c=>cellNode({...c,x:c.x-left,y:c.y-top},'preview',icons)));return node;
}
/** Presentation-only board adapter. Never chooses a move, payload or combat result. */
export function renderCombatBoard(root:HTMLElement,board:BoardState,muted:boolean,icons=false):void{
  const get=(id:string)=>root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  get('combat-board').classList.toggle('pr-board-muted',muted);
  get('hold-label').textContent=board.holdUsed?'HOLD - USED':'HOLD';get('hold-piece').replaceChildren(...(board.hold?[preview(board.hold,icons)]:[]));
  get('next-pieces').replaceChildren(...board.next.map(piece=>preview(piece,icons)));
  get('locked-cells').replaceChildren(...board.grid.filter(c=>c.y>=0).map(c=>cellNode(c,'locked',icons)));
  get('ghost-cells').replaceChildren(...ghostCells(board).filter(c=>c.y>=0&&!board.active.cells.some(a=>a.x===c.x&&a.y===c.y)).map(c=>cellNode(c,'ghost',icons)));
  const active=get('active-piece');active.dataset.pieceId=board.active.id;active.dataset.shape=board.active.shape;
  active.dataset.pivotX=String(board.active.pivot[0]);active.dataset.pivotY=String(board.active.pivot[1]);
  active.replaceChildren(...(board.topOut?[]:board.active.cells.filter(c=>c.y>=0).map(c=>cellNode(c,'active',icons))));
  get('stack-warning').textContent=board.grid.some(c=>c.y>=0&&c.y<4)?'STACK HIGH':'FALLING BLOCKS';
}
