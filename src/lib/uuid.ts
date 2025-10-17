import { v7 as uuidv7 } from "uuid";

/**
 * Generate a UUIDv7 (time-based UUID)
 * UUIDv7 includes timestamp information and is more sortable than UUIDv4
 */
export function generateId(): string {
  return uuidv7();
}

/**
 * Generate multiple UUIDs at once
 */
export function generateIds(count: number): string[] {
  return Array.from({ length: count }, () => uuidv7());
}
