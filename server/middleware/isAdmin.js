const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // req.user from auth middleware has { id, role: { name, permissions } } if populated, 
    // or just an ObjectId. Let's fetch the user to be sure.
    const user = await User.findById(req.user.id).populate('role');
    if (!user || (user.role.name !== 'admin' && user.role.name !== 'subadmin')) {
      return res.status(403).json({ msg: 'Access denied: Admin privileges required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server Error in Admin Auth' });
  }
};
