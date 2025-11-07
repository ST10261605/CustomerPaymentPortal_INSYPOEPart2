export const validateSession = async (req, res, next) => {
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session found' });
  }
  
  try {
    const session = await req.sessionStore.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.session = session;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Session validation error' });
  }
};