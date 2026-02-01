// Database exports
export { getDb, closeDb, toCamelCase, toSnakeCase } from "./client";

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
