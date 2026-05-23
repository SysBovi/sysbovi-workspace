export function differenceInMonths(dateA: Date, dateB: Date): number {
  const years = dateA.getFullYear() - dateB.getFullYear();
  const months = dateA.getMonth() - dateB.getMonth();
  return years * 12 + months;
}

export function differenceInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay);
}
