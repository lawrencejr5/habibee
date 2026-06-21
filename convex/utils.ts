export const getDaysDifference = (oldDate: string, newDate: string) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(oldDate);
  const secondDate = new Date(newDate);

  // Math.round ensures we handle daylight savings oddities
  return Math.round(
    Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)
  );
};

export const getFirstDayOfTheWeek = () => {
  const now = new Date();
  const day_number = now.getDay();

  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day_number);

  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
