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
var markers = {}

markers.first = new goodie(37.524975368048196, -122.310791015625);
markers.first.members.push('Aya', 'Jordan', 'Devon');

markers.second = new goodie(37.58594229860422, -122.49343872070312);
markers.second.members.push('ben', 'bob', 'billy');

markers.third = new goodie(37.72130604487683, -122.45361328125);
markers.third.members.push('Jay', 'Jared', 'Mayank', 'sex');

io.sockets.on('connection', function (socket) {
  console.log(socket.id);
});

//routing, if css and javascript send file, otherwise render the page
app.get('/', function(req, res, next){
  if (req.params.room && req.params.room.indexOf(".") !== -1) next();
  else res.render('index.html');
});

app.get('/getGoodies', function(req,res,next){
  
  var data = {}
  data['goodies'] = markers;

  latitude = req.query.latitude
  longitude = req.query.longitude

  for (goodie in data['goodies']) {
    if (Math.abs(data.goodies[goodie]['latitude'] - (latitude)) < 0.03 &&
        Math.abs(data.goodies[goodie]['longitude'] - (longitude)) < 0.03)
          data['enabledGoodie'] = goodie
  }

  res.json(data);
});

var corners = ['NorthEast','SouthEast','SouthWest','NorthWest']

var img = require('imagemagick');

function breakUpImage(imgPath) {
img.readMetadata(imgPath, function(error, metadata){
  if (error) throw error;
  console.log('Halted at ' + metadata.exif.dateTimeOriginal);
})

for (var i = 0; i <= 4; i++)
  img.crop({
    srcPath: imgPath,
    dstPath: 'crop'+i+'.jpg',
    width: (meta.width)/2,
    height: (meta.height)/2,
    quality: 1,
    gravity: corners[i]
  }, function(error, stdout, stderror){

  });

  
}

server.listen(app.get('port'));
