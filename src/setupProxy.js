const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API Proxy
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '' },
      onError: (err, req, res) => {
        console.error('API Proxy Error:', err);
        res.status(502).json({ error: 'API connection failed' });
      }
    })
  );

  // WebSocket Proxy
  app.use(
    '/ws',
    createProxyMiddleware({
      target: process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
      ws: true,
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/ws': '' },
      onError: (err, req, res) => {
        console.error('WebSocket Proxy Error:', err);
        res.status(502).json({ error: 'WebSocket connection failed' });
      }
    })
  );
};