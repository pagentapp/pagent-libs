/**
 * InputBridge - Forwards user input events from the visible layout surface to the hidden editor
 * 
 * This class captures keyboard, composition, and text input events from the visible
 * viewport and forwards them to the hidden ProseMirror editor. This enables input
 * handling when the actual editor is not directly visible to the user.
 * 
 * Features:
 * - Forwards keydown/keyup events
 * - Forwards composition events (for IME input)
 * - Forwards beforeinput/input/textInput events
 * - Skips forwarding in viewing mode
 */

export interface InputBridgeOptions {
  /** The window object containing the layout surface and editor target */
  windowRoot: Window;
  /** The visible HTML element that receives user input events */
  layoutSurface: HTMLElement;
  /** Callback that returns the hidden editor's DOM element where events should be forwarded */
  getTargetDom: () => HTMLElement | null;
  /** Callback that returns whether the editor is in an editable mode */
  isEditable: () => boolean;
  /** Optional callback invoked when the target editor DOM element changes */
  onTargetChanged?: (target: HTMLElement | null) => void;
}

export class InputBridge {
  #layoutSurface: HTMLElement;
  #getTargetDom: () => HTMLElement | null;
  #isEditable: () => boolean;
  #onTargetChanged?: (target: HTMLElement | null) => void;
  #listeners: Array<{ type: string; handler: EventListener; target: EventTarget; useCapture: boolean }> = [];
  #currentTarget: HTMLElement | null = null;
  #destroyed = false;

  constructor(options: InputBridgeOptions) {
    // windowRoot is accepted but not currently used (reserved for future cross-frame support)
    this.#layoutSurface = options.layoutSurface;
    this.#getTargetDom = options.getTargetDom;
    this.#isEditable = options.isEditable;
    this.#onTargetChanged = options.onTargetChanged;
  }

  /**
   * Bind all event listeners to start forwarding input
   */
  bind(): void {
    // Keyboard events
    this.#addListener('keydown', this.#forwardKeyboardEvent.bind(this), this.#layoutSurface);
    this.#addListener('keyup', this.#forwardKeyboardEvent.bind(this), this.#layoutSurface);

    // Composition events (for IME input)
    this.#addListener('compositionstart', this.#forwardCompositionEvent.bind(this), this.#layoutSurface);
    this.#addListener('compositionupdate', this.#forwardCompositionEvent.bind(this), this.#layoutSurface);
    this.#addListener('compositionend', this.#forwardCompositionEvent.bind(this), this.#layoutSurface);

    // Text input events
    this.#addListener('beforeinput', this.#forwardTextEvent.bind(this), this.#layoutSurface);
    this.#addListener('input', this.#forwardTextEvent.bind(this), this.#layoutSurface);

    // Context menu
    this.#addListener('contextmenu', this.#forwardContextMenu.bind(this), this.#layoutSurface);
  }

  /**
   * Destroy the bridge and remove all event listeners
   */
  destroy(): void {
    this.#listeners.forEach(({ type, handler, target, useCapture }) => {
      target.removeEventListener(type, handler, useCapture);
    });
    this.#listeners = [];
    this.#currentTarget = null;
    this.#destroyed = true;
  }

  /**
   * Notify the bridge that the target editor DOM element may have changed
   */
  notifyTargetChanged(): void {
    if (this.#destroyed) return;

    const nextTarget = this.#getTargetDom();
    if (nextTarget === this.#currentTarget) return;

    // Fire compositionend to complete any active composition
    if (this.#currentTarget) {
      try {
        const synthetic = new CompositionEvent('compositionend', {
          data: '',
          bubbles: true,
          cancelable: true,
        });
        this.#currentTarget.dispatchEvent(synthetic);
      } catch {
        // Ignore dispatch failures
      }
    }

    this.#currentTarget = nextTarget;
    this.#onTargetChanged?.(nextTarget);
  }

  #addListener(type: string, handler: EventListener, target: EventTarget, useCapture = false): void {
    this.#listeners.push({ type, handler, target, useCapture });
    target.addEventListener(type, handler, useCapture);
  }

  #dispatchToTarget(originalEvent: Event, synthetic: Event): void {
    if (this.#destroyed) return;

    const target = this.#getTargetDom();
    this.#currentTarget = target;
    if (!target) return;

    try {
      const canceled = !target.dispatchEvent(synthetic) || synthetic.defaultPrevented;
      if (canceled) {
        originalEvent.preventDefault();
      }
    } catch (error) {
      console.warn('[InputBridge] Failed to dispatch event to target:', error);
    }
  }

  /**
   * Forwards keyboard events to the hidden editor
   */
  #forwardKeyboardEvent(event: Event): void {
    if (!this.#isEditable()) return;
    if (!(event instanceof KeyboardEvent)) return;

    // Skip IME composition events (handled by composition events)
    if (event.isComposing) return;

    // Skip plain character keys (handled by beforeinput)
    if (event.type === 'keydown' && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      return;
    }

    const synthetic = new KeyboardEvent(event.type, {
      key: event.key,
      code: event.code,
      location: event.location,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      isComposing: event.isComposing,
      bubbles: true,
      cancelable: true,
    });

    this.#dispatchToTarget(event, synthetic);
  }

  /**
   * Forwards composition events (IME input) to the hidden editor
   */
  #forwardCompositionEvent(event: Event): void {
    if (!this.#isEditable()) return;
    if (!(event instanceof CompositionEvent)) return;

    const synthetic = new CompositionEvent(event.type, {
      data: event.data,
      bubbles: true,
      cancelable: true,
    });

    this.#dispatchToTarget(event, synthetic);
  }

  /**
   * Forwards text input events to the hidden editor
   */
  #forwardTextEvent(event: Event): void {
    if (!this.#isEditable()) return;
    if (!(event instanceof InputEvent)) return;

    const synthetic = new InputEvent(event.type, {
      data: event.data,
      inputType: event.inputType,
      isComposing: event.isComposing,
      bubbles: true,
      cancelable: true,
    });

    this.#dispatchToTarget(event, synthetic);
  }

  /**
   * Forwards context menu events
   */
  #forwardContextMenu(event: Event): void {
    // For now, just prevent default context menu on the layout surface
    // The hidden editor will handle its own context menu
    event.preventDefault();
  }
}

