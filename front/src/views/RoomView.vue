<script setup>
import {ref, onMounted} from "vue";
import {useAppwriteState} from "../stores/appwriteState";
import WebrtcComponent from "@/components/WebrtcComponent.vue";

let uistate = ref({
  mobileMenu: false
});

var state = useAppwriteState();
var players = ref([]);
let smaple = [

  [
    {
      message:
        "سلام تیم خیلی خوبی داریم بنظرم شماره 4 رو با رای بدیم بیرون فردا یکی از مافیا ها رو هم میدیم بیرون که سفید بشیم",
      number: "8",
      role: "ماتادور",
      name: "رضا"
    },
    {
      message: "نه بابا 4 که منم شماره 3 رو بدیم بره",
      number: "6",
      role: "'پدرخوانده'",
      name: "محمد"
    },
    {
      message:
        "سلام تیم خیلی خوبی داریم بنظرم شماره 4 رو با رای بدیم بیرون فردا یکی از مافیا ها رو هم میدیم بیرون که سفید بشیم",
      number: "8",
      role: "ماتادور",
      name: "امیرعلی"
    },
    {
      message: "نه بابا 4 که منم شماره 3 رو بدیم بره",
      number: "6",
      role: "'پدرخوانده'",
      name: "محمد"
    }
  ]
];
onMounted(() => {
  setInterval(() => {
    if (window.innerWidth > 768) {
      uistate.value.mobileMenu = true;
    } else {
    }
  });
});

function updatePlayers(data){
  players.value = data
}
</script>
<template>

  <div
    class="text-[white] bg-[#2E2E2E] h-[100vh] relative flex flex-col md:flex-row"
  >
    <!-- menu for mobile -->
    <div
      v-if="uistate.mobileMenu"
      class="w-[100%] z-30 absolute h-[100vh] flex flex-col bg-[#2E2E2E] md:relative md:w-[39%] md:border-l-[1px]"
    >
      <div class="h-[47%] border-b-[1px]">
        <div class="flex-center text-[18px] mb-1">
          گفتگو با تیم مافیا

          <img
            src="/xmark.svg"
            alt=""
            class="absolute left-2 top-1 w-[25px] md:hidden"
            @click="uistate.mobileMenu = !uistate.mobileMenu"
          />
        </div>
        <div
          class="h-[73%] flex flex-col items-start max-w-[100%] overflow-y-auto pl-[12%]"
        >
          <div class="flex m-1 mr-0 w-[85%]" v-for="item in smaple[1]">
            <div
              class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] min-w-[30px] max-h-[32px] py-[1px] rounded-full flex-center ml-1"
            >
              {{ item.number }}
            </div>
            <div
              class="bg-[#252525] min-h-[75px] p-2 [box-shadow:0px_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md w-[100%]"
            >
              <div class="flex items-end">
                <p class="ml-1 text-[#D9D9D9]">{{ item.name }}</p>
                <p class="text-[#B51818] text-[10px]">{{ item.role }}</p>
              </div>
              <p class="text-[11px]">{{ item.message }}</p>
            </div>
          </div>
        </div>
        <div class="h-[17.5%] flex">
          <input
            type="text"
            class="bg-[#252525] p-[14px] w-[86%]"
            style="border-radius: 16px 16px 0 0"
            placeholder="اینجا بنویسید"
          />
          <button
            class="[box-shadow:0px_4px_4px_0px_rgba(192,0,0,0.25)] bg-[#252525] w-[45px] h-[45px] rounded-full flex-center m-auto"
          >
            <img src="/send.svg" class="w-[23px]" alt="" />
          </button>
        </div>
      </div>
      <div class="h-[53%] pt-3">
        <div class="relative flex-center mb-2">
          <p class="text-[24px]">اکشن پنل</p>
          <button
            class="absolute top-1 px-8 rounded-md left-3 bg-[#217C0B] text-[20px] py-[2px]"
          >
            ثبت
          </button>
        </div>
        <p class="mr-2 text-[22px] mb-1">تارگت خود را انتخاب کنید</p>
        <div class="flex flex-wrap w-[80%] justify-between">
          <label
            v-for="item in players"
            class="my-[1px] text-[24px] container2 w-[45%]"
          >
            <input type="checkbox" />

            <span class="checkmark"></span>
            <p>{{ item.profile.user.first_name }} {{ item.profile.user.last_name }}</p>
          </label>
        </div>
      </div>
    </div>
    <!-- menu for mobile -->
    <div
      class="flex items-start h-[60px] w-[100%] justify-between py-2 px-3 md:flex-row-reverse md:absolute right-[39%] z-20 md:w-[250px]"
    >
      <img
        class="md:hidden"
        src="/menu.svg"
        alt=""
        @click="uistate.mobileMenu = !uistate.mobileMenu"
      />
      <img
        src="/logo.png"
        alt=""
        class="w-[100px] bottom-[22px] relative md:min-w-[145px] md:bottom-[30px]"
      />
      <button
        class="bg-[#B51818] px-6 h-[32px] rounded-xl text-[18px] [box-shadow:0px_4px_4px_0px_rgba(0,0,0,0.1)]"
      >
        <p class="relative bottom-1">خروج</p>
      </button>
    </div>
    <div class="md:w-[61%]">
      <WebrtcComponent
        width="150"
        height="150"
        @update_players="updatePlayers"
        :room-id="$route.params.room_id"
        :token="$route.params.token"
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
}
</style>
