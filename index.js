const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const { Command } = require('commander');
const NodeCache = require('node-cache');

const program = new Command();
const cache = new NodeCache();

program
  .option('--port <number>', 'Port on which the caching proxy server will run')
  .option('--origin <url>', 'URL of the server to which the requests will be forwarded')
  .option('--clear-cache', 'Clear the cache');

program.parse(process.argv);

const options = program.opts();

if (options.clearCache) {
  cache.flushAll();
  console.log('Cache cleared');
  process.exit(0);
}

if (!options.port || !options.origin) {
  console.error('Please specify both --port and --origin options.');
  process.exit(1);
}

const proxy = httpProxy.createProxyServer({});

// Handle proxy responses
proxy.on('proxyRes', (proxyRes, req, res) => {
  let body = [];
  proxyRes.on('data', (chunk) => {
    body.push(chunk);
  });

  proxyRes.on('end', () => {
    body = Buffer.concat(body);
    const headers = proxyRes.headers;

    // Log the status code
    console.log(`Proxy response for ${req.url}: ${proxyRes.statusCode}`);

    // Handle 304 response
    if (proxyRes.statusCode === 304) {
      console.log(`304 Not Modified for ${req.url}`);
      // Fetch the cached response
      const cachedResponse = cache.get(req.url);
      if (cachedResponse) {
        console.log(`Serving cached response for ${req.url}`);
        res.writeHead(200, { 'X-Cache': 'HIT', ...cachedResponse.headers });
        res.end(cachedResponse.body);
      } else {
        res.writeHead(404); // Not found if nothing is cached
        res.end();
      }
      return;
    }

    // Cache the original response if it's a 200 OK
    if (proxyRes.statusCode === 200) {
      cache.set(req.url, { body, headers });
      console.log(`Caching response for ${req.url}`);
    }

    // Send the response to the client
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, { 'X-Cache': 'MISS', ...headers });
      res.end(body);
    }
  });
});

// Create the server
const server = http.createServer((req, res) => {
  const cacheKey = req.url;

  // Ignore favicon requests
  if (req.url.endsWith('/favicon.ico')) {
    res.writeHead(204); // No content
    res.end();
    return;
  }

  // Check cache
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    console.log(`Cache hit for ${cacheKey}`);
    res.writeHead(200, { 'X-Cache': 'HIT', ...cachedResponse.headers });
    res.end(cachedResponse.body);
    return;
  }

  // Forward request to the origin server
  proxy.web(req, res, { target: options.origin, changeOrigin: true }, (error) => {
    console.error('Proxy error:', error);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Proxy error');
    }
  });
});

// Start the server
server.listen(options.port, () => {
  console.log(`Caching proxy server is running on http://localhost:${options.port}`);
});


