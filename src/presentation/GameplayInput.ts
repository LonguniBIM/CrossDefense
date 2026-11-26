import type { BoardInput } from '../domain/preRun/board';
import { ACTION_LABELS, DEFAULT_SETTINGS, GAMEPLAY_ACTIONS, validateSettingsForSave, type GameplayBindings, type GameplayAction, type WorkspaceSettings } from '../domain/workspace/settings';

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return ({ ArrowLeft: 'Left', ArrowRight: 'Right', ArrowDown: 'Down', ArrowUp: 'Up',
    ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift' } as Record<string, string>)[code] ?? code;
}
export function boundAction(code: string, bindings: GameplayBindings = DEFAULT_SETTINGS.bindings): GameplayAction | undefined {
  return GAMEPLAY_ACTIONS.find(action => bindings[action].includes(code));
}
export function controlsText(settings: WorkspaceSettings = DEFAULT_SETTINGS): string {
  const text = GAMEPLAY_ACTIONS.map(action => ACTION_LABELS[action] + ': ' + settings.bindings[action].map(keyLabel).join(' / ')).join('; ') + '.';
  try { validateSettingsForSave(settings); return text; }
  catch (error) { return text + ' Controls need attention: ' + (error instanceof Error ? error.message : String(error)) + ' Open Settings to correct them.'; }
}
export function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input,textarea,select,[role="textbox"],[contenteditable="true"]'));
}
export function isNativeControl(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('button,a[href],[role="button"]');
}
export function isBrowserInput(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey || event.isComposing || event.defaultPrevented;
}

interface GameplayKeyboardContext {
  bindings: GameplayBindings | undefined;
  /** Null while the host cannot accept board input; Pause remains available. */
  pieceId: string | null;
}
type ShiftCandidate = { code: string; action: GameplayAction; pieceId: string | null };

/** Routes physical keys without consuming native controls, modal input or browser shortcuts. */
export class GameplayKeyboard {
  private shiftCandidate: ShiftCandidate | null = null;
  private pressed = new Set<string>();

  constructor(private readonly enqueue: (input: BoardInput) => void, private readonly pause: () => void) {}

  clear(): void {
    this.shiftCandidate = null;
    this.pressed.clear();
  }

  handle(event: KeyboardEvent, { bindings, pieceId }: GameplayKeyboardContext): void {
    const shift = event.code === 'ShiftLeft' || event.code === 'ShiftRight';
    const action = boundAction(event.code, bindings);
    const alreadyPressed = this.pressed.has(event.code);
    if (event.type === 'keyup') this.pressed.delete(event.code);
    else this.pressed.add(event.code);
    // Any other key makes Shift a chord, including keys with no gameplay binding.
    if (!shift) this.shiftCandidate = null;

    if (event.type === 'keyup') {
      // Release held input even after in-page focus moves. Native keyup defaults stay intact.
      if (!shift) {
        if (action && action !== 'pause' && pieceId !== null) {
          this.enqueue({ action, down: false, code: event.code, pieceId });
        }
        return;
      }
      const candidate = this.shiftCandidate;
      this.shiftCandidate = null;
      if (!candidate || candidate.code !== event.code || this.pressed.size || event.shiftKey || this.protectedInput(event)) return;
      if (candidate.action === 'pause') { this.pause(); return; }
      if (pieceId === null || candidate.pieceId === null) return;
      // Preserve the original piece identity and leave no held Shift after its release.
      const input = { action: candidate.action, code: candidate.code, pieceId: candidate.pieceId };
      this.enqueue({ ...input, down: true });
      this.enqueue({ ...input, down: false });
      return;
    }

    // These guards must also precede Pause so Enter/Space and modal Escape remain native.
    if (this.protectedInput(event)) { this.shiftCandidate = null; return; }
    if (shift) {
      if (event.repeat || alreadyPressed) return;
      this.shiftCandidate = null;
      if (this.pressed.size === 1 && action && (action === 'pause' || pieceId !== null)) {
        this.shiftCandidate = { code: event.code, action, pieceId };
      }
      return;
    }
    if (!action || event.repeat) return;
    if (action === 'pause') { event.preventDefault(); this.pause(); return; }
    if (pieceId === null) return;
    event.preventDefault();
    this.enqueue({ action, down: true, code: event.code, pieceId });
  }

  private protectedInput(event: KeyboardEvent): boolean {
    return isTextEntry(event.target) || isNativeControl(event.target) || isBrowserInput(event) || !!document.querySelector('dialog[open]');
  }
}
