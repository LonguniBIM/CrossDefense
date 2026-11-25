import { createElement, Crosshair, Rocket, ScanLine, BrickWall, Shield, Cpu, Flame, BatteryCharging, Wrench } from 'lucide';
import type { ModuleSubtype } from '../../domain/content/contentPack';
const ICONS = {Ballistic:Crosshair,Missile:Rocket,Laser:ScanLine,Armor:BrickWall,Shield,System:Cpu,Engine:Flame,Power:BatteryCharging,Support:Wrench};
/** Decorative next to existing names; shape and letter identity do not depend on color. */
export function subtypeIcon(subtype:ModuleSubtype):SVGElement {
  return createElement(ICONS[subtype],{width:14,height:14,'aria-hidden':'true',focusable:'false',class:'subtype-icon'});
}
