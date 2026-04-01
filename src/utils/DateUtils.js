import { format } from "date-fns";

export const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  const parsedDate =
    dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return format(parsedDate, "dd-MMM-yyyy");
};
