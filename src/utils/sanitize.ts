export const sanitizeInput = (str: string | undefined | null, maxLen = 1000): string => {
  if (!str || typeof str !== 'string') return '';
  // Remove common HTML tags to prevent XSS and limit length
  return str.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

export const sanitizeFormData = (data: any, maxKeys = 50): any => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  
  const sanitized: any = {};
  let keyCount = 0;
  
  for (const [key, value] of Object.entries(data)) {
    if (keyCount >= maxKeys) break; // Prevent massive JSON objects
    
    // Sanitize the key itself
    const safeKey = sanitizeInput(key, 50);
    if (!safeKey) continue;

    if (typeof value === 'string') {
      sanitized[safeKey] = sanitizeInput(value, 2000); // Prevent massive string values
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[safeKey] = value; 
    }
    // Deeply nested objects or arrays are dropped for security in formData
    keyCount++;
  }
  return sanitized;
}
