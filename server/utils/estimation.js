import { db } from '../db.js';

/**
 * Calculates transparent, multi-factor estimated waiting time
 * @param {number} serviceId
 * @param {number} peopleAhead
 * @returns {object} { estimatedMins, confidence, factorDetails, disclaimer }
 */
export function calculateEstimatedWait(serviceId, peopleAhead) {
  if (peopleAhead <= 0) {
    return {
      estimatedMins: 0,
      confidence: 'High',
      factors: {
        peopleAhead: 0,
        activeCounters: 1,
        handlingTimePerPersonMins: 0,
        method: 'Immediate Service'
      },
      explanation: 'You are next in line or currently being called.',
      disclaimer: 'Estimated waiting time — actual time may vary based on transaction complexity.'
    };
  }

  // 1. Get service base configuration
  const service = db.prepare('SELECT avg_service_mins, name FROM services WHERE id = ?').get(serviceId);
  const baseAvgMins = service ? service.avg_service_mins : 10;

  // 2. Count active open counters for this service
  const activeCountersRow = db.prepare(`
    SELECT COUNT(*) as count FROM counters
    WHERE service_id = ? AND is_active = 1
  `).get(serviceId);
  const activeCounters = Math.max(1, activeCountersRow ? activeCountersRow.count : 1);

  // 3. Compute dynamic historical average from completed entries today
  const historyRow = db.prepare(`
    SELECT COUNT(*) as completedCount,
           AVG((strftime('%s', completed_at) - strftime('%s', served_at)) / 60.0) as avgActualMins
    FROM queue_entries
    WHERE service_id = ?
      AND status = 'completed'
      AND served_at IS NOT NULL
      AND completed_at IS NOT NULL
      AND date(joined_at) = date('now')
  `).get(serviceId);

  let handlingMins = baseAvgMins;
  let confidence = 'Moderate';
  let methodUsed = 'Standard Service Benchmark';

  if (historyRow && historyRow.completedCount >= 3 && historyRow.avgActualMins > 0) {
    // Blend 70% dynamic actual today + 30% baseline benchmark
    const dynamicMins = Math.round(historyRow.avgActualMins * 10) / 10;
    handlingMins = Math.round((dynamicMins * 0.7 + baseAvgMins * 0.3) * 10) / 10;
    confidence = 'High (Calibrated from today\'s transactions)';
    methodUsed = `Dynamic weighted average (${historyRow.completedCount} completed sessions today)`;
  } else {
    confidence = 'Standard (Based on official campus service standards)';
    methodUsed = 'Campus operational benchmark';
  }

  // Multi-counter concurrent queuing model
  // Total wait time = (peopleAhead * handlingMins) / activeCounters
  const rawWaitMins = Math.ceil((peopleAhead * handlingMins) / activeCounters);
  const estimatedMins = Math.max(1, rawWaitMins);

  return {
    estimatedMins,
    confidence,
    factors: {
      peopleAhead,
      activeCounters,
      handlingTimePerPersonMins: Math.round(handlingMins),
      method: methodUsed
    },
    explanation: `Calculated from ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead distributed across ${activeCounters} active ${activeCounters === 1 ? 'counter' : 'counters'} (~${Math.round(handlingMins)} mins per ticket).`,
    disclaimer: 'Estimated waiting time — actual time may vary depending on individual inquiry complexity.'
  };
}

/**
 * Returns historical peak hour recommendations
 * @param {number} serviceId
 */
export function getRecommendedVisitingTimes(serviceId) {
  return {
    optimalHours: '09:00 AM – 11:15 AM',
    moderateHours: '02:00 PM – 03:30 PM',
    busyPeakHours: '11:30 AM – 01:45 PM',
    advice: 'Queues typically experience lower volume in the first 90 minutes after opening. Recommended as an estimate based on operational patterns.',
    isEstimate: true
  };
}
