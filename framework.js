const http = require('http');
const EventEmitter = require('events');

class App {
  constructor() {
    this.routes = { GET: [], POST: [], PUT: [], PATCH: [], DELETE: [] };
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  _register(method, path, handler) {
    this.routes[method].push({
      path,
      handler,
      params: []
    });
  }

  get(path, handler) {
    this._register('GET', path, handler);
  }

  post(path, handler) {
    this._register('POST', path, handler);
  }

  put(path, handler) {
    this._register('PUT', path, handler);
  }

  patch(path, handler) {
    this._register('PATCH', path, handler);
  }

  delete(path, handler) {
    this._register('DELETE', path, handler);
  }

  _parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch {
          req.body = {};
        }
        resolve();
      });
    });
  }

  _parseUrl(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    req.query = Object.fromEntries(url.searchParams);
    req.pathname = url.pathname;
  }

  _matchRoute(method, pathname) {
    const routes = this.routes[method];
    for (const route of routes) {
      const routeParts = route.path.split('/');
      const pathParts = pathname.split('/');
      
      if (routeParts.length !== pathParts.length) continue;
      
      const params = {};
      let match = true;
      
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].slice(1);
          params[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  _handleRequest(req, res) {
    req.params = {};
    
    res.send = (data) => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(String(data));
    };
    
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
    
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    
    this._parseUrl(req);
    
    const matched = this._matchRoute(req.method, req.pathname);
    if (!matched) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    req.params = matched.params;
    
    const execute = async (index) => {
      if (index < this.middlewares.length) {
        await this.middlewares[index](req, res, () => execute(index + 1));
      } else {
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          await this._parseBody(req);
        }
        try {
          await matched.handler(req, res);
        } catch (error) {
          console.error('Handler error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    };
    
    execute(0);
  }

  listen(port, callback) {
    const server = http.createServer((req, res) => {
      try {
        this._handleRequest(req, res);
      } catch (error) {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    
    server.listen(port, callback);
  }
}

module.exports = () => new App();