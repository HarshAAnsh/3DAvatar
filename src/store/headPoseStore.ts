import { create } from 'zustand'

interface HeadPoseState {
  pitch: number
  yaw: number
  roll: number

  tracking: boolean

  setPose: (
    pitch: number,
    yaw: number,
    roll: number
  ) => void

  setTracking: (
    tracking: boolean
  ) => void
}

export const useHeadPoseStore =
  create<HeadPoseState>((set) => ({
    pitch: 0,
    yaw: 0,
    roll: 0,

    tracking: false,

    setPose: (
      pitch,
      yaw,
      roll
    ) =>
      set({
        pitch,
        yaw,
        roll,
      }),

    setTracking: (tracking) =>
      set({
        tracking,
      }),
  }))