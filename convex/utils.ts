export const getDaysDifference = (oldDate: string, newDate: string) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(oldDate);
  const secondDate = new Date(newDate);

  // Math.round ensures we handle daylight savings oddities
  return Math.round(
    Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)
  );
};
