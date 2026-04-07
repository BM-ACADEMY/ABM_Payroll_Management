const User = require('../models/User');

/**
 * Middleware to check if a user has a specific permission.
 * Admins always bypass this check.
 * @param {string} resource - The resource being accessed (e.g., 'employees', 'payroll').
 * @param {string} action - The action being performed (e.g., 'read', 'create', 'update', 'delete').
 */
module.exports = (resource, action) => {
  return async (req, res, next) => {
    try {
      // req.user is set by auth middleware, but we need to populate role permissions
      const user = await User.findById(req.user.id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({ msg: 'Access denied: No role assigned' });
      }

      const roleName = user.role.name.toLowerCase();
      
      // Admin always has all permissions
      if (roleName === 'admin') {
        return next();
      }

      // If user is not admin and doesn't have the specific permission
      const requiredPermission = `${resource}:${action}`;
      
      const hasPermission = 
        (user.permissions && user.permissions.includes(requiredPermission)) ||
        (user.role.permissions && user.role.permissions.includes(requiredPermission));

      if (!hasPermission) {
        console.log(`[AUTH] Permission denied for ${user.email}: missing ${requiredPermission}`);
        return res.status(403).json({ msg: `Access denied: Missing permission ${requiredPermission}` });
      }

      next();
    } catch (err) {
      console.error(`[PERMISSION_ERROR] ${err.message}`);
      res.status(500).json({ msg: 'Server Error in Permission Auth' });
    }
  };
};
