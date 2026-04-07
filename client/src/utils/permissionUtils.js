/**
 * Helper to check if a user has a specific permission string.
 * @param {object} user - The user object from auth context.
 * @param {string} permission - e.g. 'employees:create'
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  if (user.role.name === 'admin') return true;
  
  const perms = user.permissions || user.role.permissions || [];
  return perms.includes(permission);
};
