const socket = io();
socket.on("msg", msg => {
  alert(msg)
  window.open(home_url, "_self");
})
const video_grid = document.getElementById('video-grid')
const myPeer = new Peer(this_user_id)
const myVideo = document.createElement('video')
beautifyVideo(myVideo)
const partsList = document.getElementById("parts-list") 
let myVideoStream;
let screenStream;
myVideo.muted = true
const peers = {}
let currentPeer = null; 
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    beautifyVideo(video)

    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    currentPeer = call;
  })

  socket.on('user-connected', (userId, name) => {
    setTimeout(connectToNewUser, 2000, userId, stream);
    addParticipantToList(userId, name)
  })
})

socket.on('user-disconnected', userId => {
  removeParticipantToList(userId)
  if (peers[userId]) peers[userId].close()
})

socket.on('user-kicked', userId => {
  if (this_user_id != userId) {
    peers[userId].close()
    removeParticipantToList(userId)
  }
})

socket.on('got-kicked', userId => {
  if (this_user_id == userId) {
    window.open(home_url, "_self");
  }
})

myPeer.on('open', id => {
  socket.emit('join-room', {
    part_code : part_code,
    is_owner : is_owner,
    roomId : this_room_id,
    userId : this_user_id,
    name : this_user_name
  })
})

socket.on('get-parts-list', parts => {
  for (let i = 0; i < parts.length; i++)
    addParticipantToList(parts[i].userId, parts[i].name)
})


function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  beautifyVideo(video)
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
   
  peers[userId] = call
  currentPeer = call;
}

function addVideoStream(video, stream){
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  video_grid.append(video)
}

function removeParticipantToList(userId){
  let part = document.getElementById("part-"+userId)
  if (part) partsList.removeChild(part);
}

function addParticipantToList(userId, name) {
  removeParticipantToList(userId)
  let part = document.createElement("div")
  part.classList.add("row")
  part.id = 'part-' + userId
  if (is_owner) 
    part.innerHTML = "<div class='col'>" + name + "</div><div class='col'><button class='btn btn-danger' onclick=\"kick('" + userId + "')\">Kick</button></div>"
  else 
    part.innerHTML = "<div class='col'>" + name + "</div><div class='col'></div>"
  partsList.appendChild(part)
}

function kick(userId) {
  if (confirm("Do you really want to kick this user? (he will be banned permanently from this meet unless you add him again)")) {
    peers[userId].close()
    removeParticipantToList(userId)
    socket.emit('kick', userId)
  }
}

function toggleAudio() {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled == true) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    document.getElementById("audio-btn").src = "/img/mute.png"
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    document.getElementById("audio-btn").src = "/img/unmute.png"
  }
}

function toggleVideo() {                                           
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled == true) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    document.getElementById("video-btn").src = "/img/no_video.png"
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    document.getElementById("video-btn").src = "/img/video.png"
  }
}

let screenSharing = false
function toggleScreenshare(){
  if (screenSharing) {
    stopScreenShare();
    return;
  }
  startScreenShare();
}

function startScreenShare() {
  if (screenSharing) {
    stopScreenShare()
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
    screenStream = stream;
    let videoTrack = screenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
        stopScreenShare()
    }
    if (myPeer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
        screenSharing = true
    }
    document.getElementById("screenshare-btn").src = "/img/screenshare.png" 
  })
}

function stopScreenShare() {
    if (!screenSharing) return;
    let videoTrack = myVideoStream.getVideoTracks()[0];
    if (myPeer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
    document.getElementById("screenshare-btn").src = "/img/no_screenshare.png" 
}

function hangup(url) {
  if (confirm('Are you sure you want to quit this meet ?')) {
    socket.emit('manual-disconnect');
    window.open(url, "_self");
  }
}

window.onbeforeunload = hangup

function beautifyVideo(vid) {
  vid.classList.add("rounded")
}
