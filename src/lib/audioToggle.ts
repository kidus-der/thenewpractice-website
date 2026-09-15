/**
 * State for the hero's Listen / Mute toggle (docs/04 forbidden list: audio
 * never autoplays; docs/08 §Audio: loaded on first activation only, default
 * off, `aria-pressed` on the button). Pure, so the component is a thin shell
 * around it and the rules are unit-tested without an <audio> element.
 */
export type AudioState = Readonly<{
  /** The listener has asked for sound. Off until the first press, always. */
  active: boolean
  /** The source has been requested at least once; never before the first press. */
  requested: boolean
  /** The element reported it cannot play; the toggle stays but does nothing. */
  failed: boolean
}>

export type AudioAction =
  { type: 'toggle' } | { type: 'ended' } | { type: 'error' } | { type: 'hidden' }

export const INITIAL_AUDIO_STATE: AudioState = { active: false, requested: false, failed: false }

export function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'toggle':
      if (state.failed) return state
      return { ...state, active: !state.active, requested: true }
    case 'ended':
    case 'hidden':
      return state.active ? { ...state, active: false } : state
    case 'error':
      return { active: false, requested: state.requested, failed: true }
  }
}

export type AudioLabels = Readonly<{ listen: string; mute: string }>

/** The button reads what pressing it will do, not what it is doing. */
export function audioLabel(state: AudioState, labels: AudioLabels): string {
  return state.active ? labels.mute : labels.listen
}

/** Whether the <audio> should carry its `src` yet: only after the first press. */
export const shouldLoadAudio = (state: AudioState): boolean => state.requested && !state.failed
