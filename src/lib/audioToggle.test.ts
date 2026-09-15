import { describe, expect, it } from 'vitest'
import {
  INITIAL_AUDIO_STATE,
  audioLabel,
  audioReducer,
  shouldLoadAudio,
  type AudioState,
} from './audioToggle'

const LABELS = { listen: 'Listen', mute: 'Mute' } as const

describe('audioReducer', () => {
  it('starts off, unrequested and unfailed', () => {
    expect(INITIAL_AUDIO_STATE).toEqual({ active: false, requested: false, failed: false })
    expect(shouldLoadAudio(INITIAL_AUDIO_STATE)).toBe(false)
    expect(audioLabel(INITIAL_AUDIO_STATE, LABELS)).toBe('Listen')
  })

  it('activates on the first press and marks the source as requested', () => {
    const next = audioReducer(INITIAL_AUDIO_STATE, { type: 'toggle' })
    expect(next).toEqual({ active: true, requested: true, failed: false })
    expect(shouldLoadAudio(next)).toBe(true)
    expect(audioLabel(next, LABELS)).toBe('Mute')
  })

  it('mutes on the second press but keeps the source loaded', () => {
    const on = audioReducer(INITIAL_AUDIO_STATE, { type: 'toggle' })
    const off = audioReducer(on, { type: 'toggle' })
    expect(off).toEqual({ active: false, requested: true, failed: false })
    expect(shouldLoadAudio(off)).toBe(true)
  })

  it('falls silent when the track ends or the tab is hidden', () => {
    const on = audioReducer(INITIAL_AUDIO_STATE, { type: 'toggle' })
    expect(audioReducer(on, { type: 'ended' }).active).toBe(false)
    expect(audioReducer(on, { type: 'hidden' }).active).toBe(false)
  })

  it('returns the same state for ended and hidden while already off', () => {
    expect(audioReducer(INITIAL_AUDIO_STATE, { type: 'ended' })).toBe(INITIAL_AUDIO_STATE)
    expect(audioReducer(INITIAL_AUDIO_STATE, { type: 'hidden' })).toBe(INITIAL_AUDIO_STATE)
  })

  it('stays off after an error and ignores further presses', () => {
    const on = audioReducer(INITIAL_AUDIO_STATE, { type: 'toggle' })
    const failed = audioReducer(on, { type: 'error' })
    expect(failed).toEqual({ active: false, requested: true, failed: true })
    expect(shouldLoadAudio(failed)).toBe(false)
    expect(audioReducer(failed, { type: 'toggle' })).toBe(failed)
    expect(audioLabel(failed, LABELS)).toBe('Listen')
  })

  it('never mutates the state it is given', () => {
    const state: AudioState = { ...INITIAL_AUDIO_STATE }
    audioReducer(state, { type: 'toggle' })
    expect(state).toEqual(INITIAL_AUDIO_STATE)
  })
})
