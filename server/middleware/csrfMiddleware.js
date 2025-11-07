import csrf from "csurf";

// Enhanced CSRF configuration
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  }
});

// Custom CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  console.log('CSRF Token violation:', {
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  res.status(403).json({
    error: 'Invalid CSRF token',
    message: 'Form tampered with or session expired'
  });
};

// CSRF token endpoint
const getCsrfToken = (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken(),
    message: 'CSRF token generated successfully'
  });
};

export { csrfProtection, csrfErrorHandler, getCsrfToken };