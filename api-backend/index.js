const { handleRequest } = require('../api/dist/serverless-handler');

module.exports = async (req, res) => {
  // Convert Vercel request/response to Node.js IncomingMessage/ServerResponse format
  req.url = req.url || req.query.path ? `/api/${req.query.path}` : '/api';
  
  // Ensure body is parsed
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Body is not JSON
    }
  }
  
  // Create a mock IncomingMessage with the parsed body
  const mockReq = {
    ...req,
    url: req.url,
    method: req.method,
    headers: req.headers,
    on: (event, callback) => {
      if (event === 'data' && req.body) {
        callback(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      }
      if (event === 'end') {
        callback();
      }
    }
  };

  // Create response wrapper
  const mockRes = {
    writeHead: (statusCode, headers) => {
      res.status(statusCode);
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
    },
    end: (data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          res.json(parsed);
        } catch (e) {
          res.send(data);
        }
      } else {
        res.end();
      }
    },
    setHeader: (key, value) => res.setHeader(key, value),
    getHeader: (key) => res.getHeader(key)
  };

  await handleRequest(mockReq, mockRes);
};