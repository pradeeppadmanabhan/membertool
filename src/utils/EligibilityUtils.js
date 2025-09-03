// Define the eligibility duration as a constant (in years)
export const LIFE_MEMBERSHIP_ELIGIBILITY_YEARS = 1;

// Utility function to check if a user is eligible for life membership
export const isEligibleForLifeMembership = (joiningDate) => {
  if (!joiningDate) return false;

  const today = new Date();
  const eligibilityDate = new Date(joiningDate);

  // Add the eligibility duration to the joining date
  eligibilityDate.setFullYear(
    eligibilityDate.getFullYear() + LIFE_MEMBERSHIP_ELIGIBILITY_YEARS
  );

  //console.log("Eligibility Date:", eligibilityDate);
  //console.log("Today's Date:", today);

  // Check if the current date is on or after the eligibility date
  return today >= eligibilityDate;
};
