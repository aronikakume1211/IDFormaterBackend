
function toEthiopianDate(date = new Date(), addYears = 0) {
  const GREGORIAN_EPOCH = 1721426;
  const ETHIOPIAN_EPOCH = 1723856;

  function isLeapGregorian(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  function gregorianToJDN(year, month, day) {
    return (
      GREGORIAN_EPOCH - 1 +
      365 * (year - 1) +
      Math.floor((year - 1) / 4) -
      Math.floor((year - 1) / 100) +
      Math.floor((year - 1) / 400) +
      Math.floor((367 * month - 362) / 12 +
        (month <= 2
          ? 0
          : isLeapGregorian(year)
          ? -1
          : -2) +
        day)
    );
  }

  function jdnToEthiopian(jdn) {
    const r = (jdn - ETHIOPIAN_EPOCH) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    const year =
      4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) +
      Math.floor(r / 365) -
      Math.floor(r / 1460);

    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;

    return {
      year: year  + addYears, 
      month,
      day,
    };
  }

  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1; // JS month is 0-based
  const gDay = date.getDate();

  const jdn = gregorianToJDN(gYear, gMonth, gDay);
  const { year, month, day } = jdnToEthiopian(jdn);

  const paddedMonth = month.toString().padStart(2, "0");
  const paddedDay = day.toString().padStart(2, "0");

  return `${paddedDay}/${paddedMonth}/${year}`;
}

/**
 * Get the expiration date in Ethiopian calendar format.
 * Defaults to the current date if no date is provided.
 */
const enExpirDate = (date = new Date()) => {
  let day = date.getDate();
  let month = date.getMonth() + 1; // Add 1 since months are 0-indexed
  const year = date.getFullYear() + 8;

  if (day < 10) day = `0${day}`;
  if (month < 10) month = `0${month}`;

  return `${day}/${month}/${year}`;
};

/**
 * Convert a given date to Ethiopian calendar format.
 * Defaults to the current date if no date is provided.
 */
const enIssueDate = (date = new Date()) => {
  let day = date.getDate();
  let month = date.getMonth() + 1; // Add 1 since months are 0-indexed
  const year = date.getFullYear();

  if (day < 10) day = `0${day}`;
  if (month < 10) month = `0${month}`;

  return `${day}/${month}/${year}`;
};

// 🟢 Example Usage:
const todayEthiopian = () => {
  return toEthiopianDate(new Date()); // e.g. "16/08/2017"
};
const expiryEthiopian = () => {
  return toEthiopianDate(new Date(), 8); // e.g. "16/08/2025"
};

module.exports = {
  expiryEthiopian,
  todayEthiopian,
  enExpirDate,
  enIssueDate,
};
