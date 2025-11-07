/**
 * Custom NoSQL injection protection middleware
 * Removes MongoDB operators from request objects
 */
export default function noSqlSanitize(req, res, next) {
  try {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      // List of dangerous MongoDB operators
      const dangerousKeys = ['$where', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$and', '$or', '$not', '$nor', '$exists', '$type', '$expr', '$jsonSchema', '$mod', '$regex', '$text', '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$all', '$elemMatch', '$size', '$bitsAllClear', '$bitsAllSet', '$bitsAnyClear', '$bitsAnySet', '$comment', '$meta', '$slice'];
      
      for (const key in obj) {
        if (dangerousKeys.includes(key)) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      sanitize(req.body);
    }
    
    next();
  } catch (err) {
    console.error("NoSQL sanitization error:", err);
    next(err);
  }
}