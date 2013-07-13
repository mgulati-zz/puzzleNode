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

//the entire database is just javascript variables
var friends = {};
var colors = {};
var rooms = {};
var destination = {};
var userCount = 0;

io.sockets.on('connection', function (socket) {
  console.log(socket.id);
});

//routing, if css and javascript send file, otherwise render the page
app.get('/', function(req, res, next){
  if (req.params.room && req.params.room.indexOf(".") !== -1) next();
  else res.render('index.html');
});

app.get('/getGoodies', function(req,res,next){
  data = {
    'goodies': {
      'first' : {
        'description': 'this is the first marker',
        'members': ['Aya', 'Jordan', 'Devon'],
        'location': {
          'latitude' : 37.524975368048196,
          'longitude' : -122.310791015625
        }
      },
      'second': {
        'description': 'this is the second marker',
        'members': ['ben', 'bob', 'billy'],
        'location': {
          'latitude' : 37.58594229860422,
          'longitude' : -122.49343872070312
        }
      },
      'third': {
        'description': 'this is the third marker',
        'members': ['Jay', 'Jared', 'Mayank', "Sex"],
        'location': { 
          'latitude' : 37.72130604487683,
          'longitude' : -122.45361328125
        }
      }
    }
  }

  latitude = req.query.latitude
  longitude = req.query.longitude

  for (goodie in data['goodies']) {
    if (Math.abs(data['goodies'][goodie]['location']['latitude'] - (latitude)) < 0.03 &&
        Math.abs(data['goodies'][goodie]['location']['longitude'] - (longitude)) < 0.03)
          data['enabledGoodie'] = goodie
  }

  res.json(data);
});

server.listen(app.get('port'));
