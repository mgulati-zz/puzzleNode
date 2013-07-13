//http://afternoon-castle-8471.herokuapp.com


///Bullshit prototype
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


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
var names = {};
var goodies = {};

io.sockets.on('connection', function (socket) {
  
  socket.on('name', function(userId) {
    names[socket.id] = userId;
  })

  socket.on('updateLocation', function (latitude,longitude) {
    //put in loation update stuff
    for (goodie in markers) {
      if (inRange(goodie, latitude, longitude))
          socket.emit('enableGoodie',goodie);
    }
  })
  
  socket.on('join', function(goodie) {
    for (i in io.sockets.manager.roomClients[socket.id])
      if (io.sockets.manager.roomClients[socket.id][i] != "")
        socket.leave(io.sockets.manager.roomClients[socket.id][i]);
    
    socket.join(goodie);
    goodies[socket.id] = goodie;
    if (markers[goodie] && markers[goodie].members.indexOf(names[socket.id]) == -1)
      markers[goodie].members.push(names[socket.id]);
  })
  
  socket.on('unlock', function() {

  })

  socket.on('disconnect', function () {
    if (goodies[socket.id] && markers[goodies[socket.id]] && 
      markers[goodies[socket.id]].members.indexOf(names[socket.id]) != -1)
      markers[goodies[socket.id]].members.splice(markers[goodies[socket.id]].memebrs.indexOf(names[socket.id]),1)
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

//Update users
app.get('/getGoodies', function(req,res,next){

  function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.exp((x1-x2),2) + Math.exp((y1-y2),2))
  }

  user_id = req.query.user_id
  latitude = req.query.latitude
  longitude = req.query.longitude
  
  mygoodie = null
  var bestgoodie = null;

  for (first in markers) {
    bestgoodie = markers[first];
    break;
  }

  for (curgoodie in markers){
      if(markers[curgoodie].members.indexOf(user_id) != -1){
        mygoodie= curgoodie
      }

      if(distance(latitude,longitude,curgoodie.latitude,curgoodie.longitude) < distance(latitude,longitude,bestgoodie.latitude,bestgoodie.longitude)){
        bestgoodie = curgoodie
      }
  }

  if (mygoodie && mygoodie.members) mygoodie.members.remove(user_id)
  if (bestgoodie && bestgoodie.members) bestgoodie.members.push(user_id)

  var data = {}
  data['goodies'] = markers
  data['enabledGoodie'] = bestgoodie.Id

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



//MARKERS API
var markers = {}

markers.first = new goodie('first',37.524975368048196, -122.310791015625,null);
markers.first.members.push('Aya', 'Jordan', 'Devon');

markers.second = new goodie('second',37.58594229860422, -122.49343872070312,null);
markers.second.members.push('ben', 'bob', 'billy');

markers.third = new goodie('third',37.72130604487683, -122.45361328125,null);
markers.third.members.push('Jay', 'Jared', 'Mayank', 'sex');

function goodie (Id, latitude, longitude, url) {
  this.Id = Id; 
  this.members = [];
  this.latitude = latitude;
  this.longitude = longitude;
  this.url = url
}

app.get('/addMarker', function(req, res, next){
  Id = req.query.Id
  url = req.query.url
  latitude = req.query.latitude
  longitude = req.query.longitude
  markers.id = new goodie(Id, latitude, longitude, url)
});






