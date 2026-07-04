export type CheckinStatus = 'done' | 'partial' | 'missed' | 'pending'

export type DisruptionReason =
  | 'late-night'
  | 'work-ran-long'
  | 'guests-family'
  | 'travel'
  | 'health'
  | 'forgot'
  | 'other'

export interface Checkin {
  id: string
  habitId: string
  date: string
  status: CheckinStatus
  reason?: DisruptionReason
  note?: string
  usedFallback: boolean
  loggedAt: number
}

export interface DayLog {
  date: string
  disrupted: boolean
  disruptionNote?: string
}
