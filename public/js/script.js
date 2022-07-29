const socket = io();
const video_grid = document.getElementById('video-grid')
const myPeer = new Peer(this_user_id)
const myVideo = document.createElement('video')
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
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    currentPeer = call;
  })

  socket.on('user-connected', userId => {
    setTimeout(connectToNewUser, 1000, userId, stream);
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', this_room_id, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
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
