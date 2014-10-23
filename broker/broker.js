/// <reference path="typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// TODO: somehow wrap client
var OpenHardwareClient = (function () {
    function OpenHardwareClient(sock) {
        this.socket = sock;
        this.bondModules = [];
    }
    OpenHardwareClient.prototype.dispose = function () {
        this.socket = null;
        this.bondModules = null;
    };
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
                ohr.params = res[4].substr(1);
            }
            console.log('ohr' + ohr.params);
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
        this.clients[socket] = new OpenHardwareClient(socket);
    };
    OpenHardwareBroker.prototype.onDisonnect = function (socket) {
        console.log("bye..");
        var client = this.clients[socket];
        if (client !== undefined && client !== null) {
            client.dispose();
        }
        delete this.clients[socket];
    };
    OpenHardwareBroker.prototype.onMessage = function (client, msg) {
        console.log(msg);
    };
    OpenHardwareBroker.prototype.onBindRequest = function (client, path) {
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
        var dummyClient = new OpenHardwareClient(null);
        var module = this.resolveResource(parsed.deviceId);
        if (module !== null) {
            module.command(dummyClient, parsed.cmd, parsed.params);
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
    OpenHardwareBroker.prototype.sendMessageToClient = function (client, msg) {
    };
    OpenHardwareBroker.URI_SCHEME = 'mozopenhard';
    return OpenHardwareBroker;
})();
var DeviceRouter = (function () {
    function DeviceRouter() {
        this.modules = [];
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
    return DeviceRouter;
})();
var HardwareModule = (function () {
    function HardwareModule() {
    }
    HardwareModule.prototype.registerListener = function (client, params) {
        client.bondModules.push(this);
    };
    HardwareModule.prototype.detachClient = function (client) {
        // TODO: somehow remove this
        // client.bondModules.append(this);
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
var program = require('commander');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var broker = new OpenHardwareBroker();
// devices registration
broker.registerHardwareModule('led0', new DummyLedHardwareModule());
broker.registerHardwareModule('led1', new DummyLedHardwareModule());
broker.registerHardwareModule('console0', new DummyConsoleHardwareModule());
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
    socket.on('msg', function (msgBody) {
        broker.onMessage(socket, msgBody);
    });
    socket.on('disconnect', function () {
        broker.onDisonnect(socket);
    });
    console.log('a user connected');
});
http.listen(3000, function () {
    console.log('listening on *:3000');
});
