const axios = require('axios');

let godfatherSecretKey = "ds54fs56d4fx53dfxd";
let baseUrl = "https://godfathergame.ir/api/v1/games"

module.exports.joinPlayer = function(token,roomCode,action){
    axios.post(`${baseUrl}/join?secret=${godfatherSecretKey}`,{
        "token":token,"room_code":roomCode,"action":action
    }).then((response)=>{
        return response.data
    }).catch((error)=>{
        if (error.response){
            return error.response.data
        }

    })
}
