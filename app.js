//http://afternoon-castle-8471.herokuapp.com

var express = require('express');

var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server),
  path = require('path'),
  url = require('url');

  
app.configure(function() {
  app.set('port', process.env.PORT || 80);
  app.use(express.favicon());
  app.use(app.router);
  app.engine('html', require('ejs').renderFile);
  app.set('views', __dirname + '/public');
  app.set("view options", {layout: false});
  app.use(express.static(__dirname + '/public'));
});


// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);

  //Set up handshake data for joining room
  io.set('authorization', function (handshakeData, callback) {
    callback(null, true); 
  });
});

function goodie (latitude, longitude) {
  this.members = [];
  this.latitude = latitude;
  this.longitude = longitude;
}

//the entire database is just javascript variables
var markers = {};
var names = {};
var goodies = {};

markers.first = new goodie(37.524975368048196, -122.310791015625);
markers.first.members.push('Aya', 'Jordan', 'Devon');

markers.second = new goodie(37.58594229860422, -122.49343872070312);
markers.second.members.push('ben', 'bob', 'billy');

markers.third = new goodie(37.72130604487683, -122.45361328125);
markers.third.members.push('Jay', 'Jared', 'Mayank', 'sex');

io.sockets.on('connection', function (socket) {
  
  socket.on('name', function(userId) {
    names[socket.id] = userId;
  })

  socket.on('updateLocation', function (latitude,longitude) {
    
    for (goodie in markers) {
      if (inRange(goodie, req.query.latitude, req.query.longitude))
          data['enabledGoodie'] = goodie
  })
  
  socket.on('join', function(goodie) {
    for (i in io.sockets.manager.roomClients[socket.id])
      if (io.sockets.manager.roomClients[socket.id][i] != "")
        socket.leave(io.sockets.manager.roomClients[socket.id][i]);
    
    socket.join(goodie);
    goodies[socket.id] = goodie;
    if (!($.inArray(names[socket.id], markers[goodie].members)))
      markers[goodie].members.push(names[socket.id]);
  })
  
  socket.on('unlock', function() {

  })

  socket.on('disconnect', function () {
    if (goodies[socket.id] && markers[goodies[socket.id]].memebrs.indexOf(names[socket.id]) != -1)
      markers[goodies[socket.id]].memebrs.splice(markers[goodies[socket.id]].memebrs.indexOf(names[socket.id]),1)
    delete names[socket.id];
    io.sockets.in(goodies[socket.id]).emit('personLeft', names[socket.id]);
    delete goodies[socket.id];
  });

});

var checkRange = 0.03;
function inRange(goodie, latitude, longitude) {
  return (Math.abs(markers[goodie]['latitude'] - latitude) < checkRange &&
          Math.abs(markers[goodie]['longitude'] - longitude) < checkRange)  
}

//routing, if css and javascript send file, otherwise render the page
app.get('/', function(req, res, next){
  if (req.params.room && req.params.room.indexOf(".") !== -1) next();
  else res.render('index.html');
});

server.listen(app.get('port'));
