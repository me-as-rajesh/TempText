const getApiBaseUrl = () => {
    // If no port is specified in the URL (e.g., in production), it defaults to port 80 (for HTTP) or 443 (for HTTPS)
    const port = window.location.port ? `:${window.location.port}` : '';
    const hostname = window.location.hostname;
  
    // Check if we are in development
    if (hostname === 'localhost') {
      return `http://localhost:3001/api`;
    } else if (hostname === '192.168.1.37') {
      return `http://192.168.1.37:3000/api`;
    } 
  
    // Construct the full API base URL dynamically
    return `https://${window.location.hostname}${port}/api`;
  };
  
  
  const config = {
    apiBaseUrl: getApiBaseUrl(),
  };
  
  export default config;
  