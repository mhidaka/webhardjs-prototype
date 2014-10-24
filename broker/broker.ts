/// <reference path="typings/tsd.d.ts" />

class OpenHardwareClient {
  socket: any;
  public bondModules: HardwareModule[];
  ident: number;
  static maxIdent: number = 0;
  broker: OpenHardwareBroker;

  constructor(sock: any, broker: OpenHardwareBroker) {
    this.socket = sock;
    this.bondModules = [];
    this.ident = this.socket.id;
    this.broker = broker;
    var me = this;
    this.socket.on('command', function(req) {
      console.log('client sent a command');
      broker.onRequest(me, req['uri']);
    });
  }

  notifyEvent(eventType: string, params: any) {
    this.socket.emit(eventType, params);
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
  public params: {};
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
        var params = res[4].substr(1);
        ohr.params = {};
        if (params !== '') {
          var paramList = params.split('/');
          if (paramList.length !== 1) {
            for (var i = 0; i + 1 <= paramList.length; i += 2) {
              ohr.params[paramList[i]] = paramList[i + 1];
            }
            console.log(ohr.params);
          }
        }
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
    this.clients[socket] = new OpenHardwareClient(socket, this);
  }

  onDisconnect(socket: any): void {
    console.log("bye..");
    var client = this.clients[socket];
    if (client !== undefined && client !== null) {
      console.log('disconnecting a client');
      this.detachClientFromResources(client);
      console.log(client);
      client.dispose();
    }
    delete this.clients[socket];
  }

  onRequest(client: OpenHardwareClient, path: string): boolean {
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
    console.log(parsed);
    if (module !== null) {
      if (parsed.cmd === 'subscribe') {
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
    var dummyClient = new OpenHardwareClient({
      emit: (param) => {},
      on: (type, func) => {}
    }, this);
    var module = this.resolveResource(parsed.deviceId);
    if (module !== null) {
      if (parsed.cmd === 'subscribe') {
        module.registerListener(dummyClient, parsed.params);
        // detach immediately
        module.detachClient(dummyClient);
      }
      else {
        module.command(dummyClient, parsed.cmd, parsed.params);
      }
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

  detachClientFromResources(client: OpenHardwareClient): void {
    this.router.detachClient(client);
  }

  sendMessageToClient(client: any, msg: any): void {
  }
}

class DeviceRouter {
  modules: { [ident: string]: HardwareModule; } = {};

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

  detachClient(client: OpenHardwareClient): void {
    for (var key in this.modules) {
      var mod = this.modules[key];
      mod.detachClient(client);
    }
  }
}

class HardwareModuleClient {
  client: OpenHardwareClient;
  callbackParams: any;
  constructor(client: OpenHardwareClient, params: any) {
    this.client = client;
    this.callbackParams = params;
  }
}

class HardwareModule {
  clients: { [key: string]: HardwareModuleClient; } = {};

  registerListener(client: OpenHardwareClient, params: any): void {
    this.clients[client.ident] = new HardwareModuleClient(client, params);
  }

  detachClient(client: OpenHardwareClient): void {
    var ins = this.clients[client.ident];
    if (ins !== undefined && ins !== null) {
      delete this.clients[client.ident];
    }
  }

  fireEvent(param: any): void {
    // TODO: implement
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

////
// LED modules
////

class UltraSonicHardwareModule extends HardwareModule {
  // TODO: somehow trigger 'fireEvent(...)' with appropriate distance info
  fireEvent(param: any): void {
    var distance: number = param;
    var cnt = 0;
    for (var key in this.clients) {
      var c = this.clients[key];
      if (c !== undefined) {
        ++cnt;
      }
    }
    console.log('on event. hello listeners: ' + cnt);
    for (var key in this.clients) {
      console.log('trying to detach ' + key);
      var client = this.clients[key];
      console.log(client.callbackParams);
      if (client.callbackParams['minDistance'] <= distance && distance <= client.callbackParams['maxDistance']) {
        client.client.notifyEvent('detectObject', distance);
      }
    }
  }
}

// http://stackoverflow.com/questions/17217736/while-loop-with-promises
var q = require('q');
function promiseWhile(condition: any, body: any): any {
  var done = q.defer();

  function loop() {
    if (!condition()) return done.resolve();
    q.when(body(), loop, done.reject);
  }
  q.nextTick(loop);

  return done.promise;
}

class DummyUltraSonicHardwareModule extends UltraSonicHardwareModule {
  constructor() {
    super();
    this.startRandomTrigger();
  }

  startRandomTrigger(): void {
    promiseWhile(() => true, () => {
      this.fireEvent(20);
      return q.delay(1300);
    }).done();
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
broker.registerHardwareModule('sensor0', new DummyUltraSonicHardwareModule());

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
  socket.on('disconnect', function() {
    broker.onDisconnect(socket);
  });
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
