import { describe, expect, it } from 'vitest'
import {
  decideAmbientEligibility,
  MIN_DEVICE_MEMORY_GB,
  type AmbientEnv,
} from './ambientEligibility'

const ELIGIBLE: AmbientEnv = {
  motionOk: true,
  desktopPointer: true,
  webgl2: true,
  saveData: undefined,
  deviceMemory: undefined,
}

describe('decideAmbientEligibility', () => {
  it('mounts when motion is allowed, on a fine-pointer desktop, with WebGL2 and nothing reported', () => {
    expect(decideAmbientEligibility(ELIGIBLE)).toBe(true)
  })

  it('does not mount when the user prefers reduced motion', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, motionOk: false })).toBe(false)
  })

  it('does not mount on a narrow viewport or a coarse pointer', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, desktopPointer: false })).toBe(false)
  })

  it('does not mount without WebGL2', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, webgl2: false })).toBe(false)
  })

  it('does not mount when the connection asks to save data', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, saveData: true })).toBe(false)
  })

  it('treats an explicit saveData of false like unreported', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, saveData: false })).toBe(true)
  })

  it('does not mount when reported device memory is below the floor', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, deviceMemory: MIN_DEVICE_MEMORY_GB - 2 })).toBe(
      false
    )
  })

  it('mounts at exactly the device memory floor', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, deviceMemory: MIN_DEVICE_MEMORY_GB })).toBe(true)
  })

  it('mounts when device memory is unreported (Safari, Firefox)', () => {
    expect(decideAmbientEligibility({ ...ELIGIBLE, deviceMemory: undefined })).toBe(true)
  })

  it('returns false when every guard fails at once', () => {
    const hostile: AmbientEnv = {
      motionOk: false,
      desktopPointer: false,
      webgl2: false,
      saveData: true,
      deviceMemory: 1,
    }
    expect(decideAmbientEligibility(hostile)).toBe(false)
  })
})
