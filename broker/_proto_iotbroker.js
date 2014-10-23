var program = require('commander');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

program
  .version('0.0.1')
  .option('-m, --mode [mode]', 'Mode (demo/prod[default])', 'prod')
  .parse(process.argv);

app.get('/', function(req, res){
  res.sendFile('index.html', {root: __dirname});
});

console.log('running in ' + program.mode + ' mode');

if (program.mode === 'demo') {
  io.set('transports', ['polling']);
}
else {
 io.set('transports', ['xhr-polling', 'jsonp-polling', 'polling']);
}

io.on('connection', function(socket){
  socket.on('btn-push', function(target) {
    console.log('btn ' + target + ' pushed');
  });
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
