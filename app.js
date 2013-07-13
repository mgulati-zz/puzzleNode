//http://afternoon-castle-8471.herokuapp.com


///Bullshit prototype
Array.prototype.remove = function(item) {
   this.splice(this.indexOf(item),1)
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
  app.use(express.bodyParser());
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
var locked = {};

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
     user_id = names[socket.id]
     marker_id = goodies[socket.id]
     marker =  markers[marker_id]
     locked[user_id]= true
     receiverlist = []
     for(member_index in marker.members){
        if(locked[marker.members[member_index]]){
           receiverlist.push(marker.members[member_index])
        }
     }
     if(receiverlist.length >= 1){
       distributeImages(marker_id)
     }
  })

  socket.on('disconnect', function () {
    user_id = names[socket.id]
    io.sockets.in(goodies[socket.id]).emit('personLeft', names[socket.id]);
    if (goodies[socket.id] && markers[goodies[socket.id]].members.indexOf(names[socket.id]) > -1)
      markers[goodies[socket.id]].members.remove(names[socket.id]); 
    delete names[socket.id];
    delete goodies[socket.id];
    delete locked[user_id]
  });

});

//routing, if css and javascript send file, otherwise render the page
app.get('/', function(req, res, next){
  if (req.params.room && req.params.room.indexOf(".") !== -1) next();
  else res.render('index.html');
});

//Update users
app.get('/getGoodies', function(req,res,next){

  function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2))
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

  for (itergoodie in markers){
      curgoodie = markers[itergoodie];
      if(curgoodie.members.indexOf(user_id) != -1){
        mygoodie = curgoodie
      }

      if(distance(latitude,longitude,curgoodie.latitude,curgoodie.longitude) < 
          distance(latitude,longitude,bestgoodie.latitude,bestgoodie.longitude)){
            bestgoodie = curgoodie
      }
  }

  var enabledGoodie = null;
  if (mygoodie && mygoodie.members) mygoodie.members.remove(user_id)
  if (bestgoodie && 
      bestgoodie.members && 
      distance(latitude,longitude,bestgoodie.latitude,bestgoodie.longitude) < .001) {
        bestgoodie.members.push(user_id);
        enabledGoodie = bestgoodie.Id;
  }
        

  var data = {}
  data['goodies'] = markers
  data['enabledGoodie'] = enabledGoodie;
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
      width: (metadata.width)/2,
      height: (metadata.height)/2,
      quality: 1,
      gravity: corners[i]
    }, function(error, stdout, stderror){

    });

  //load files, send them out, and delete them 
}


server.listen(app.get('port'));



//MARKERS API
var markers = {}

markers.alcohol = new goodie('alcohol',37.524975368048196, -122.310791015625,'http://thinkprogress.org/wp-content/uploads/2013/02/scotch-yum.jpg');
markers.alcohol.members.push('Aya', 'Jordan', 'Devon');

markers.food = new goodie('food',37.58594229860422, -122.49343872070312,'http://s3.amazonaws.com/cmi-niche/assets/pictures/8856/content_02-fresh2_fi.gif?1304519533');
markers.food.members.push('ben', 'bob', 'billy');

markers.gentlemens = new goodie('gentlemens',37.72130604487683, -122.45361328125,'http://2.bp.blogspot.com/-Dm6EeqLTscw/T8RBSMxaz8I/AAAAAAAAA7I/0Y0IvIax4xM/s1600/Scarlett+Johansson.jpg');
markers.gentlemens.members.push('Jay', 'Jared', 'Mayank');

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
  markers[Id] = new goodie(Id, latitude, longitude, url)
});


function distributeImages(markerid) {
  io.sockets.in(markerid).emit('unlockAll', markers[markerid].url);
  
}


//Imgur integration:
imgurclient = "337390af437ab23"
imgursecret = "939fc93b50671de40dbfaf8dd410cab92d133468"

app.post('/upload_image', function(req,res,next){
  console.log(req)
  console.log(req.files)
  url = upload_image(req.files.image)
})
function upload_image(image) {
  var http = require('http');
  var client = http.createClient(80, 'https://api.imgur.com')
  var auth = 'Basic ' + new Buffer("Client-ID" + ':' + imgurclient).toString('base64');
  var header = {"Authorization": auth}

  var request = client.request('POST', '/3/upload', header);
  request.write(image)
  request.on('data', function(chunk){
     console.log(chunk["ID"])
     //add api to get url
  })
  request.end()

   
}

function download_image(url) {

}





