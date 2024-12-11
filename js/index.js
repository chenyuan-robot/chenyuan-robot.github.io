var btJoinRoom = document.getElementById('bt_join_room');
var btLeaveRoom = document.getElementById('bt_leave_room');
var inputRoomId = document.getElementById('room_id');
var inputMyName = document.getElementById('my_name');
var peerContainer = document.getElementById('peer_container');

const APPID = 0;
const TOKEN = "";
const SERVER_URL = "wss://voyance.cowarobot.com/ws/server/debug2/signal/client";
var streamClient;
let myTracks = [];

btJoinRoom.onclick = () => {
    let roomId = inputRoomId.value;
    let myName = inputMyName.value;

    joinRoom(roomId, myName);
}

btLeaveRoom.onclick = () => {
    leaveRoom();
}

function newPeer(peer, roomId) {
    console.log('newPeer', peer, roomId);
    createPeerView(peer.peer_id, peer.peer_name);
}

function removePeer(peer, roomId) {
    console.log('removePeer', peer, roomId);
    destroyPeerView(peer.peer_id);
}

function newStream(stream, roomId) {
    console.log('newStream', stream, roomId);
    let peerId = stream.peer_id;
    let peerViewVideo = getPeerViewVideo(peerId);
    streamClient.subscribeFromRoom([stream.channel_id], peerViewVideo);
}

function removeStream(stream, roomId) {
    console.log('removeStream', stream, roomId);
    streamClient.unsubscribeFromRoom(stream.channel_id);
}

function rejoinRoom(roomId, name) {
    leaveRoom();

    setTimeout(() => {
        joinRoom(roomId, name);
    }, 1000);
}

function joinRoom(roomId, name)
{
    streamClient = StreamerSdk.createClient(APPID, TOKEN, SERVER_URL, name);

    streamClient.on('newPeer', newPeer);
    streamClient.on('removePeer', removePeer);
    streamClient.on('newStream', newStream);
    streamClient.on('removeStream', removeStream);
    streamClient.on('reconnect', rejoinRoom);

    streamClient.joinRoom(roomId)
        .then(async () => {
            console.log(`joinRoom success`);

            let audioTracks = [];
            try {
                audioTracks = await StreamerSdk.createMicrophoneTracks();
                streamClient.publishToRoom(`${name}-audio`, audioTracks[0]);
            } catch (err) {
                console.log(`createMicrophoneTracks failed, err: ${err}`);
            }

            let videoTracks = [];
            try {
                videoTracks = await StreamerSdk.createDesktopTracks();
                streamClient.publishToRoom(`${name}-video`, videoTracks[0]);
            } catch (err) {
                console.log(`createDesktopTracks failed, err: ${err}`);
            }

            myTracks = [...audioTracks, ...videoTracks];

            createMeView(name, videoTracks);
        })
        .catch(err => {
            console.log(`joinRoom failed, err: ${err}`);
        });
}

function leaveRoom()
{
    if (streamClient)
    {
        streamClient.off('newPeer', newPeer);
        streamClient.off('removePeer', removePeer);
        streamClient.off('newStream', newStream);
        streamClient.off('removeStream', removeStream);
        streamClient.off('reconnect', rejoinRoom);

        streamClient.leaveRoom();

        streamClient.close();

        streamClient = null;
    }

    myTracks.forEach(track => {
        track.stop();
    });
    peerContainer.innerHTML = '';
}

function createPeerView(peerId, peerName) {
    var divContainer = document.createElement('div');
    divContainer.classList.add('peerview-container');

    divContainer.setAttribute('id', peerId);

    var peerNameLabel = document.createElement('label');
    peerNameLabel.textContent = peerName;

    var videoElem = document.createElement('video');
    videoElem.setAttribute('autoplay', true);
    videoElem.setAttribute('playsinline', true);
    videoElem.setAttribute('id', `video_${peerId}`);

    divContainer.appendChild(peerNameLabel);
    divContainer.appendChild(videoElem);

    peerContainer.appendChild(divContainer);
}

function destroyPeerView(peerId) {
    var elem = document.getElementById(peerId);
    elem.parentNode.removeChild(elem);
}

function getPeerViewVideo(peerId) {
    return document.getElementById(`video_${peerId}`);
}

function createMeView(myName, myTracks) {
    var divContainer = document.createElement('div');
    divContainer.classList.add('meview-container');

    divContainer.setAttribute('id', myName);

    var myNameLabel = document.createElement('label');
    myNameLabel.textContent = myName;

    var videoElem = document.createElement('video');
    videoElem.setAttribute('autoplay', true);
    videoElem.setAttribute('playsinline', true);
    videoElem.setAttribute('id', `video_${myName}`);

    let mediaStream = new MediaStream();
    myTracks.forEach(track => {
        mediaStream.addTrack(track);
    });
    videoElem.srcObject = mediaStream;

    divContainer.appendChild(myNameLabel);
    divContainer.appendChild(videoElem);

    peerContainer.appendChild(divContainer);
}

function destroyMeView(myName) {
    var elem = document.getElementById(myName);
    elem.parentNode.removeChild(elem);
}