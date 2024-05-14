<script setup>
import {ref} from "vue";
import {io} from "socket.io-client";
import "fast-crypto";
import SimpleSignalClient from "simple-signal-client";
var props = defineProps({
  roomId: {
    type: String,
    default: "public-room-v2"
  },
  socketURL: {
    type: String,
    default: "http://localhost:3000"
    // default: "https://websocket.straiberry.com"
  },
  cameraHeight: {
    type: [Number, String],
    default: 160
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  screenshotFormat: {
    type: String,
    default: "image/jpeg"
  },
  enableAudio: {
    type: Boolean,
    default: true
  },
  enableVideo: {
    type: Boolean,
    default: true
  },
  enableLogs: {
    type: Boolean,
    default: false
  },
  peerOptions: {
    type: Object,
    default() {
      return {};
    }
  },
  ioOptions: {
    type: Object,
    default() {
      return {
        rejectUnauthorized: false,
        transports: ["polling", "websocket"]
      };
    }
  },
  deviceId: {
    type: String,
    default: null
  },
  token: {
    type: String,
    default: null
  }
});
var signalClient;
var videoList = [];
var canvas = null;
var localStream;
var socket = defineModel("socket");
var players = defineModel("players");
var myPlayer = defineModel("myPlayer");
var god_video = defineModel("god_video");
var emit = defineEmits(["update_players"]);
var playerStatus = ref({
  isDead: true,
  microphone: true,
  videoCamera: true,
  challenge: false,
  showPreLoader: true,
  Error: false
});
var videos = ref([]);
var speaker_video = ref();
function setMyVideo() {
  players.value.forEach(element => {
    if (element["socket_id"] === socket.id) {
      myPlayer.value = element;
    }
  });
}

function sendLike(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "like"
  });
}
function sendDisLike(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "dislike"
  });
}
function sendChallenge(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "challenge"
  });
}

function onVideoClick(event) {
  var parent_div = event.target.parentElement;
  let numberHolder = document.querySelector("#numberHolder");
  let informationHolder = document.querySelector("#informationHolder");
  let nameHolder = document.querySelector("#nameHolder");
  let IdHolder = document.querySelector("#IdHolder");
  let dataInfo = parent_div.getAttribute("data-info");
  // numberHolder.classList.toggle("hidden");
  informationHolder.classList.toggle("hidden");
  if (dataInfo) {
    var jData = JSON.parse(dataInfo);
    let fullName =
      jData.profile.user.first_name + " " + jData.profile.user.last_name;
    nameHolder.textContent = fullName;
    IdHolder.textContent = `#${jData.profile.unique_id}`;
  }
}
function changeVideoStatus(peer_id) {
  if (playerStatus.value.videoCamera === true) {
    playerStatus.value.videoCamera = false;
    muteVideo(peer_id);
  } else {
    playerStatus.value.videoCamera = true;
    unmuteVideo(peer_id);
  }

  localStream.getVideoTracks()[0].enabled = playerStatus.value.videoCamera;
}
function changeVoiceStatus(peer_id) {
  if (playerStatus.value.microphone) {
    playerStatus.value.microphone = false;
    muteVoice(peer_id);

    videoList.forEach(v => {
      if (v.isLocal) {
        v.muted = true;
        console.log("Mute voice");
      }
    });
  } else {
    playerStatus.value.microphone = true;
    unmuteVoice(peer_id);
  }

  localStream.getAudioTracks()[0].enabled = playerStatus.value.microphone;

  // var ele =document.querySelector("div[data-islocal='true']").
  //   getElementsByTagName("video")
  // console.log(ele)
  // ele.volume = 0
  // console.log(ele.volume)
}
function muteVoice(peer_id) {
  console.log("mute");
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "mute_voice"
  });
}
function unmuteVoice(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "unmute_voice"
  });
}
function muteVideo(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "mute_video"
  });
}
function unmuteVideo(peer_id) {
  socket.emit("command", {
    room: props.roomId,
    peer: peer_id,
    command: "unmute_video"
  });
}
async function join() {
  socket = io(props.socketURL, props.ioOptions);
  signalClient = new SimpleSignalClient(socket);
  const constraints = {
    video: props.enableVideo,
    audio: props.enableAudio
  };

  socket.on("connect")

  socket.on("command", data => {
    console.log(data);
    var div_element = document.querySelector(
      "div[data-socketid='" + data["peer"] + "']"
    );
    if (div_element) {
      const childElement = div_element.querySelector("#reactionConatiner");
      switch (data["command"]) {
        case "like":
          childElement.textContent = "👍";
          childElement.classList.add("show-reaction");
          setTimeout(() => {
            childElement.textContent = "";
            childElement.classList.toggle("show-reaction");
          }, 800);
          break;
        case "dislike":
          childElement.textContent = "👎";
          childElement.classList.add("show-reaction");
          setTimeout(() => {
            childElement.textContent = "";
            childElement.classList.toggle("show-reaction");
          }, 800);
          break;
        case "challenge":
          playerStatus.value.challenge = !playerStatus.value.challenge;
          if (playerStatus.value.challenge) {
            childElement.textContent = "🤚";
          } else {
            childElement.textContent = "";
          }
          break;
      }
    } else {
      console.log("div el not recognized");
    }
  });
  socket.on("join_game", data => {
    console.log("Join");
    if (data["status"]) {
      playerStatus.value.showPreLoader = false;
      console.log("After disable...");

      socket.emit("players_info", {
        room: props.roomId,
        socket_id: socket.id,
        token: props.token
      });
    } else {
      playerStatus.value.showPreLoader = false;
      playerStatus.value.Error = true;
    }
  });
  socket.on("players_info", data => {
    if (data["status"] === "ok") {
      players.value = data["data"]["player"];
      emit("update_players", {
        players: players,
        socket: socket
      });
    }
  });
  socket.on("leave_room", data => {
    if (data["status"] === "ok") {
      players = data["data"]["player"];
      emit("update_players", {
        players: players,
        socket: socket
      });
    }
  });

  if (props.deviceId && props.enableVideo) {
    constraints.video = {deviceId: {exact: props.deviceId}};
  }
  try {
    // TODO Change here
    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    signalClient.once("discover", discoveryData => {
      console.log("discovered", discoveryData);
      joinedRoom(localStream, true, socket.id);
      async function connectToPeer(peerID) {
        console.log("Start connecting", peerID);
        if (peerID === socket.id) return;
        try {
          console.log("Connecting to peer", peerID);
          const {peer} = await signalClient.connect(
            peerID,
            props.roomId,
            props.peerOptions
          );
          videoList.forEach(v => {
            if (v.isLocal) {
              peer["socket_id"] = peerID;
              onPeer(peer, v.stream);
            }
          });
        } catch (e) {
          console.log("Error connecting to peer", e);
        }
      }

      discoveryData.peers.forEach(peerID => connectToPeer(peerID));
    });
    signalClient.on("request", async request => {
    const {peer} = await request.accept(request.initiator, {
      initiator: request.initiator
    });
    peer["socket_id"] = request.initiator;
    console.log("accepted", peer);
    videoList.forEach(v => {
      if (v.isLocal) {
        onPeer(peer, v.stream);
      }
    });
  });
    signalClient.discover({room: props.roomId, token: props.token});
  } catch (error) {
    console.log("Error accessing media devices:", error);
  }

}
function onPeer(peer, localStream) {
  peer.addStream(localStream);
  peer.on("stream", remoteStream => {
    console.log("Stream", remoteStream);
    joinedRoom(remoteStream, false, peer["socket_id"]);
    peer.on("close", () => {
      videoList = videoList.filter(item => item.id !== remoteStream.id);
      emit("left-room", remoteStream.id);
    });
    peer.on("error", err => {
      console.log("peer error ", err);
    });
  });
}
function joinedRoom(stream, isLocal, socketId) {
  const found = videoList.find(video => video.id === stream.id);
  if (found === undefined) {
    const video = {
      id: stream.id,
      muted: isLocal,
      stream: stream,
      socketId: socketId,
      isLocal: isLocal
    };
    videoList.push(video);
  }
  setTimeout(() => {
    for (let i = 0, len = videos.value.length; i < len; i++) {
      if (videos.value[i].srcObject === null) {
        videos.value[i].srcObject = stream;
        videos.value[i].autoplay = props.autoplay;
      }
    }
  }, 2000);
}
function log(message, data = null) {
  console.log("[VueWebRTC]", message, data);
}

function fullScreen(video_id) {
  const newVideoSource = document.getElementById(video_id).srcObject;
  speaker_video.value.srcObject = newVideoSource;
}
let showActionPanel = event => {
  let el = event.target.parentElement;
  let parentDiv = el.parentElement;
  parentDiv.querySelector("#actionPanel").classList.toggle("hidden");
};
let actionIndetifier = event => {
  console.log(event.target.textContent);
};
join();
</script>

<template>
  <div>
    <div
      v-if="playerStatus.showPreLoader"
      class="absolute inset-0 bg-[rgba(0,0,0,1)] z-[60] flex items-center justify-center flex-col"
    >
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-[red] font-[800]"
        role="status"
      ></div>
      <p class="text-[green] font-[800] text-[20px] mt-2">درحال ورود به اتاق</p>
    </div>
    <div
      v-if="playerStatus.Error"
      class="absolute inset-0 bg-[rgba(0,0,0,1)] z-[60] flex items-center justify-center flex-col"
    >
      <p class="text-[red] font-[800] text-[20px] mt-2">
        خطا در هنگام ورود به اتاق
      </p>
      <button
        class="border p-2 rounded-lg hover:text-black hover:bg-white transition-all mt-2"
      >
        بازگشت به اپلیکیشن
      </button>
    </div>
    <div class="flex items-center h-[13vh] md:h-[39vh]">
      <!--      God Video -->
      <div
        class="w-[37%] mx-[5%] overflow-hidden rounded-2xl border-[#F1C529] border-[4px] relative h-[100%] md:h-[65%] md:mt-[84px] md:ml-[2%] md:w-[40%]"
      >
        <video
          width="100%"
          height="100%"
          class="absolute bottom-0"
          id="god_video"
          ref="god_video"
          playsinline
          autoplay
        ></video>
      </div>
      <div
        class="h-[65%] min-h-[65px] bg-[#252525] [box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] rounded-2xl p-2 w-[45%] md:absolute md:bottom-3 md:right-[44%] md:h-[45px] z-20 md:w-[200px]"
      >
        <div class="flex">
          <p class="ml-[2px]">نقش شما:</p>
          <p class="text-[#B51818]">پدرخوانده</p>
        </div>
        <p class="mx-[7%]">سناریو پدرخوانده</p>
      </div>
    </div>
    <div class="px-2 mt-1 h-[76vh] pb-[45px] relative md:pb-0 md:h-[60vh]">
      <!--      Speaking video  -->
      <div
        class="border w-[95%] mr-[5%] h-[19vh] flex rounded-2xl relative overflow-hidden md:hidden"
      >
        <video
          width="100%"
          height="100%"
          class="absolute bottom-0"
          ref="speaker_video"
          playsinline
          autoplay
        ></video>
      </div>
      <!-- 16th container -->
      <div class="flex flex-wrap justify-end camera h-[70%] mt-1 md:h-[100%]">
        <div
          class="w-[23%] h-[23%] max-h-[23%] rounded-lg relative md:w-[19%] md:min-h-[30%] md:my-2"
          v-for="(video, index) in videoList"
          :key="video.id"
          :class="{selfCamera: video.isLocal}"
          :data-socketId="video.socketId"
          :data-isLocal="video.isLocal"
          @click="onVideoClick"
        >
          <img
            src="/microphone-mute.svg"
            alt=""
            class="absolute w-[25px] bottom-1 left-1 rounded-full border p-1 bg-[#c0bebe]"
            v-if="playerStatus.microphone === false"
          />
          <div
            class="bg-[#c0bebe] absolute px-[6px] py-[5px] rounded-full bottom-1 left-8"
            v-if="playerStatus.videoCamera == false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="red"
              class="w-[15px]"
              viewBox="0 0 640 512"
            >
              <path
                d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-86.4-67.7 13.8 9.2c9.8 6.5 22.4 7.2 32.9 1.6s16.9-16.4 16.9-28.2V128c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.9 1.6l-96 64L448 174.9V192 320v5.8l-32-25.1V128c0-35.3-28.7-64-64-64H113.9L38.8 5.1zM407 416.7L32.3 121.5c-.2 2.1-.3 4.3-.3 6.5V384c0 35.3 28.7 64 64 64H352c23.4 0 43.9-12.6 55-31.3z"
              />
            </svg>
          </div>

          <div
            id="numberHolder"
            class="bg-[black] [box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] rounded-full w-[25px] text-center left-1 absolute"
          >
            {{ index + 1 }}
          </div>
          <div
            class="absolute bottom-[1px] left-[37%] text-[20px] z-40"
            id="reactionConatiner"
          ></div>
          <div
            id="informationHolder"
            class="absolute inset-0 bg-[rgba(0,0,0,0.55)] z-20 hidden rounded-lg"
          >
            <div class="[direction:ltr] text-[12px] h-[40px] flex flex-col">
              <p id="nameHolder"></p>
              <p id="IdHolder"></p>
            </div>
            <img
              src="/threeDots.svg"
              class="z-50 w-[15px] absolute top-0 cursor-pointer right-2"
              @click="showActionPanel"
              @click.prevent="onVideoClick"
            />
            <img
              @click="fullScreen(video.id)"
              src="/expand.svg"
              alt=""
              class="w-[18px] absolute bottom-1 right-1"
            />
          </div>
          <video
            class="w-[100%] h-[100%]"
            ref="videos"
            :id="video.id"
            :muted="video.isLocal"
            playsinline
          ></video>
          <div
            class="absolute bg-black z-50 top-[15px] flex flex-col w-[80px] rounded-lg right-[-50px] *:p-1 overflow-hidden hidden"
            id="actionPanel"
            @click.prevent="onVideoClick"
          >
            <span
              class="hover:bg-[#333333] transition-all cursor-pointer"
              @click="actionIndetifier"
              >کشتن</span
            >
            <span
              class="hover:bg-[#333333] transition-all cursor-pointer"
              @click="actionIndetifier"
              >تارگت</span
            >
            <span
              class="hover:bg-[#333333] transition-all cursor-pointer"
              @click="actionIndetifier"
              >کیک</span
            >
          </div>
        </div>
      </div>
      <!-- reaction panel container  -->
      <div
        class="w-[100%] flex justify-between h-[55px] mt-1 [direction:ltr] absolute bottom-0 px-[5%] md:w-[42%] md:px-0 md:bottom-[80px] md:h-[40px]"
      >
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] ml-3"
          @click="sendLike(socket.id)"
        >
          <p class="text-center pt-1">👍</p>
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]"
          @click="sendDisLike(socket.id)"
        >
          <p class="text-center pt-[7px]">👎</p>
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]"
          @click="sendChallenge(socket.id)"
          :class="{'bg-white': playerStatus.challenge}"
        >
          <p class="text-center pt-[7px] pr-[2px]">🤚</p>
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] transition-[300ms]"
          :class="{'bg-white': playerStatus.microphone}"
          @click="changeVoiceStatus(socket.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            class="w-[29px] md:w-[17px] mx-auto"
            v-if="playerStatus.microphone"
          >
            <path
              class="fill-white"
              :class="{fillblacker: playerStatus.microphone}"
              d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 512"
            fill="white"
            class="w-[39px] md:w-[27px] mx-auto"
            v-if="playerStatus.microphone == false"
          >
            <path
              d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L472.1 344.7c15.2-26 23.9-56.3 23.9-88.7V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 21.2-5.1 41.1-14.2 58.7L416 300.8V96c0-53-43-96-96-96s-96 43-96 96v54.3L38.8 5.1zm362.5 407l-43.1-33.9C346.1 382 333.3 384 320 384c-70.7 0-128-57.3-128-128v-8.7L144.7 210c-.5 1.9-.7 3.9-.7 6v40c0 89.1 66.2 162.7 152 174.4V464H248c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H344V430.4c20.4-2.8 39.7-9.1 57.3-18.2z"
            />
          </svg>
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center transition-[300ms]"
          :class="{'bg-white': playerStatus.videoCamera}"
          @click="changeVideoStatus(socket.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            fill="black"
            class="w-[35px] md:w-[19px] mx-auto"
            v-if="playerStatus.videoCamera"
          >
            <path
              d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            class="w-[35px]"
            viewBox="0 0 640 512"
            v-else
          >
            <path
              d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-86.4-67.7 13.8 9.2c9.8 6.5 22.4 7.2 32.9 1.6s16.9-16.4 16.9-28.2V128c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.9 1.6l-96 64L448 174.9V192 320v5.8l-32-25.1V128c0-35.3-28.7-64-64-64H113.9L38.8 5.1zM407 416.7L32.3 121.5c-.2 2.1-.3 4.3-.3 6.5V384c0 35.3 28.7 64 64 64H352c23.4 0 43.9-12.6 55-31.3z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-center {
  @apply flex items-center justify-center;
}

video {
  width: 100%;
}

.deadPlayer::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: rgba(192, 0, 0, 0.45);
}

.fillblacker {
  fill: black !important;
}

.camera > div {
  margin-inline: 2px;
}
</style>
