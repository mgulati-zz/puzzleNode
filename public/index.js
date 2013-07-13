google.maps.visualRefresh = true;
map = null;
goodies = {};
myName = null;
myMarker = null;
myLatLng = null;
lock = null;
var socket;

var styles = [
  {
    "stylers": [
      { "saturation": -100 }
    ]
  }
]

$(function() {
  var mapOptions = {
    center: new google.maps.LatLng(32.52828936482526,-118.32275390625),
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
  };
  
  map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);
  map.setOptions({styles: styles});
  
  google.maps.event.addListener(map, 'zoom_changed', function() {
    updateMyLocation(myLatLng);
  });

  google.maps.event.addListener(map, 'click', function(event) {
  });

  myMarker = new google.maps.Marker({
    animation: google.maps.Animation.DROP,
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "blue",
      fillOpacity: 1,
      strokeColor: "black",
      strokeWeight: 1,
      scale: 4
    }
  })

  lock = $('#lock');
  lock.click(function() {
    unlock();
  })

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updateMyLocation, error);
    navigator.geolocation.watchPosition(updateMyLocation, error);
  }
  else error('not supported');

  socket = io.connect(window.location.hostname, {'sync disconnect on unload' : true});
  socket.on('unlockAll', function() {
    showHeader('All your friends have unlocked, retreiving reward...');
    $.get("getReward", data).done(function(data) {
      alert('throwImageHere');
    })
  })

});

function error(msg) {
  console.log(msg);
}

function updateMyLocation(myPosition) {
  var latlng = new google.maps.LatLng(myPosition.coords.latitude, myPosition.coords.longitude);
  
  if (myMarker.position == null) map.setCenter(latlng);

  myMarker.setPosition(latlng);
  myLatLng = myPosition;

  data = {name: myName, 
          latitude: myPosition.coords.latitude, 
          longitude: myPosition.coords.longitude, 
          zoom: map.getZoom() }

  $.get("getGoodies", data)
    .done(function(data) {
      
      //iterate through all the markers currently in goodies
      for (goodie in goodies) {
        //delete markers and goodies that didnt come back
        if (!data.goodies.hasOwnProperty(goodie)) {
          goodies[goodie].marker.setMap(null);
          delete goodies[goodie];
        }
      }

      for (goodie in data.goodies) {
        //update marker positions for existing goodies
        if (!goodies[goodie]) goodies[goodie] = {};
        $.extend(goodies[goodie],data.goodies[goodie]);
        //create the marker if it doesn't already exist
        if (!goodies[goodie].marker) 
          goodies[goodie].marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: map
          });

        goodies[goodie].marker.setPosition(
          new google.maps.LatLng(
            goodies[goodie].latitude, 
            goodies[goodie].longitude)
          );
      }

      if (data.enabledGoodie) {
        showLock(data.enabledGoodie)
      }
      else {
        clearLock();
        socket.emit('join',null);
      }

    });  
}

function showLock(goodie) {
  socket.emit('join',goodie);
  lock.addClass('opaque');
  $('#title').text(goodie);
  
  var memberList = "";
  for (member in goodies[goodie].members) {
    memberList += goodies[goodie].members[member] + ", "
  }
  if (memberList.length > 1) memberList = memberList.substring(0, memberList.length - 2)
  $('#members').text(memberList);
}

function hideLock () {
  $('#lock').removeClass('opaque');
}

function unlock() {
  if (goodies[$('#title').text()].members.length == 4) {
    socket.emit('unlock');
    showHeader('Waiting on the others to unlock')
  }
  else {
    showHeader('You must have four adventurers to unlock')
  }
}

function showHeader(msg) {
  $('#topBar').text(msg).show();
}

function clearLock() {
  $('#topBar').text("").hide();
  $('#title').text("");
  $('#members').text("");
  hideLock();
}