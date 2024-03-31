import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Client,Databases,ID } from 'appwrite';
import { useToast } from 'vue-toast-notification';
import { useRouter } from 'vue-router'


export const useAppwriteState = defineStore('appwriteState', () => {
    var rooms = ref([])
    var selectedRoom = ref();
    const client = new Client();
    const router = useRouter()

    client.setEndpoint('https://appwrite.moderndata.ir/v1')
    .setProject('6606ffd8542971546a68');
    const toast = useToast();

  const databases = new Databases(client);

  function createRoom(name){
    var promise = databases.createDocument(
        'meet',
        'rooms',
        ID.unique(),
        { "name": name }
    );
    promise.then(function (response) {
        toast.success(`${name} create successfull`);
        getRooms();
    }, function (error) {
        toast.error("Error to creating room.")
    });
  }


  function getRooms(){
    let promise = databases.listDocuments(
        "meet",
        "rooms",
    
    );
    promise.then(function (response) {
        rooms.value = response.documents;
    }, function (error) {
        console.log(error);
    });
  }

  function joinRoom(room){
    // TODO Should pass room id from url
    selectedRoom.value = room
    console.log(router)
    router.push('/room')
  }

  return {
    createRoom,
    getRooms,
    joinRoom,
    selectedRoom,
    rooms }
})