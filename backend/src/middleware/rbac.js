// Role-Based Access Control middleware

// Allow only specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Admin roles shortcut
exports.adminOnly = exports.authorize('admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support');
exports.superAdminOnly = exports.authorize('superadmin');
exports.contentManager = exports.authorize('admin', 'superadmin', 'sub_admin', 'content_manager');
exports.questionCreator = exports.authorize('admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator');
