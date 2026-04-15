/**
 * Shared utilities for member data analysis and statistics.
 * Provides detailed membership categorizations for dashboard and reporting.
 */

/**
 * Normalizes user data by adding computed fields.
 * @param {Array} users - Raw user array from Firebase.
 * @returns {Array} Normalized users with added fields.
 */
export function normalizeUsers(users) {
  return users.map((user) => {
    const lastPaymentDate = user.payments && user.payments.length > 0
      ? new Date(user.payments[user.payments.length - 1].dateOfPayment)
      : null;
    const firstSubmissionDate = user.dateOfSubmission
      ? new Date(user.dateOfSubmission)
      : null;

    return {
      ...user,
      lastPaymentDate,
      firstSubmissionDate,
      hasPayments: !!lastPaymentDate,
    };
  });
}

/**
 * Check if a date falls within the given year.
 * @param {Date} date - The date to check.
 * @param {string} year - The year as a string (e.g., "2026" or "All").
 * @returns {boolean} True if date is in the year or year is "All".
 */
function isInYear(date, year) {
  if (!date || year === 'All') return true;
  return date.getFullYear() === parseInt(year, 10);
}

/**
 * Check if two dates represent the same day.
 * @param {Date} date1 - First date.
 * @param {Date} date2 - Second date.
 * @returns {boolean} True if both represent the same calendar day.
 */
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.toDateString() === date2.toDateString();
}

/**
 * Computes detailed membership statistics for the dashboard.
 * @param {Array} users - Normalized user array.
 * @param {string} selectedYear - Year to filter by, or "All".
 * @returns {Object} Detailed stats object.
 */
export function computeDashboardStats(users, selectedYear = 'All') {
  const stats = {
    // Row 1
    totalMembers: users.length,

    // Row 2 - Annual Members
    annualNewMembers: 0,
    annualRenewals: 0,
    annualUnpaid: 0,
    annualTotal: 0,

    // Row 3 - Life Members
    lifeNewMembers: 0,
    lifeUpgraded: 0,
    lifeTotal: 0,

    // Row 4 - Honorary
    honoraryMembers: 0,
  };

  users.forEach((user) => {
    if (user.currentMembershipType === 'Annual') {
      // New Members: submission and last payment same day, within year
      if (
        user.lastPaymentDate &&
        isSameDay(user.firstSubmissionDate, user.lastPaymentDate) &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        stats.annualNewMembers++;
        stats.annualTotal++;
      }
      // Renewals: submission in past, last payment in year
      else if (
        user.lastPaymentDate &&
        user.firstSubmissionDate &&
        user.firstSubmissionDate < user.lastPaymentDate &&
        isInYear(user.lastPaymentDate, selectedYear)
      ) {
        stats.annualRenewals++;
        stats.annualTotal++;
      }
      // Unpaid: submission in year, no payment
      else if (
        !user.hasPayments &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        stats.annualUnpaid++;
        stats.annualTotal++;
      }
    } else if (user.currentMembershipType === 'Life') {
      // New Members: submission and last payment same day, within year
      if (
        user.lastPaymentDate &&
        isSameDay(user.firstSubmissionDate, user.lastPaymentDate) &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        stats.lifeNewMembers++;
        stats.lifeTotal++;
      }
      // Upgraded: submission in past, last payment in year
      else if (
        user.lastPaymentDate &&
        user.firstSubmissionDate &&
        user.firstSubmissionDate < user.lastPaymentDate &&
        isInYear(user.lastPaymentDate, selectedYear)
      ) {
        stats.lifeUpgraded++;
        stats.lifeTotal++;
      }
    } else if (user.currentMembershipType === 'Honorary') {
      // Honorary: submission in year
      if (isInYear(user.firstSubmissionDate, selectedYear)) {
        stats.honoraryMembers++;
      }
    }
  });

  // Calculate yearly total members
  stats.yearlyTotalMembers = stats.annualTotal + stats.lifeTotal + stats.honoraryMembers;

  return stats;
}
