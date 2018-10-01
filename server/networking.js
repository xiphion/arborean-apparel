const net = require('net');
const tls = require('tls');
const events = require('events');
const readline = require('readline');

const HEARTBEAT_INTERVAL = 60 * 1000;

class Client extends events.EventEmitter {
  constructor(server, socket) {
    super();
    Object.assign(this, { server, socket });

    this.lastContact = Date.now();
    this.pinged = false;

    this.heartbeat = setInterval(() => {
      if (Date.now() - this.lastContact > HEARTBEAT_INTERVAL) {
        if (!this.pinged) {
          this.send('ping');
          this.pinged = true;
        } else {
          this.socket.end();
          this.socket.destroy();
        }
      }
    }, HEARTBEAT_INTERVAL);

    this.socket.on('data', () => {
      this.lastContact = Date.now();
      this.pinged = false;
    }).on('close', () => {
      clearInterval(this.heartbeat);
    });
  }

  send(...data) {
    this.socket.write(JSON.stringify(data) + '\n');
  }

  broadcast(...data) {
    this.server.broadcast(this, ...data);
  }
}

class Server extends events.EventEmitter {
  constructor(options = {}, callback) {
    super();

    this.clients = new Set();

    this.server = (options.secure ? tls : net).createServer(options, (socket) => {
      const client = new Client(this, socket);
      this.clients.add(client);
      callback(client);

      readline.createInterface({ input: socket }).on('line', (line) => {
        try {
          client.emit(...JSON.parse(line));
        } catch (err) {
          console.warn(err);
        }
      });

      socket.on('error', (err) => {
        console.warn(err);
      });

      socket.on('close', () => {
        this.clients.delete(client);
        client.emit('close');
      });
    });
  }

  broadcast(skipClient, ...data) {
    for (const client of this.clients) {
      if (client !== skipClient) client.send(...data);
    }
  }

  listen(...args) {
    this.server.listen(...args);
  }
}

module.exports = Server;
