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
        microphone: false,
        videoCamera: false
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
      default: "https://websocket.straiberry.com"
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
    }
  },
  mounted() {
    this.join();
  },
  methods: {
    async join() {
      const that = this;
      this.socket = io(this.socketURL, this.ioOptions);
      this.signalClient = new SimpleSignalClient(this.socket);
      const constraints = {
        video: that.enableVideo,
        audio: that.enableAudio
      };
      if (that.deviceId && that.enableVideo) {
        constraints.video = {deviceId: {exact: that.deviceId}};
      }
      try {
        const localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        this.log("opened", localStream);
        this.joinedRoom(localStream, true);
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
        that.log("requested", request);
        const {peer} = await request.accept({}, that.peerOptions);
        that.log("accepted", peer);
        that.videoList.forEach(v => {
          if (v.isLocal) {
            that.onPeer(peer, v.stream);
          }
        });
      });
      this.signalClient.discover(that.roomId);
    },
    onPeer(peer, localStream) {
      const that = this;
      that.log("onPeer");
      peer.addStream(localStream);
      peer.on("stream", remoteStream => {
        that.joinedRoom(remoteStream, false);
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
    joinedRoom(stream, isLocal) {
      const that = this;
      const found = that.videoList.find(video => video.id === stream.id);
      console.log("Foooound", found);
      if (found === undefined) {
        const video = {
          id: stream.id,
          muted: isLocal,
          stream: stream,
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
      <div
        v-for="video in videoList"
        :key="video.id"
        class="border w-[95%] mr-[5%] h-[19vh] flex rounded-2xl relative overflow-hidden md:hidden"
      >
        <video
          width="100%"
          height="100%"
          :class="{selfCamera: video.isLocal}"
          class="absolute bottom-0"
          :ref="`videos`"
          :muted="video.muted"
          playsinline
        ></video>
      </div>
      <!-- 16th container -->
      <div class="flex flex-wrap justify-end camera h-[70%] mt-1 md:h-[100%]">
        <div
          class="w-[23%] h-[23%] max-h-[23%] overflow-hidden rounded-lg relative md:w-[19%] md:min-h-[30%] md:my-2"
          v-for="video in videoList"
          :key="video.id"
          @click="
            (playerStatus.Showinformatin = !playerStatus.Showinformatin),
              (playerStatus.Shownumber = !playerStatus.Shownumber)
          "
        >
          <div
            class="bg-[black] [box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] rounded-full w-[25px] text-center left-1 absolute"
            :class="{hidden: playerStatus.Shownumber}"
          >
            1
          </div>
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
            :class="(video.isLocal) ? 'border-2 border-green-800' : ''"
            class="w-[100%] h-[100%]"
            :ref="`videos`"
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
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]  ml-3"
        >
          👍
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] "
        >
          👎
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px] "
        >
          🤚
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center text-[34px] md:text-[20px]  transition-[300ms]"
          :class="{'bg-white': playerStatus.microphone}"
          @click="playerStatus.microphone = !playerStatus.microphone"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            class="w-[29px] md:w-[17px] mx-auto"
          >
            <path
              class="fill-white"
              :class="{fillblacker: playerStatus.microphone}"
              d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"
            />
          </svg>
        </button>
        <button
          class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[60px] rounded-full flex-center transition-[300ms]"
          :class="{'bg-white': playerStatus.videoCamera}"
          @click="playerStatus.videoCamera = !playerStatus.videoCamera"
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