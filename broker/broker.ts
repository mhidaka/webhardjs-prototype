/// <reference path="typings/tsd.d.ts" />

class OpenHardwareClient {
  socket: any;
  public bondModules: HardwareModule[];

  constructor(sock: any) {
    this.socket = sock;
    this.bondModules = [];
  }

  dispose(): void {
    this.socket = null;
    this.bondModules = null;
  }
}

class OpenHardwareRequest {
  public host: string;
  public deviceId: string;
  public cmd: string;
  public params: string;
}

class OpenHardwareRequestParser {
  pattern: RegExp;

  constructor() {
    this.pattern = new RegExp('^' + OpenHardwareBroker.URI_SCHEME + '://([^/]+)/([^/]+)/([^/]+)(.*)$');
  }

  parse(uri: string): OpenHardwareRequest {
    if (this.pattern.test(uri)) {
      var res = this.pattern.exec(uri);
      var ohr = new OpenHardwareRequest();
      ohr.host = res[1];
      ohr.deviceId = res[2];
      ohr.cmd = res[3];
      if (1 <= res[4].length) {
        // TODO: remove this ->
        ohr.params = res[4].substr(1);
      }
      return ohr;
    }
    return null;
  }
}

class OpenHardwareBroker {
  public static URI_SCHEME: string = 'mozopenhard';
  router: DeviceRouter;
  clients: OpenHardwareClient[];
  parser: OpenHardwareRequestParser;

  constructor() {
    this.router = new DeviceRouter();
    this.parser = new OpenHardwareRequestParser();
    this.clients = [];
  }

  onConnect(socket: any): void {
    console.log("hi!");
    this.clients[socket] = new OpenHardwareClient(socket);
  }

  onDisonnect(socket: any): void {
    console.log("bye..");
    var client = this.clients[socket];
    if (client !== undefined && client !== null) {
      client.dispose();
    }
    delete this.clients[socket];
  }

  onMessage(client: any, msg: any): void {
    console.log(msg);
  }

  onBindRequest(client: OpenHardwareClient, path: string): boolean {
    var parsed = this.parser.parse(path);
    if (parsed === null) {
      console.log('URI format is not valid: ' + path);
      return;
    }
    if (parsed.host !== 'localhost') {
      console.log('hosts other than localhost are not supported yet: ' + path);
      return;
    }
    var module = this.resolveResource(parsed.deviceId);
    if (module !== null) {
      if (parsed.cmd === 'register') {
        module.registerListener(client, parsed.params);
      }
      return true;
    }
    else {
      console.log('appropriate module not found for request: ' + path);
      return false;
    }
  }

  onOneShotRequest(path: string): void {
    var parsed = this.parser.parse(path);
    if (parsed === null) {
      console.log('URI format is not valid: ' + path);
      return;
    }
    if (parsed.host !== 'localhost') {
      console.log('hosts other than localhost are not supported yet: ' + path);
      return;
    }
    var dummyClient = new OpenHardwareClient(null);
    var module = this.resolveResource(parsed.deviceId);
    if (module !== null) {
      module.command(dummyClient, parsed.cmd, parsed.params);
    }
    else {
      console.log('appropriate module not found for request: ' + path);
    }
  }

  registerHardwareModule(ident: string, module: HardwareModule): void {
    this.router.add(ident, module);
  }

  resolveResource(ident: string): HardwareModule {
    return this.router.resolve(ident);
  }

  sendMessageToClient(client: any, msg: any): void {
  }
}

class DeviceRouter {
  modules: HardwareModule[];

  constructor() {
    this.modules = [];
  }

  add(ident: string, module: HardwareModule): void {
    this.modules[ident] = module;
  }

  resolve(ident: string): HardwareModule {
    var mod = this.modules[ident];
    if (mod !== undefined && mod !== null) {
      return mod;
    }
    return null;
  }
}

class HardwareModule {
  registerListener(client: OpenHardwareClient, params: any): void {
    client.bondModules.push(this);
  }

  detachClient(client: OpenHardwareClient): void {
    // TODO: somehow remove this
    // client.bondModules.append(this);
  }

  command(client: OpenHardwareClient, cmd: string, params: any): void {
    // TODO: implement
  }
}

////
// LED modules
////

class LedHardwareModule extends HardwareModule {
  command(client: OpenHardwareClient, cmd: string, params: any): void {
    switch (cmd) {
      case 'on':
        // TODO: implement
        break;
      case 'off':
        // TODO: implement
        break;
    }
  }
}

class DummyLedHardwareModule extends LedHardwareModule {
  command(client: OpenHardwareClient, cmd: string, params: any): void {
    switch (cmd) {
      case 'on':
        console.log('dummy led on');
        break;
      case 'off':
        console.log('dummy led off');
        break;
    }
  }
}

////
// console modules
////

class ConsoleHardwareModule extends HardwareModule {
  command(client: OpenHardwareClient, cmd: string, params: any): void {
    switch (cmd) {
      case 'display':
        // TODO: implement
        break;
    }
  }
}

class DummyConsoleHardwareModule extends ConsoleHardwareModule {
  command(client: OpenHardwareClient, cmd: string, params: any): void {
    console.log('cmd===' + cmd);
    switch (cmd) {
      case 'display':
        console.log('dummy console output: ' + params);
        break;
    }
  }
}

var program = require('commander');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var broker = new OpenHardwareBroker();

// devices registration
broker.registerHardwareModule('led0', new DummyLedHardwareModule());
broker.registerHardwareModule('led1', new DummyLedHardwareModule());
broker.registerHardwareModule('console0', new DummyConsoleHardwareModule());

program
  .version('0.0.1')
  .option('-m, --mode [mode]', 'Mode (demo/prod[default])', 'prod')
  .parse(process.argv);

app.get('/', function(req, res){
  res.sendFile('index.html', {root: __dirname});
});
app.get('/oneshot', function(req, res){
  console.log('req: ' + req.query.q);
  broker.onOneShotRequest(req.query.q);
  res.send('ok');
});

console.log('running in ' + program.mode + ' mode');

if (program.mode === 'demo') {
  io.set('transports', ['polling']);
}
else {
 io.set('transports', ['xhr-polling', 'jsonp-polling', 'polling']);
}

io.on('connection', function(socket){
  broker.onConnect(socket);
  socket.on('msg', function(msgBody) {
    broker.onMessage(socket, msgBody);
  });
  socket.on('disconnect', function() {
    broker.onDisonnect(socket);
  });
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
