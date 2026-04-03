const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // req.user from auth middleware has { id, role }
    const user = await User.findById(req.user.id).populate('role');
    
    if (!user) {
      console.log(`[AUTH] User not found: ${req.user.id}`);
      return res.status(403).json({ msg: 'Access denied: User not found' });
    }

    if (!user.role) {
      console.log(`[AUTH] User has no role assigned: ${user.email}`);
      return res.status(403).json({ msg: 'Access denied: No role assigned' });
    }

    const roleName = user.role.name ? user.role.name.toLowerCase() : '';
    if (roleName !== 'admin' && roleName !== 'subadmin') {
      console.log(`[AUTH] unauthorized access attempt by ${user.email} with role ${roleName}`);
      return res.status(403).json({ msg: 'Access denied: Admin privileges required' });
    }
    next();
  } catch (err) {
    console.error(`[AUTH_ERROR] ${err.message}`);
    res.status(500).json({ msg: 'Server Error in Admin Auth' });
  }
};
