export const formatEventDate = (input: string) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatConfidence = (value: number) => {
  if (!Number.isFinite(value)) return "--";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}% match`;
};
