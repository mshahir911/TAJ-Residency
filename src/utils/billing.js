// Hotel-Standard Noon-to-Noon Billing Day & Checkout Logic for Taj Residency PMS

/**
 * Formats a Date object into a readable deadline string:
 * e.g. "Aug 26, 12:00 PM"
 */
export function formatDeadlineDisplay(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '12:00 PM';
  return dateObj.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculates checkout deadline and nights charged according to noon-to-noon hotel rules.
 * 
 * Rules:
 * 1. Standard checkout time is 12:00 PM IST (noon).
 * 2. For a check-in on date D (at any time of day or night), Night 1 deadline is 12:00 PM on D+1.
 *    A guest checking in at 11 PM, 2 AM, or 9 AM is charged for 1 night as long as they leave
 *    by 12:00 PM the day after their check-in date. Late night check-in does NOT trigger an extra charge.
 * 3. For each additional night N, the deadline is 12:00 PM on (check-in date + N days).
 * 4. Nights charged = the smallest N where actual checkout timestamp is <= Night-N deadline.
 *    If checkout is past a deadline (e.g. 12:05 PM or 3:00 PM), round up to the next full night.
 * 
 * @param {Object} params
 * @param {string|Date} params.checkInDate - ISO string or YYYY-MM-DD
 * @param {number} params.plannedNights - Booked nights (default 1)
 * @param {Date|string} params.checkoutTimestamp - Actual checkout time (defaults to Date.now())
 */
export function calculateCheckoutBilling({
  checkInDate,
  plannedNights = 1,
  checkoutTimestamp = new Date()
}) {
  const baseDateStr = (checkInDate || new Date().toISOString()).slice(0, 10);
  const [year, month, day] = baseDateStr.split('-').map(Number);

  // Helper to construct exact 12:00:00.000 PM noon deadline for Night N
  const getDeadlineForNight = (n) => {
    // Check-in date + n days at 12:00 PM local time
    return new Date(year, month - 1, day + n, 12, 0, 0, 0);
  };

  const planned = Math.max(1, Number(plannedNights) || 1);
  const scheduledDeadline = getDeadlineForNight(planned);

  const actualTime = checkoutTimestamp instanceof Date
    ? checkoutTimestamp
    : new Date(checkoutTimestamp || Date.now());
  const actualMs = isNaN(actualTime.getTime()) ? Date.now() : actualTime.getTime();

  // Find the smallest N (>= 1) where actual checkout <= Night-N deadline (12:00 PM)
  let billableNights = 1;
  while (actualMs > getDeadlineForNight(billableNights).getTime()) {
    billableNights++;
    if (billableNights > 365) break; // Safeguard
  }

  // Final nights charged is at least the planned nights (if guest checks out early),
  // but if they stayed past the deadline, billableNights rounds up to the next night.
  const finalNightsCharged = Math.max(planned, billableNights);
  const isOverdue = actualMs > scheduledDeadline.getTime();
  const overdueByMs = Math.max(0, actualMs - scheduledDeadline.getTime());
  const overdueHours = Math.floor(overdueByMs / (1000 * 60 * 60));
  const overdueMinutes = Math.floor((overdueByMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    checkInDate: baseDateStr,
    plannedNights: planned,
    scheduledDeadline,
    scheduledDeadlineDisplay: formatDeadlineDisplay(scheduledDeadline),
    actualCheckoutTime: actualTime,
    billableNights: finalNightsCharged,
    isOverdue,
    overdueHours,
    overdueMinutes,
    isExtraNightCharged: finalNightsCharged > planned,
    extraNights: Math.max(0, finalNightsCharged - planned)
  };
}
