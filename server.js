const http = require("http");
const httpProxy = require("http-proxy");
const path = require("path");
const fs = require("fs");
const url = require("url");

// Configuration
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, "public");

// Create proxy for API requests
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true
});

// Helper to serve static files
function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    // Set content type based on file extension
    const ext = path.extname(filePath);
    let contentType = "text/html";
    switch (ext) {
      case ".js":
        contentType = "text/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".json":
        contentType = "application/json";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// Create main server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  // Handle API requests
  if (parsedUrl.pathname && parsedUrl.pathname.startsWith("/api")) {
    proxy.web(req, res, {}, (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway' }));
    });
    return;
  }

  // Serve static files
  let filePath = path.join(
    PUBLIC_DIR,
    parsedUrl.pathname === "/" ? "index.html" : parsedUrl.pathname
  );

  // If the requested path doesn't have an extension and doesn't exist,
  // try adding .html extension
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    const htmlPath = filePath + ".html";
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    }
  }

  // Check if it's a directory and serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  serveStaticFile(filePath, res);
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Main server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from ${PUBLIC_DIR}`);
  console.log(`🔀 Proxying /api requests to http://localhost:${API_PORT}`);
});