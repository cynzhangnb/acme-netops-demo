// 24-hour traffic data for Boston DC
const hours = Array.from({ length: 25 }, (_, i) => {
  const h = (new Date().getHours() - 24 + i + 24) % 24
  return `${String(h).padStart(2, '0')}:00`
})

function randBetween(min, max) {
  return Math.round(min + Math.random() * (max - min))
}

export const bostonTraffic24h = hours.map((time, i) => {
  // Simulate a business-hours traffic pattern
  const isPeakHour = i >= 8 && i <= 18
  const isEarlyMorning = i < 6
  const base = isEarlyMorning ? 120 : isPeakHour ? 680 : 340
  const jitter = randBetween(-60, 60)
  return {
    time,
    inbound: Math.max(40, base + jitter),
    outbound: Math.max(30, Math.round((base + jitter) * 0.72)),
    threshold: 900,
  }
})

export const bostonTrafficWeekly = [
  { day: 'Mon', peak: 820, avg: 540 },
  { day: 'Tue', peak: 890, avg: 610 },
  { day: 'Wed', peak: 740, avg: 490 },
  { day: 'Thu', peak: 950, avg: 680 },
  { day: 'Fri', peak: 870, avg: 590 },
  { day: 'Sat', peak: 310, avg: 180 },
  { day: 'Sun', peak: 260, avg: 150 },
]
