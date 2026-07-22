/** Zeffy campaign URLs — payment lives on Zeffy; roster stays on CourtQuest. */

export const ZEFFY = {
  donate: "https://www.zeffy.com/en-US/donation-form/courtquest-donation",
  team: "https://www.zeffy.com/en-US/ticketing/midsummer-madness-pickleball-tournament-team-registration",
  individual: "https://www.zeffy.com/en-US/ticketing/midsummer-madness-tournament-courtquest",
} as const;

/** Entry fees in cents (matches Zeffy ticket prices). */
export const ENTRY_FEE_CENTS = {
  duo: 6000, // $60 team
  individual: 3000, // $30 solo
} as const;

export type RegistrationKind = keyof typeof ENTRY_FEE_CENTS;

export function feeLabel(kind: RegistrationKind) {
  return `$${(ENTRY_FEE_CENTS[kind] / 100).toFixed(0)}`;
}

export function zeffyUrlFor(kind: RegistrationKind) {
  return kind === "duo" ? ZEFFY.team : ZEFFY.individual;
}
