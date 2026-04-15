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
    const lastPaymentDate =
      user.payments && user.payments.length > 0
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
  if (!date || year === "All") return true;
  return date.getFullYear() === parseInt(year, 10);
}

/**
 * Check if two dates represent the same day.
 * @param {Date} date1 - First date.
 * @param {Date} date2 - Second date.
 * @returns {boolean} True if both represent the same calendar day.
 */
/* function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.toDateString() === date2.toDateString();
} */

/**
 * Check if two dates are in the same year.
 * @param {Date} date1 - First date.
 * @param {Date} date2 - Second date.
 * @returns {boolean} True if both dates are in the same year.
 */
function isSameYear(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear();
}

/**
 * Unified function that categorizes users and provides both stats counts and filtered lists.
 * @param {Array} users - Normalized user array.
 * @param {string} selectedYear - Year to filter by, or "All".
 * @returns {Object} Object with 'stats' (counts) and 'lists' (filtered user arrays) properties.
 */
export function categorizeUsers(users, selectedYear = "All") {
  const categories = {
    totalMembers: [],
    annualNewMembers: [],
    annualRenewals: [],
    annualUnpaid: [],
    annualTotal: [],
    lifeNewMembers: [],
    lifeUpgraded: [],
    lifeTotal: [],
    honoraryMembers: [],
  };

  users.forEach((user) => {
    // Always add to total members
    categories.totalMembers.push(user);

    if (user.currentMembershipType === "Annual") {
      if (
        user.lastPaymentDate &&
        isSameYear(user.firstSubmissionDate, user.lastPaymentDate) &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        // New Members
        categories.annualNewMembers.push(user);
        categories.annualTotal.push(user);
      } else if (
        user.lastPaymentDate &&
        user.firstSubmissionDate &&
        user.firstSubmissionDate < user.lastPaymentDate &&
        isInYear(user.lastPaymentDate, selectedYear)
      ) {
        // Renewals
        categories.annualRenewals.push(user);
        categories.annualTotal.push(user);
      } else if (
        !user.hasPayments &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        // Unpaid
        categories.annualUnpaid.push(user);
        categories.annualTotal.push(user);
      }
    } else if (user.currentMembershipType === "Life") {
      if (
        user.lastPaymentDate &&
        isSameYear(user.firstSubmissionDate, user.lastPaymentDate) &&
        isInYear(user.firstSubmissionDate, selectedYear)
      ) {
        // New Members
        categories.lifeNewMembers.push(user);
        categories.lifeTotal.push(user);
      } else if (
        user.lastPaymentDate &&
        user.firstSubmissionDate &&
        user.firstSubmissionDate < user.lastPaymentDate &&
        isInYear(user.lastPaymentDate, selectedYear)
      ) {
        // Upgraded
        categories.lifeUpgraded.push(user);
        categories.lifeTotal.push(user);
      }
    } else if (
      user.currentMembershipType === "Honorary" &&
      isInYear(user.firstSubmissionDate, selectedYear)
    ) {
      categories.honoraryMembers.push(user);
    }
  });

  return {
    lists: categories,
    stats: {
      totalMembers: categories.totalMembers.length,
      annualNewMembers: categories.annualNewMembers.length,
      annualRenewals: categories.annualRenewals.length,
      annualUnpaid: categories.annualUnpaid.length,
      annualTotal: categories.annualTotal.length,
      lifeNewMembers: categories.lifeNewMembers.length,
      lifeUpgraded: categories.lifeUpgraded.length,
      lifeTotal: categories.lifeTotal.length,
      honoraryMembers: categories.honoraryMembers.length,
      yearlyTotalMembers:
        categories.annualTotal.length +
        categories.lifeTotal.length +
        categories.honoraryMembers.length,
    },
  };
}

/**
 * Legacy function for backward compatibility - computes stats only.
 * @param {Array} users - Normalized user array.
 * @param {string} selectedYear - Year to filter by, or "All".
 * @returns {Object} Stats object.
 */
export function computeDashboardStats(users, selectedYear = "All") {
  return categorizeUsers(users, selectedYear).stats;
}

/**
 * Legacy function for backward compatibility - filters users by category.
 * @param {Array} users - Normalized user array.
 * @param {string} category - Category identifier.
 * @param {string} selectedYear - Year to filter by, or "All".
 * @returns {Array} Filtered user array.
 */
export function getUsersByCategory(users, category, selectedYear = "All") {
  return categorizeUsers(users, selectedYear).lists[category] || [];
}
