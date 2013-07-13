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

  socket = io.connect(window.location.hostname, {'sync disconnect on unload' : true});
  socket.on('unlockAll', function(imageUrl) {
    showHeader('All your friends have unlocked, retreiving reward...');
    $('#reward').attr('src',imageUrl).fadeIn(500);
  })

  socket.on('personLeft', function(loser) {
    if (goodies[$('#title').text()].members.indexOf(loser) != -1) {
      goodies[$('#title').text()].members.splice(goodies[$('#title').text()].members.indexOf(loser),1)
    }

    showLock();
  })

  socket.on('updateGoodies', function(data) {
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
          map: map,
          icon: {
            url: '/marker.png',
            size: new google.maps.Size(250, 250),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(23, 38),
            scaledSize: new google.maps.Size(45, 45)
          }
        });

      goodies[goodie].marker.setPosition(
        new google.maps.LatLng(
          goodies[goodie].latitude, 
          goodies[goodie].longitude)
        );
    }

    if (data.enabledGoodie) {
      if (data.roomFull) fullRoom(data.enabledGoodie); 
      else showLock(data.enabledGoodie)
    }
    else {
      clearLock();
      socket.emit('join',null);
    }
  })

  $('#nameForm').submit(function(e) {
    e.preventDefault();

    if ($('#textBox').val().length < 3) return

    $('#nameForm').fadeOut();
    myName = $('#textBox').val();
    socket.emit('name', myName);
    startMap();
  });

  $('#textBox').keyup(function() {
    if ($('#textBox').val().length < 2) $('#getStarted').removeClass('opaque');
    else $('#getStarted').addClass('opaque');
  });

  lock = $('#lock');
  lock.click(function() {
    unlock();
  })

});

function startMap() {
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

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updateMyLocation, error);
    navigator.geolocation.watchPosition(updateMyLocation, error);
  }
  else error('not supported');

}

function error(msg) {
  console.log(msg);
}

function updateMyLocation(myPosition) {
  var latlng = new google.maps.LatLng(myPosition.coords.latitude, myPosition.coords.longitude);
  
  if (myMarker.position == null) map.setCenter(latlng);

  myMarker.setPosition(latlng);
  myLatLng = myPosition;

  socket.emit('updateLocation',myPosition.coords.latitude, myPosition.coords.longitude);

  // data = {user_id: myName, 
  //         latitude: myPosition.coords.latitude, 
  //         longitude: myPosition.coords.longitude, 
  //         zoom: map.getZoom() }

  // $.get("getGoodies", data)
  //   .done(function(data) {
      
  //     //iterate through all the markers currently in goodies
  //     for (goodie in goodies) {
  //       //delete markers and goodies that didnt come back
  //       if (!data.goodies.hasOwnProperty(goodie)) {
  //         goodies[goodie].marker.setMap(null);
  //         delete goodies[goodie];
  //       }
  //     }

  //     for (goodie in data.goodies) {
  //       //update marker positions for existing goodies
  //       if (!goodies[goodie]) goodies[goodie] = {};
  //       $.extend(goodies[goodie],data.goodies[goodie]);
  //       //create the marker if it doesn't already exist
  //       if (!goodies[goodie].marker) 
  //         goodies[goodie].marker = new google.maps.Marker({
  //           animation: google.maps.Animation.DROP,
  //           map: map,
  //           icon: {
  //             url: '/marker.png',
  //             size: new google.maps.Size(250, 250),
  //             origin: new google.maps.Point(0, 0),
  //             anchor: new google.maps.Point(23, 38),
  //             scaledSize: new google.maps.Size(45, 45)
  //           }
  //         });

  //       goodies[goodie].marker.setPosition(
  //         new google.maps.LatLng(
  //           goodies[goodie].latitude, 
  //           goodies[goodie].longitude)
  //         );
  //     }

  //     if (data.enabledGoodie) {
  //       if (data.roomFull) fullRoom(data.enabledGoodie); 
  //       else showLock(data.enabledGoodie)
  //     }
  //     else {
  //       clearLock();
  //       socket.emit('join',null);
  //     }

  //   });  
}

function fullRoom(goodie) {
  lock.addClass('opaque');
  lock.addClass('noClick');
  lock.removeClass('unLock unLocked');
  $('#title').text(goodie);
  
  var memberList = "";
  for (member in goodies[goodie].members) {
    memberList += goodies[goodie].members[member] + "<br/>"
  }
  if (memberList.length > 4) memberList = memberList.substring(0, memberList.length - 5);
  $('#members').html(memberList);
  showHeader('Sorry, this goodie is already full');
  socket.emit('join',null);
}

function showLock(goodie) {
  $('#title').text(goodie);
  socket.emit('join',goodie);
  lock.addClass('opaque');
  lock.removeClass('noClick');
  if (goodies[$('#title').text()].members.length == 4) lock.addClass('unLock');
  else lock.removeClass('unLock unLocked')
  
  var memberList = "";
  for (member in goodies[goodie].members) {
    memberList += goodies[goodie].members[member] + "<br/>"
  }
  if (memberList.length > 4) memberList = memberList.substring(0, memberList.length - 5)
  $('#members').html(memberList);
}

function hideLock () {
  lock.removeClass('opaque');
  lock.removeClass('unLock unLocked');
}

function unlock() {
  if (goodies[$('#title').text()].members.length == 4) {
    socket.emit('unlock');
    showHeader('Waiting on the others to unlock')
    lock.removeClass('unLock');
    lock.addClass('unLocked');
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