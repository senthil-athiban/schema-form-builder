import { BadRequestError } from "../errors/app-error";
import type { SubmissionFilters } from "../services/submission.service";

const parseDateParam = (value: unknown, name: string): Date | undefined => {
  if (value === undefined || value === "") return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()))
    throw new BadRequestError(`${name} must be an ISO date`);
  return date;
}

const parseFilters = (query: Record<string, unknown>): SubmissionFilters => {
  const search =
    typeof query.search === "string" ? query.search.trim().slice(0, 200) : "";
  const from = parseDateParam(query.from, "from");
  const to = parseDateParam(query.to, "to");
  const sort =
    query.sort === "asc" || query.sort === "desc" ? query.sort : undefined;

  return {
    ...(search && { search }),
    ...(from && { from }),
    ...(to && { to }),
    ...(sort && { sort }),
  };
}

export {
    parseDateParam,
    parseFilters
}