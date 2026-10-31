const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const countryName = (code: string): string => {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

// Currency codes rather than symbols: "$" alone is ambiguous (USD, AUD, CAD, SGD, MXN).
// The API sends salary as a string; it is converted to a number for display only.
export const formatSalary = (amount: string, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(Number(amount));

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Dates arrive as "YYYY-MM-DD"; parsing and formatting in UTC avoids off-by-one days.
export const formatDate = (isoDate: string): string =>
  dateFormat.format(new Date(`${isoDate}T00:00:00Z`));

export const formatCount = (value: number): string =>
  value.toLocaleString("en-US");
