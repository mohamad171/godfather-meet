<script>
import { defineComponent } from 'vue';
import { io } from 'socket.io-client';
import 'fast-crypto';

import SimpleSignalClient from 'simple-signal-client';

export default defineComponent({
  data() {
    return {
      signalClient: null,
      videoList: [],
      canvas: null,
      socket: null
    };
  },
  props: {
    roomId: {
      type: String,
      default: 'public-room-v2'
    },
    socketURL: {
      type: String,
      default: 'http://socket.straiberry.com'
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
      default: 'image/jpeg'
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
        return { rejectUnauthorized: false, transports: ['polling', 'websocket'] };
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
        constraints.video = { deviceId: { exact: that.deviceId } };
      }
      try {
        const localStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.log('opened', localStream);
        this.joinedRoom(localStream, true);
        this.signalClient.once('discover', (discoveryData) => {
          that.log('discovered', discoveryData);
          async function connectToPeer(peerID) {
            if (peerID === that.socket.id) return;
            try {
              that.log('Connecting to peer');
              const { peer } = await that.signalClient.connect(peerID, that.roomId, that.peerOptions);
              that.videoList.forEach(v => {
                if (v.isLocal) {
                  that.onPeer(peer, v.stream);
                }
              });
            } catch (e) {
              that.log('Error connecting to peer',e);
            }
          }
          discoveryData.peers.forEach((peerID) => connectToPeer(peerID));
          that.$emit('opened-room', that.roomId);
        });
      } catch (error) {
        that.log('Error accessing media devices:', error);
      }
      this.signalClient.on('request', async (request) => {
        that.log('requested', request);
        const { peer } = await request.accept({}, that.peerOptions);
        that.log('accepted', peer);
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
      that.log('onPeer');
      peer.addStream(localStream);
      peer.on('stream', (remoteStream) => {
        that.joinedRoom(remoteStream, false);
        peer.on('close', () => {
          const newList = that.videoList.filter(item => item.id !== remoteStream.id);
          that.videoList = newList;
          that.$emit('left-room', remoteStream.id);
        });
        peer.on('error', (err) => {
          that.log('peer error ', err);
        });
      });
    },
    joinedRoom(stream, isLocal) {
      const that = this;
      const found = that.videoList.find(video => video.id === stream.id);
      console.log("Foooound",found)
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
        console.log('[VueWebRTC]', message, data);

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
    <div v-for="video in videoList" :key="video.id">
      <video
      :ref="`videos`"
      :muted="video.muted"
      :style="{ height: `${cameraHeight}px` }"
      playsinline
    ></video>
      <div v-if="video.isLocal">
        <button class="btn btn-sm">👍</button>
        <button class="btn btn-sm">👎</button>
        <button class="btn btn-sm">🤚</button>
      </div>



    </div>

  </div>

</template>

<style scoped>
video {
  width: 100%;
}
</style>