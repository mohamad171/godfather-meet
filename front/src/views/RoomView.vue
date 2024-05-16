<script setup>
import Dropdown from "primevue/dropdown";
import {ref, onMounted} from "vue";
import {useAppwriteState} from "../stores/appwriteState";
import WebrtcComponent from "@/components/WebrtcComponent.vue";
import {TabGroup, TabList, Tab, TabPanels, TabPanel} from "@headlessui/vue";
const selectedPlayer = ref();
import {useRoute} from "vue-router";

const route = useRoute();
let uistate = ref({
  mobileMenu: false,
  DesktopWarning: false,
  tabs: [
    {
      name: "پیام ها",
      show: true
    },
    {
      name: "اکت شب",
      show: true
    },
    {
      name: "گرداننده",
      show: true
    }
  ]
});
// elements ref
let messageContainer = ref(null);
let messegeInput = ref(null);
var players = ref([]);
var actions = ref([]);
let socket;
let myPlayer = ref();
let myRole = ref(null);
const targetIds = ref([]);
class messageModel {
  message;
  number;
  role;
  name;
  constructor(message, number, role, name) {
    this.message = message;
    this.number = number;
    this.role = role;
    this.name = name;
  }
}
var messages = ref([]);
onMounted(() => {
  setInterval(() => {
    if (window.innerWidth > 768) {
      uistate.value.DesktopWarning = true;
    } else {
      uistate.value.DesktopWarning = false;
    }
  }, 2000);
});
function setDataPeerVideo() {
  players.value.forEach(element => {
    var div_element = document.querySelector(
      "div[data-socketid='" + element["socket_id"] + "']"
    );
    if (div_element) {
      div_element.setAttribute("data-info", JSON.stringify(element));
      console.log(element.room_role)
      if (element.room_role === "god") {
        var video_item = div_element.querySelector("video");
        video_item.addEventListener("loadedmetadata", () => {
          document.getElementById("god_video").srcObject = video_item.srcObject;
          div_element.style.display = "none";
          console.log("Set video to god video")
        });


      }

      var number_element = div_element.querySelector(`#peer_number`);
      if (number_element) {
        console.log(element["number"]);
        number_element.innerHTML = element["number"];
      }
      console.log(element)

      // if(element.voice){
      //   document.getElementById(`${element["socket_id"]}_mute`).style.display = "none"
      // }else{
      //   document.getElementById(`${element["socket_id"]}_mute`).style.display = "block"
      // }
      //
      // if(element.video){
      //   document.getElementById(`${element["socket_id"]}_video_mute`).style.display = "none"
      // }else{
      //   document.getElementById(`${element["socket_id"]}_video_mute`).style.display = "block"
      // }

    }else{
      console.log("Div element not found")
    }
    if (element["socket_id"] === socket.id) {
      myPlayer.value = element;
      uistate.value.tabs[2].show = myPlayer.value["room_role"] === "god";
      if (myPlayer.value.room_role === "god") {
        socket.emit("get_actions", {room: route.params.room_id});
      }
    }
  });
}
function setMyPlayer(player) {
  myRole.value = player.role;
  console.log(myPlayer.value);
}

function sendTargets() {
  socket.emit("send_action", {
    room: route.params.room_id,
    targets: targetIds.value
  });
  targetIds.value = [];
}

var is_socket_init = false;

function initSocket(){
  if(!is_socket_init){
    socket.on("message", message => {
    console.log("message")
    messages.value.push(
      new messageModel(
        message.message,
        message.sender.number,
        message.sender.role ? message.sender.role.name : null,
        message.sender.profile.user.first_name
      )
    );
    setTimeout(() => {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }, 100);
  });
    socket.on("load_messages", data => {
      console.log("Load messages",data)
      for (var i = 0; i < data.data.messages.length; i++) {
        var message = data.data.messages[i];
        messages.value.push(
          new messageModel(
            message.message,
            message.sender.number,
            message.sender.role ? message.sender.role.name : null,
            message.sender.profile.user.first_name
          )
        );
      }

      setTimeout(() => {
        if (messageContainer.value !== null) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
        }
      }, 100);
    });

    socket.on("actions", data => {
      actions.value = data.actions;
      console.log(actions.value);
    });
    is_socket_init = true;
  }

}

function updatePlayers(data) {
  socket = data["socket"];
  setTimeout(() => {
    setDataPeerVideo();
  }, 2500);
  socket.on("role", role_data => {
    setMyPlayer(role_data);
  });
  initSocket()
}



function setRoles(room_id) {
  if (socket) {
    console.log("Sending request...");
    socket.emit("set_roles", {room: room_id});
  }
}

let sendMessege = room_id => {
  console.log("Call send message")
  let newMessege = messegeInput.value.value;
  messegeInput.value.value = "";
  if (myPlayer.value.room_role === "god") {
    if (selectedPlayer != null)
      socket.emit("message", {
        message: newMessege,
        room: room_id,
        receiver: selectedPlayer.id
      });
  } else {
    socket.emit("message", {message: newMessege, room: room_id});
  }
};

function exit() {
  window.location.assign("https://meet.godfathergame.ir/goodbye-screen")
  socket.disconnect();
}
</script>
<template>
  <div
    class="text-[white] bg-[#2E2E2E] h-[100vh] relative flex flex-col md:flex-row"
  >
    <div
      class="w-[100%] h-[100%] inset-0 bg-black absolute z-50 flex items-center justify-center"
      v-if="uistate.DesktopWarning"
    >
      <p>لطفا برای استفاده از برنامه از موبایل استفاده کنید</p>
    </div>

    <!-- menu for mobile -->
    <div
      v-if="uistate.mobileMenu"
      class="w-[100%] z-30 absolute h-[100vh] flex flex-col bg-[#2E2E2E] md:relative md:w-[39%] md:border-l-[1px]"
    >
      <img
        src="/xmark.svg"
        alt=""
        class="absolute left-2 top-1 w-[30px] hover:scale-[1.1] transition-all cursor-pointer md:hidden"
        @click="uistate.mobileMenu = !uistate.mobileMenu"
      />
      <TabGroup>
        <TabList class="w-[100%] bg-[rgba(255,0,0,0.3)] ml-[1%] flex">
          <Tab
            v-for="c in uistate.tabs.filter(t => t.show === true)"
            as="template"
            :key="c"
            v-slot="{selected}"
          >
            <button
              :class="[
                'w-[28%] rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-offset-2 ring-offset-[red] focus:outline-none ',
                selected
                  ? 'bg-[black] text-[red] shadow border-[4px] border-[red]'
                  : 'text-[whitesmoke] hover:bg-white/[0.05]'
              ]"
            >
              {{ c.name }}
            </button>
          </Tab>
        </TabList>
        <TabPanels class="h-[93%] overflow-hidden">
          <TabPanel class="h-[100%]">
            <div class="text-[22px] m-3 mr-4">
              گفتگو با
              <span
                class="text-[#9c2525] font-bold"
                v-if="myRole && myRole.side === 0"
                >تیم مافیا</span
              >
              <span class="text-[#f1c529] font-bold" v-else>گرداننده</span>
            </div>
            <div
              ref="messageContainer"
              class="h-[80%] flex flex-col items-start max-w-[100%] overflow-y-auto pl-[12%]"
            >
              <div
                class="flex m-1 mr-0 max-w-[98%] mt-2"
                v-for="item in messages"
              >
                <div
                  class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] min-w-[30px] max-h-[32px] py-[1px] rounded-full flex-center mx-1"
                >
                  {{ item.number }}
                </div>
                <div
                  class="bg-[#252525] min-h-[45px] p-2 [box-shadow:0px_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md min-w-[100px]"
                >
                  <div class="flex items-end">
                    <p class="ml-1 text-[#D9D9D9]">{{ item.name }}</p>
                    <p class="text-[#B51818] text-[10px]">{{ item.role }}</p>
                  </div>
                  <p
                    class="text-[12px] min-h-[40px]"
                    style="display: inline-block; word-break: break-word"
                  >
                    {{ item.message }}
                  </p>
                </div>
              </div>
            </div>
            <div class="absolute bottom-0 flex w-[100%]">
              <textarea
                @keyup.enter.exact="sendMessege($route.params.room_id)"
                class="bg-[#252525] p-[14px] h-[60px] w-[88%] resize-none"
                style="border-radius: 16px 16px 0 0"
                placeholder="اینجا بنویسید"
                ref="messegeInput"
              />
              <div
                class="card flex justify-content-center absolute left-[17%] bottom-[17%]"
              >
                <select
                  v-if="myPlayer.room_role === 'god'"
                  v-model="selectedPlayer"
                  class="w-[120px] flex items-center justify-between py-[5px] px-[5px] rounded-md bg-black target border border-[#333333]"
                >
                  <option v-for="player in players" :key="player.id">
                    {{ player.profile.user.first_name }}
                    {{ player.profile.user.last_name }}
                    <span v-if="player.profile.role"
                      >({{ player.profile.role.name }})</span
                    >
                  </option>
                </select>
              </div>
              <button
                class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[55px] h-[55px] mt-[5px] rounded-full flex-center mx-[2%]"
                @click="sendMessege($route.params.room_id)"
              >
                <img src="/send.svg" class="w-[23px]" alt="" />
              </button>
            </div>
          </TabPanel>
          <TabPanel>
            <div class="h-[53%] pt-[40px]">
              <button
                class="absolute bottom-[3%] py-1 px-8 rounded-md left-[5%] bg-[#217C0B] text-[20px] w-[90%]"
                @click="sendTargets"
              >
                ثبت
              </button>
              <p class="mr-2 text-[20px] mb-1">تارگت خود را انتخاب کنید</p>
              <div class="flex flex-wrap w-[90%] pr-[4%] justify-between">
                <label
                  v-for="item in players"
                  class="my-[5px] container2 w-[45%] flex items-center"
                >
                  <input type="checkbox" :value="item.id" v-model="targetIds" />
                  <span class="checkmark"></span>
                  <p class="text-[16px]">
                    {{ item.profile.user.first_name }}
                    {{ item.profile.user.last_name }}
                  </p>
                </label>
              </div>
            </div>
          </TabPanel>
          <TabPanel class="flex-center pt-[50px] flex-col">
            <button
              class="w-[40%] h-[80px] bg-black rounded"
              @click="setRoles($route.params.room_id)"
            >
              تقسیم نقش
            </button>
            <div
              class="overflow-y-auto w-[98%] border-[white] mt-[10px] border-2 max-h-[500px]"
            >
              <table class="w-[100%] mx-auto">
                <tr class="*:border *:p-2">
                  <th class="hover:bg-black transition-all">شماره</th>
                  <th class="hover:bg-black transition-all">اسم بازیکن</th>
                  <th class="hover:bg-black transition-all">تارگت</th>
                  <th class="hover:bg-black transition-all">زمان</th>
                </tr>
                <tr
                  v-for="action in actions"
                  class="*:text-center *:text-[18px] *:border *:py-2"
                >
                  <td>{{ action.id }}</td>
                  <td>
                    <p>
                      {{ action.player.profile.user.first_name }}
                      {{ action.player.profile.user.last_name }}
                    </p>
                    <small v-if="action.player.role"
                      >{{ action.player.role.name }} ({{
                        action.player.role.side
                      }})</small
                    >
                    <small class="text-gray-400"
                      >#{{ action.player.profile.unique_id }}</small
                    >
                  </td>
                  <td>
                    <p>
                      {{ action.target.profile.user.first_name }}
                      {{ action.target.profile.user.last_name }}
                    </p>
                    <small v-if="action.target.role"
                      >{{ action.target.role.name }} ({{
                        action.target.role.side
                      }})</small
                    >
                    <small class="text-gray-400"
                      >#{{ action.target.profile.unique_id }}</small
                    >
                  </td>
                  <td>{{ action.time }}</td>
                </tr>
              </table>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
    <!-- menu for mobile -->
    <div
      class="flex items-start h-[60px] w-[100%] justify-between py-2 px-3 md:flex-row-reverse md:absolute right-[39%] z-20 md:w-[250px]"
    >
      <img
        class="md:hidden cursor-pointer p-1"
        src="/menu.svg"
        alt=""
        @click="uistate.mobileMenu = !uistate.mobileMenu"
      />
      <img
        src="/logo.png"
        alt=""
        class="w-[100px] left-[42%] top-[-17px] absolute z-[40] md:min-w-[145px] md:bottom-[30px]"
      />
      <button
        class="bg-[#B51818] w-[100px] py-1 h-[32px] rounded-xl text-[18px] [box-shadow:0px_4px_4px_0px_rgba(0,0,0,0.1)]"
        @click="exit"
      >
        <p class="relative bottom-1">خروج</p>
      </button>
    </div>
    <!--socketURL="https://websocket.godfathergame.ir"-->
    <div class="md:w-[61%]">
      <WebrtcComponent
        width="150"
        height="150"
        @update_players="updatePlayers"
        :room-id="$route.params.room_id"
        :token="$route.params.token"
        v-model:socket="socket"
        socketURL="https://websocket.godfathergame.ir"
        v-model:myRole="myRole"
        v-model:players="players"
        v-model:myPlayer="myPlayer"
      />
    </div>
  </div>
</template>
<style scoped>
.flex-center {
  @apply flex items-center justify-center;
}
input:focus {
  @apply outline-none;
}
* {
  direction: rtl;
  scroll-behavior: smooth;
}
::-webkit-scrollbar {
  display: none;
}
</style>
<!-- {{ action.player.profile.user.first_name }}
                    {{ action.player.profile.user.last_name }}
                    {{ action.target.profile.user.first_name }}
                    {{ action.target.profile.user.last_name }} -->
<!-- <th v-if="action.role">{{ action.role.name }}</th> -->
<!-- <th v-if="action.target">
                  </th> -->
