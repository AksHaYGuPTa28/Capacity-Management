interface DatedAllocation {
  startDate: Date;
  endDate: Date | null;
}

export function isAllocationActiveOn(alloc: DatedAllocation, date: Date): boolean {
  return alloc.startDate <= date && (!alloc.endDate || alloc.endDate >= date);
}

/** Filters allocations down to the ones active "now" (or a given date). Allocations carry
 * date ranges, so a resource's full allocation history should never be summed as current load. */
export function currentAllocations<T extends DatedAllocation>(allocations: T[], date: Date = new Date()): T[] {
  return allocations.filter((a) => isAllocationActiveOn(a, date));
}
