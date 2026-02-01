// Database exports
export { db, formatDateRequired, formatDateOptional } from "./drizzle-client";

// Schema
export * from "./schema";

// Users
export {
  createUser,
  getUserById,
  getUserByEmail,
  getUserWithPasswordHash,
  updateUser,
  deleteUser,
  isEmailUnique,
  verifyPassword,
} from "./users";

// Locations
export {
  createLocation,
  getLocationById,
  getLocationsByUserId,
  getChildLocations,
  updateLocation,
  deleteLocation,
  isCodeUnique,
  getLocationPath,
  getLocationWithPath,
  getLocationChildCounts,
} from "./locations";
