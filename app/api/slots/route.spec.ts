import { describe, it, expect } from 'vitest'
import { toMinutes, toLabel, getZurichTime, buildSlots, computeBreakIntervals, computeBookedIntervals, computeNowZurich, parseQuery } from './route'

describe('slots helpers', () => {
  it('toMinutes parses HH:MM', () => {
    expect(toMinutes('00:00')).toBe(0)
    expect(toMinutes('01:30')).toBe(90)
    expect(toMinutes('23:59')).toBe(23 * 60 + 59)
    expect(toMinutes('xx:yy')).toBe(0)
  })

  it('toLabel formats minutes to HH:MM', () => {
    expect(toLabel(0)).toBe('00:00')
    expect(toLabel(75)).toBe('01:15')
  })

  it('getZurichTime uses ":" separator', () => {
    const d = new Date('2025-01-01T10:15:00Z')
    const s = getZurichTime(d)
    expect(s.includes(':')).toBe(true)
  })

  it('computeBreakIntervals returns range when bs < be', () => {
    expect(computeBreakIntervals({ breakStart: '12:00', breakEnd: '12:30' })).toEqual([{ start: 12 * 60, end: 12 * 60 + 30 }])
    expect(computeBreakIntervals({ breakStart: '12:30', breakEnd: '12:00' })).toEqual([])
  })

  it('computeBookedIntervals maps bookings to intervals', () => {
    const intervals = computeBookedIntervals([{ date: new Date('2025-01-01T12:00:00Z'), service: { duration: 30 } }])
    expect(intervals[0].end - intervals[0].start).toBe(30)
  })

  it('buildSlots marks overlaps, closing and past', () => {
    const booked = [{ start: 9 * 60, end: 9 * 60 + 30 }]
    const breaks = [{ start: 10 * 60, end: 10 * 60 + 15 }]
    const manual = [{ start: 11 * 60, end: 11 * 60 + 30 }]
    const slots = buildSlots(8 * 60, 12 * 60, 30, booked, breaks, manual, 8 * 60 + 10, true)
    const nineAm = slots.find((s) => s.time === '09:00')
    const tenAm = slots.find((s) => s.time === '10:00')
    const elevenAm = slots.find((s) => s.time === '11:00')
    expect(nineAm?.isBooked).toBe(true)
    expect(tenAm?.isBooked).toBe(true)
    expect(elevenAm?.isBooked).toBe(true)
  })

  it('computeNowZurich returns isToday/nowMinutes', () => {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
    const y = parts.find((p) => p.type === 'year')?.value ?? String(now.getFullYear())
    const m = parts.find((p) => p.type === 'month')?.value ?? String(now.getMonth() + 1).padStart(2, '0')
    const d = parts.find((p) => p.type === 'day')?.value ?? String(now.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const res = computeNowZurich(now, dateStr)
    expect(res.isToday).toBe(true)
    expect(typeof res.nowMinutesZurich).toBe('number')
  })

  it('parseQuery reads params with defaults', () => {
    const sp = new URLSearchParams({ date: '2025-01-01', duration: '45' })
    const r = parseQuery(sp)
    expect(r.dateStr).toBe('2025-01-01')
    expect(r.serviceDuration).toBe(45)
  })
})

