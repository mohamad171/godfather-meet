<script>
import {ref} from "vue";
import {defineComponent} from "vue";
import {io} from "socket.io-client";
import "fast-crypto";
import SimpleSignalClient from "simple-signal-client";
export default defineComponent({
  data() {
    return {
      signalClient: null,
      videoList: [],
      canvas: null,
      socket: null,
      playerStatus: ref({
        isDead: true,
        Showinformatin: true,
        Shownumber: false,
        microphone: true,
        videoCamera: false,
        challenge: false,
        showPreLoader: true,
        Error: false
      })
    };
  },
  props: {
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
  },

  mounted() {
    this.join();
  },
  methods: {
    sendLike(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "like"
      });
    },
    sendDisLike(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "dislike"
      });
    },
    sendChallenge(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "challenge"
      });
    },

    changeVideoStatus(peer_id) {
      if (this.playerStatus.videoCamera === true) {
        this.playerStatus.videoCamera = false;
        this.muteVideo(peer_id);
      } else {
        this.playerStatus.videoCamera = true;
        this.unmuteVideo(peer_id);
      }
    },
    changeVoiceStatus(peer_id) {
      console.log(this.playerStatus.microphone);
      if (this.playerStatus.microphone) {
        this.playerStatus.microphone = false;
        this.muteVoice(peer_id);
      } else {
        this.playerStatus.microphone = true;
        this.unmuteVoice(peer_id);
      }
    },
    muteVoice(peer_id) {
      console.log("mute");
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "mute_voice"
      });
    },
    unmuteVoice(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "unmute_voice"
      });
    },
    muteVideo(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "mute_video"
      });
    },
    unmuteVideo(peer_id) {
      this.socket.emit("command", {
        room: this.roomId,
        peer: peer_id,
        command: "unmute_video"
      });
    },
    async join() {
      const that = this;
      this.socket = io(this.socketURL, this.ioOptions);
      this.signalClient = new SimpleSignalClient(this.socket);
      const constraints = {
        video: that.enableVideo,
        audio: that.enableAudio
      };

      this.socket.on("command", data => {
        console.log(data);
        var div_element = document.querySelector(
          "div[data-socketid='" + data["peer"] + "']"
        );
        if (div_element) {
          const childElement = div_element.querySelector("#reactionConatiner");
          console.log(childElement);
          switch (data["command"]) {
            case "like":
              childElement.textContent = "👍";
              childElement.classList.add("show-reaction");
              setTimeout(() => {
                childElement.textContent = "";
                childElement.classList.toggle("show-reaction");
              }, 2000);
              break;
            case "dislike":
              childElement.textContent = "👎";
              childElement.classList.add("show-reaction");
              setTimeout(() => {
                childElement.textContent = "";
                childElement.classList.toggle("show-reaction");
              }, 2000);
              break;
            case "challenge":
              this.playerStatus.challenge = !this.playerStatus.challenge;
              if (this.playerStatus.challenge) {
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
      this.socket.on("join_game", data => {
        if (data["status"]) {
          this.playerStatus.showPreLoader = false;

          this.socket.emit("players_info",{"room":this.roomId,
            "socket_id":this.socket.id,
            "token":this.token
          })

        } else {
          this.playerStatus.showPreLoader = false;
          this.playerStatus.Error = true;
        }
      });
      this.socket.on("players_info", data => {
        console.log(data)
      });

      if (that.deviceId && that.enableVideo) {
        constraints.video = {deviceId: {exact: that.deviceId}};
      }
      try {
        const localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        this.log("opened", localStream);
        console.log(that.socket.id);
        this.joinedRoom(localStream, true, that.socket.id);
        this.signalClient.once("discover", discoveryData => {
          that.log("discovered", discoveryData);
          async function connectToPeer(peerID) {
            if (peerID === that.socket.id) return;
            try {
              that.log("Connecting to peer");
              const {peer} = await that.signalClient.connect(
                peerID,
                that.roomId,
                that.peerOptions
              );
              that.videoList.forEach(v => {
                if (v.isLocal) {
                  peer["socket_id"] = peerID;
                  that.onPeer(peer, v.stream);
                }
              });
            } catch (e) {
              that.log("Error connecting to peer", e);
            }
          }
          discoveryData.peers.forEach(peerID => connectToPeer(peerID));
          that.$emit("opened-room", that.roomId);
        });
      } catch (error) {
        that.log("Error accessing media devices:", error);
      }
      this.signalClient.on("request", async request => {
        that.log("requested", request.initiator);
        const {peer} = await request.accept(request.initiator, {
          initiator: request.initiator
        });
        peer["socket_id"] = request.initiator;
        that.log("accepted", peer);
        that.videoList.forEach(v => {
          if (v.isLocal) {
            that.onPeer(peer, v.stream);
          }
        });
      });
      this.signalClient.discover({room: that.roomId, token: this.token});
    },
    onPeer(peer, localStream) {
      const that = this;
      peer.addStream(localStream);
      peer.on("stream", remoteStream => {
        console.log("Stream", remoteStream);
        that.joinedRoom(remoteStream, false, peer["socket_id"]);
        peer.on("close", () => {
          const newList = that.videoList.filter(
            item => item.id !== remoteStream.id
          );
          that.videoList = newList;
          that.$emit("left-room", remoteStream.id);
        });
        peer.on("error", err => {
          that.log("peer error ", err);
        });
      });
    },
    joinedRoom(stream, isLocal, socketId) {
      const that = this;
      const found = that.videoList.find(video => video.id === stream.id);
      if (found === undefined) {
        const video = {
          id: stream.id,
          muted: isLocal,
          stream: stream,
          socketId: socketId,
          isLocal: isLocal
        };
        that.videoList.push(video);
        console.log(that.videoList);
      }
      setTimeout(function () {
        for (let i = 0, len = that.$refs.videos.length; i < len; i++) {
          if (that.$refs.videos[i].srcObject === null) {
            that.$refs.videos[i].srcObject = stream;
            that.$refs.videos[i].autoplay = that.autoplay;
          }
        }
      }, 1000);
    },
    log(message, data = null) {
      console.log("[VueWebRTC]", message, data);
    }
  },
  beforeUnmount() {
    if (this.signalClient) {
      this.signalClient.destroy();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }
});
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
      <!--      <div-->
      <!--        v-for="video in videoList"-->
      <!--        :key="video.id"-->
      <!--        class="w-[37%] mx-[5%] overflow-hidden rounded-2xl border-[#F1C529] border-[4px] relative h-[100%] md:h-[65%] md:mt-[84px] md:ml-[2%] md:w-[40%]"-->
      <!--      >-->
      <!--        <video-->
      <!--          width="100%"-->
      <!--          height="100%"-->
      <!--          :class="{selfCamera: video.isLocal}"-->
      <!--          class="absolute bottom-0"-->
      <!--          :ref="`videos`"-->
      <!--          :muted="video.muted"-->
      <!--          playsinline-->
      <!--        ></video>-->
      <!--      </div>-->
      <div
        class="h-[65%] min-h-[65px] bg-[#252525] [box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] rounded-2xl p-2 w-[45%] md:absolute md:bottom-3 md:right-[44%] md:h-[45px] z-20 md:w-[200px]"
      >
        <div class="flex">
          <p class="ml-[2px]">نقش شما:</p>
          <p class="text-[#B51818]">پدرخوانده</p>
        </div>
        <p class="mx-[7%]">سناریو پدرخوانده</p>
      </div>
      <!--      <div-->
      <!--        v-for="video in videoList"-->
      <!--        :key="video.id"-->
      <!--        class="border w-[57%] h-[95%] mt-[2.5%] rounded-2xl relative overflow-hidden hidden md:flex"-->
      <!--      >-->
      <!--        <video-->
      <!--          width="100%"-->
      <!--          height="100%"-->
      <!--          :class="{selfCamera: video.isLocal}"-->
      <!--          class="absolute bottom-0"-->
      <!--          :ref="`videos`"-->
      <!--          :muted="video.muted"-->
      <!--          playsinline-->
      <!--        ></video>-->
      <!--      </div>-->
    </div>
    <div class="px-2 mt-1 h-[76vh] pb-[45px] relative md:pb-0 md:h-[60vh]">
      <!--      Speaking video  -->
      <!--      <div-->
      <!--        v-for="video in videoList"-->
      <!--        :key="video.id"-->
      <!--        class="border w-[95%] mr-[5%] h-[19vh] flex rounded-2xl relative overflow-hidden md:hidden"-->
      <!--      >-->
      <!--        <video-->
      <!--          width="100%"-->
      <!--          height="100%"-->
      <!--          :class="{selfCamera: video.isLocal}"-->
      <!--          class="absolute bottom-0"-->
      <!--          :ref="`videos`"-->
      <!--          :muted="video.muted"-->
      <!--          playsinline-->
      <!--        ></video>-->
      <!--      </div>-->
      <!-- 16th container -->
      <div class="flex flex-wrap justify-end camera h-[70%] mt-1 md:h-[100%]">
        <div
          class="w-[23%] h-[23%] max-h-[23%] overflow-hidden rounded-lg relative md:w-[19%] md:min-h-[30%] md:my-2"
          v-for="(video, index) in videoList"
          :key="video.id"
          :data-socketId="video.socketId"
          @click="
            (playerStatus.Showinformatin = !playerStatus.Showinformatin),
              (playerStatus.Shownumber = !playerStatus.Shownumber)
          "
        >
          <img
            src="/microphone-mute.svg"
            alt=""
            class="absolute w-[25px] bottom-1 left-1 rounded-full border p-1 bg-[white]"
            v-if="playerStatus.microphone == false"
          />
          <div
            class="bg-[black] [box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] rounded-full w-[25px] text-center left-1 absolute"
            :class="{hidden: playerStatus.Shownumber}"
          >
            {{ index + 1 }}
          </div>
          <div
            class="absolute bottom-2 left-[37%] text-[20px]"
            id="reactionConatiner"
          ></div>
          <div
            class="absolute inset-0 bg-[rgba(0,0,0,0.55)] z-20"
            :class="{hidden: playerStatus.Showinformatin}"
          >
            <div class="[direction:ltr] text-[12px]">
              امیرعلی<br />
              #217478
            </div>
            <img
              src="/expand.svg"
              alt=""
              class="w-[18px] absolute bottom-1 right-1"
            />
          </div>
          <video
            :class="video.isLocal ? 'border-2 border-green-800' : ''"
            class="w-[100%] h-[100%]"
            :ref="`videos`"
            :id="video.id"
            :muted="video.muted"
            playsinline
          ></video>
        </div>
      </div>
      <!-- reaction panel container  -->
      <div
        class="w-[100%] flex justify-between h-[55px] mt-1 [direction:ltr] absolute bottom-0 px-[5%] md:w-[42%] md:px-0 md:bottom-[80px] md:h-[40px]"
      >
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] ml-3"
          @click="sendLike(this.socket.id)"
        >
          👍
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]"
          @click="sendDisLike(this.socket.id)"
        >
          👎
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]"
          @click="sendChallenge(this.socket.id)"
          :class="{'bg-white': playerStatus.challenge}"
        >
          🤚
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] transition-[300ms]"
          :class="{'bg-white': playerStatus.microphone}"
          @click="changeVoiceStatus(this.socket.id)"
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
          @click="changeVideoStatus(this.socket.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            class="w-[31px] md:w-[19px] mx-auto"
          >
            <path
              class="fill-white"
              :class="{fillblacker: playerStatus.videoCamera}"
              d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
