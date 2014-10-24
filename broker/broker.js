/// <reference path="typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OpenHardwareClient = (function () {
    function OpenHardwareClient(sock, broker) {
        this.socket = sock;
        this.bondModules = [];
        this.ident = this.socket.id;
        this.broker = broker;
        var me = this;
        this.socket.on('command', function (req) {
            console.log('client sent a command');
            broker.onRequest(me, req['uri']);
        });
    }
    OpenHardwareClient.prototype.notifyEvent = function (eventType, params) {
        this.socket.emit(eventType, params);
    };
    OpenHardwareClient.prototype.dispose = function () {
        this.socket = null;
        this.bondModules = null;
    };
    OpenHardwareClient.maxIdent = 0;
    return OpenHardwareClient;
})();
var OpenHardwareRequest = (function () {
    function OpenHardwareRequest() {
    }
    return OpenHardwareRequest;
})();
var OpenHardwareRequestParser = (function () {
    function OpenHardwareRequestParser() {
        this.pattern = new RegExp('^' + OpenHardwareBroker.URI_SCHEME + '://([^/]+)/([^/]+)/([^/]+)(.*)$');
    }
    OpenHardwareRequestParser.prototype.parse = function (uri) {
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
    };
    return OpenHardwareRequestParser;
})();
var OpenHardwareBroker = (function () {
    function OpenHardwareBroker() {
        this.router = new DeviceRouter();
        this.parser = new OpenHardwareRequestParser();
        this.clients = [];
    }
    OpenHardwareBroker.prototype.onConnect = function (socket) {
        console.log("hi!");
        this.clients[socket] = new OpenHardwareClient(socket, this);
    };
    OpenHardwareBroker.prototype.onDisconnect = function (socket) {
        console.log("bye..");
        var client = this.clients[socket];
        if (client !== undefined && client !== null) {
            console.log('disconnecting a client');
            this.detachClientFromResources(client);
            console.log(client);
            client.dispose();
        }
        delete this.clients[socket];
    };
    OpenHardwareBroker.prototype.onRequest = function (client, path) {
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
    };
    OpenHardwareBroker.prototype.onOneShotRequest = function (path) {
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
            emit: function (param) {
            },
            on: function (type, func) {
            }
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
    };
    OpenHardwareBroker.prototype.registerHardwareModule = function (ident, module) {
        this.router.add(ident, module);
    };
    OpenHardwareBroker.prototype.resolveResource = function (ident) {
        return this.router.resolve(ident);
    };
    OpenHardwareBroker.prototype.detachClientFromResources = function (client) {
        this.router.detachClient(client);
    };
    OpenHardwareBroker.prototype.sendMessageToClient = function (client, msg) {
    };
    OpenHardwareBroker.URI_SCHEME = 'mozopenhard';
    return OpenHardwareBroker;
})();
var DeviceRouter = (function () {
    function DeviceRouter() {
        this.modules = {};
    }
    DeviceRouter.prototype.add = function (ident, module) {
        this.modules[ident] = module;
    };
    DeviceRouter.prototype.resolve = function (ident) {
        var mod = this.modules[ident];
        if (mod !== undefined && mod !== null) {
            return mod;
        }
        return null;
    };
    DeviceRouter.prototype.detachClient = function (client) {
        for (var key in this.modules) {
            var mod = this.modules[key];
            mod.detachClient(client);
        }
    };
    return DeviceRouter;
})();
var HardwareModuleClient = (function () {
    function HardwareModuleClient(client, params) {
        this.client = client;
        this.callbackParams = params;
    }
    return HardwareModuleClient;
})();
var HardwareModule = (function () {
    function HardwareModule() {
        this.clients = {};
    }
    HardwareModule.prototype.registerListener = function (client, params) {
        this.clients[client.ident] = new HardwareModuleClient(client, params);
    };
    HardwareModule.prototype.detachClient = function (client) {
        var ins = this.clients[client.ident];
        if (ins !== undefined && ins !== null) {
            delete this.clients[client.ident];
        }
    };
    HardwareModule.prototype.fireEvent = function (param) {
        // TODO: implement
    };
    HardwareModule.prototype.command = function (client, cmd, params) {
        // TODO: implement
    };
    return HardwareModule;
})();
////
// LED modules
////
var LedHardwareModule = (function (_super) {
    __extends(LedHardwareModule, _super);
    function LedHardwareModule() {
        _super.apply(this, arguments);
    }
    LedHardwareModule.prototype.command = function (client, cmd, params) {
        switch (cmd) {
            case 'on':
                break;
            case 'off':
                break;
        }
    };
    return LedHardwareModule;
})(HardwareModule);
var DummyLedHardwareModule = (function (_super) {
    __extends(DummyLedHardwareModule, _super);
    function DummyLedHardwareModule() {
        _super.apply(this, arguments);
    }
    DummyLedHardwareModule.prototype.command = function (client, cmd, params) {
        switch (cmd) {
            case 'on':
                console.log('dummy led on');
                break;
            case 'off':
                console.log('dummy led off');
                break;
        }
    };
    return DummyLedHardwareModule;
})(LedHardwareModule);
////
// console modules
////
var ConsoleHardwareModule = (function (_super) {
    __extends(ConsoleHardwareModule, _super);
    function ConsoleHardwareModule() {
        _super.apply(this, arguments);
    }
    ConsoleHardwareModule.prototype.command = function (client, cmd, params) {
        switch (cmd) {
            case 'display':
                break;
        }
    };
    return ConsoleHardwareModule;
})(HardwareModule);
var DummyConsoleHardwareModule = (function (_super) {
    __extends(DummyConsoleHardwareModule, _super);
    function DummyConsoleHardwareModule() {
        _super.apply(this, arguments);
    }
    DummyConsoleHardwareModule.prototype.command = function (client, cmd, params) {
        console.log('cmd===' + cmd);
        switch (cmd) {
            case 'display':
                console.log('dummy console output: ' + params);
                break;
        }
    };
    return DummyConsoleHardwareModule;
})(ConsoleHardwareModule);
////
// LED modules
////
var UltraSonicHardwareModule = (function (_super) {
    __extends(UltraSonicHardwareModule, _super);
    function UltraSonicHardwareModule() {
        _super.apply(this, arguments);
    }
    // TODO: somehow trigger 'fireEvent(...)' with appropriate distance info
    UltraSonicHardwareModule.prototype.fireEvent = function (param) {
        var distance = param;
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
    };
    return UltraSonicHardwareModule;
})(HardwareModule);
// http://stackoverflow.com/questions/17217736/while-loop-with-promises
var q = require('q');
function promiseWhile(condition, body) {
    var done = q.defer();
    function loop() {
        if (!condition())
            return done.resolve();
        q.when(body(), loop, done.reject);
    }
    q.nextTick(loop);
    return done.promise;
}
var DummyUltraSonicHardwareModule = (function (_super) {
    __extends(DummyUltraSonicHardwareModule, _super);
    function DummyUltraSonicHardwareModule() {
        _super.call(this);
        this.startRandomTrigger();
    }
    DummyUltraSonicHardwareModule.prototype.startRandomTrigger = function () {
        var _this = this;
        promiseWhile(function () { return true; }, function () {
            _this.fireEvent(20);
            return q.delay(1300);
        }).done();
    };
    return DummyUltraSonicHardwareModule;
})(UltraSonicHardwareModule);
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
program.version('0.0.1').option('-m, --mode [mode]', 'Mode (demo/prod[default])', 'prod').parse(process.argv);
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
});
app.get('/oneshot', function (req, res) {
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
io.on('connection', function (socket) {
    broker.onConnect(socket);
    socket.on('disconnect', function () {
        broker.onDisconnect(socket);
    });
    console.log('a user connected');
});
http.listen(3000, function () {
    console.log('listening on *:3000');
});
