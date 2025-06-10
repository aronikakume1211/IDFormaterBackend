const errorHandler = (err, req, res, next) => {
    // Check if error exists
    if (!err) {
      return next();
    }
  
    // Use 401 for unauthorized
    if (err.name === "UnauthorizedError") {
      return res.status(401).json({
        success: false,
        message: "You are not allowed to access this resource",
      });
    }
    // validation error
    if (err.name === "ValidationError") {
      return res.status(401).json({ message: err });
    }
  
    // default to 500 server error
    return res.status(500).json(err);
  };
  
  module.exports = errorHandler;
  