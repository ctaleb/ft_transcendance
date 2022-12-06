<template>
  <div id="chat">
    <ChatMenu :channels="myChannels" :convs="privateConvs" />
    <ChatWindow @update-channels-list="updateChannelsList()" />

    <div v-if="showInvitationModal" class="overlay">
      <div class="modal">
        <button class="close" @click="closeInvitation()">&times;</button>
        <h2>Invite to channel</h2>
        <div class="searchBar">
          <input type="text" class="searchField" placeholder="Username" v-model="inviteUser" required />
        </div>
        <button class="modalBtn" @click="inviteToChannel()">Submit</button>
      </div>
    </div>
  </div>
  <friend-alert :requester-name="incomingFriendRequest" />
</template>

<script setup lang="ts">
import ChatMenu from "@/components/chat/ChatMenu.vue";
import ChatWindow from "@/components/chat/ChatWindow.vue";
import FriendAlert from "@/components/FriendAlert.vue";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { Channel, ChannelRole, ChannelType, ChannelUser, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Message } from "@/types/Message";
import { User } from "@/types/User";
import { onMounted, onUpdated, ref, Ref, watch } from "vue";

const privateConvs: Ref<Array<Conversation>> = ref([]);
const messagesToDisplay: Ref<Array<Message>> = ref([]);
const messagesBoxRef = ref<HTMLDivElement | null>(null);
let currentConv = ref<Conversation>();
let isLoadMore = false;

defineProps(["incomingFriendRequest"]);
defineEmits(["notification", "updateChannelsList"]);

const myChannels: Ref<Array<Channel>> = ref([]);
const channelMembers: Ref<Array<ChannelUser>> = ref([]);
const channelMessageSkip = ref(0);
const show = ref(0);
const picked = ref("public");
const channelName = ref("");
const channelPassword = ref("");
const showInvitationModal = ref(false);
const inviteUser = ref("");
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const updateChannelsList = () => {
  getMyChannels();
};

onUpdated(() => {
  // if (isLoadMore == false) scrollDownMessages();
  // isLoadMore = false;
});

onMounted(async () => {
  await getMyChannels();
  await getAllConvs();

  // var audio = new Audio(require("../assets/adelsol.mp3"));
  // socket?.on("Message to the client", async (privateMessage: { author: string; text: string }) => {
  //   if (privateMessage.author == friendNickname.value) messagesToDisplay.value.push(privateMessage);
  //   else {
  //     await getAllConvs();
  //     organizeFriends();
  //     notifConv(privateMessage.author);
  //     audio.play();
  //   }
  // });
  // socket?.on("messageReceived", (channelId: number, msg: Message) => {
  //   if (thisChannel.value && channelId === thisChannel.value.id) {
  //     msg.date = moment(msg.date).tz(timezone).add(1, "hours").format("MMMM Do YYYY, h:mm:ss a");
  //     messagesToDisplay.value.push(msg);
  //     channelMessageSkip.value++;
  //   } else {
  //     console.log("incoming message");
  //   }
  // });
  // socket?.on("updateChannelMembers", async (channelId: number) => {
  //   if (thisChannel.value && channelId === thisChannel.value.id) {
  //     let data = await fetchJSONDatas("api/chat/members", "POST", {
  //       id: thisChannel.value.id,
  //     });
  //     channelMembers.value.forEach(await fetchUserAvatarURL);
  //     channelMembers.value = data;
  //   }
  // });
  // socket?.on("Update conv list", (convData: { conv: privateConv }) => {
  //   console.log("UPDATE");
  // });

  // store.$subscribe((mutation, state) => {
  //   if (!state.socket?.hasListeners("Message to the client")) {
  //     state.socket?.on("Message to the client", async (privateMessage: { author: string; text: string }) => {
  //       console.log(1);

  //       if (privateMessage.author == friendNickname.value) messagesToDisplay.value.push(privateMessage);
  //       else {
  //         await getAllConvs();
  //         organizeFriends();
  //         notifConv(privateMessage.author);
  //         audio.play();
  //       }
  //     });
  //   }

  //   if (!state.socket?.hasListeners("Update conv list")) {
  //     state.socket?.on("Update conv list", (convData: { conv: privateConv }) => {
  //       console.log("UPDATE");

  //       let convIndex = privateConvs.value.findIndex((conv) => conv.uuid === convData.conv.uuid);
  //       const convToTop = privateConvs.value.splice(convIndex, 1)[0];
  //       privateConvs.value.splice(0, 0, convToTop);
  //     });
  //   }
  // });
  // if (store.user?.friends) friends.value = JSON.parse(JSON.stringify(store.user?.friends)); what is this
  // organizeFriends();
});

const getMyChannels = async (): Promise<void> => {
  myChannels.value = await fetchJSONDatas("api/chat", "GET").catch(() => {});
};

function initConv(convs: Array<Conversation>) {
  convs.forEach((conv) => {
    conv.notif = false;
  });
}

const loadDefaultPage = () => {
  thisChannel.value = null;
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  show.value = 0;
};

const showInvitation = () => {
  inviteUser.value = "";
  showInvitationModal.value = true;
};

const closeInvitation = () => {
  showInvitationModal.value = false;
};

const createChannel = async (): Promise<void> => {
  if (channelName.value.length <= 0 || (picked.value == "protected" && channelPassword.value.length <= 0)) {
    return;
  }
  let channelType = <ChannelType>picked.value;
  let data: Channel = await fetchJSONDatas("api/chat/create-channel", "POST", {
    name: channelName.value,
    type: channelType,
    password: channelPassword.value,
  });
  myChannels.value.push(data);
  socketLocal.value?.emit("joinChannelRoom", { id: data.id });
  channelCreationForm();
};

const channelCreationForm = () => {
  thisChannel.value = null;
  channelName.value = "";
  channelPassword.value = "";
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  show.value = 3;
};

const updateChannel = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/update-channel", "PUT", {
    id: 22,
    type: "protected",
    password: "password",
  });
};

const joinChannel = async (channel: Channel): Promise<void> => {
  let password = channel.passwordField;
  channel.passwordField = "";

  let data: Channel = await fetchJSONDatas("api/chat/join-channel", "POST", {
    id: channel.id,
    password: password,
  });
  myChannels.value.push(data);
  allChannels.value.splice(allChannels.value.indexOf(channel), 1);
  socketLocal.value?.emit("joinChannelRoom", { id: data.id });
};

const loadAllChannels = () => {
  thisChannel.value = null;
  channelsNum.value = 0;
  allChannels.value = [];
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  getAllChannels();
  show.value = 1;
};

const getAllConvs = async (): Promise<void> => {
  privateConvs.value = await fetchJSONDatas("api/privateConv/getAllConvs", "GET");
  initConv(privateConvs.value);
};

const leaveChannel = async (): Promise<void> => {
  let data: Channel = await fetchJSONDatas("api/chat/leave-channel", "DELETE", {
    id: thisChannel.value!.id,
  });
  myChannels.value = myChannels.value.filter((elem) => elem.id != data.id);
  socketLocal.value?.emit("leaveChannelRoom", { id: data.id });
  loadDefaultPage();
};

const inviteToChannel = async (): Promise<void> => {
  if (inviteUser.value.length > 0) {
    let username = inviteUser.value;
    inviteUser.value = "";
    await fetchJSONDatas("api/chat/invite-to-channel", "POST", {
      channelId: thisChannel.value!.id,
      username: username,
    });
  }
};

const declineChannelInvitation = async (channel: Channel): Promise<void> => {
  await fetchJSONDatas("api/chat/decline-invitation", "DELETE", {
    id: channel.id,
  }).then(() => {
    allChannels.value = allChannels.value.filter((x) => x.id != channel.id);
    if (channelsNum.value > 0) channelsNum.value--;
  });
};

const ban = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/ban", "POST", {
    id: 23,
    username: "Ah Sahm",
    minutes: 1500,
  });
};

// const organizeFriends = () => {
//   for (let i = 0; i < privateConvs.value.length; i++) {
//     for (let j = 0; j < friends.value.length; j++) {
//       if (privateConvs.value[i].user1.nickname == friends.value[j].nickname || privateConvs.value[i].user2.nickname == friends.value[j].nickname)
//         friends.value.splice(j, 1);
//     }
//   }
// };

const scrollDownMessages = () => {
  messagesBoxRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
};

const displayMessages = async (conv: Conversation, event: any): Promise<void> => {
  thisChannel.value = null;
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  conv.user1.nickname == clientNickname ? (friendNickname.value = conv.user2.nickname) : (friendNickname.value = conv.user1.nickname);
  let data: Message[] = await fetchJSONDatas(`api/privateConv/getMessages/${conv.uuid}/${conv.offset}`, "GET");
  //if currentConv == conv, the user clicked on load more, so we just need to append older messages at the beginning of the array
  if (conv == currentConv.value && isLoadMore) messagesToDisplay.value.splice(0, 0, ...data);
  else {
    //Otherwise, the user is changing conversation so we need to replace our array of messages with the new array, and finally set the offset of the previous conv to 0
    messagesToDisplay.value = data;
    if (currentConv.value) currentConv.value.offset = 0;
    currentConv.value = conv;
  }
  show.value = 2;
};

const loadChannel = async (channel: Channel, event: any): Promise<void> => {
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  channelMessageSkip.value = 0;
  channelMembers.value = [];
  thisChannel.value = null;
  show.value = 2;
  let data = await fetchJSONDatas("api/chat/load-channel", "POST", {
    id: channel.id,
  });
  thisChannel.value = channel;
  channelMembers.value = data.members;
  messagesToDisplay.value = data.messages;
  messagesToDisplay.value.forEach((elem) => {
    elem.date = moment(elem.date).tz(timezone).add(1, "hours").format("MMMM Do YYYY, h:mm:ss a");
  });
  channelMessageSkip.value = data.messages.length;
  channelMembers.value.forEach(await fetchUserAvatarURL);
};

const loadChannelMessages = async (channel: Channel): Promise<void> => {
  let data = await fetchJSONDatas("api/chat/messages", "POST", {
    id: channel.id,
    skip: channelMessageSkip.value,
  });
  data.date = moment(data.date).tz(timezone).add(1, "hours").format("MMMM Do YYYY, h:mm:ss a");
  messagesToDisplay.value.push(data);
  channelMessageSkip.value += data.length;
};

const sendChannelMessage = () => {
  if (messageInput.value != "") {
    socketLocal.value?.emit(
      "sendChannelMessage",
      {
        channelId: thisChannel.value!.id,
        content: messageInput.value,
      },
      (response: Message) => {
        if (!response.author) {
          // TODO new notification message
        }
      }
    );
    messageInput.value = "";
  }
};

const sendPrivateMessage = (nickname: string): void => {
  if (messageInput.value != "") {
    socketLocal.value?.emit("deliverMessage", {
      message: messageInput.value,
      friendNickname: nickname,
    });
    messagesToDisplay.value.push({
      author: clientNickname,
      text: messageInput.value,
      date: moment(new Date()).tz(timezone).format("MMMM Do YYYY, h:mm:ss a"),
    });
    messageInput.value = "";
  }
};
</script>

<style lang="scss" scoped>
@import "../styles/svgStyles";
.overlay {
  position: fixed;
  height: 100vh;
  width: 100vw;
  background: rgba(0, 0, 0, 0.5);
}
.modal {
  position: fixed;
  width: 40vw;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
  .close {
    position: absolute;
    top: 0;
    right: 1rem;
    font-size: 2em;
    font-weight: 600;
    color: #c1a36b;
    background: none;
    height: 5%;
    width: 5%;
  }
  .searchBar {
    width: 30vw;
  }
  .modalBtn {
    border: 3px solid;
    border-image-slice: 1;
    border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
    width: auto;
    padding: 0.5em;
  }
}

.leftActionPannel {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: absolute;
  bottom: 0;
  width: inherit;
  height: 3rem;
  button {
    height: 100%;
  }
}
.convList h4 {
  color: white;
}
.conversation {
  float: right;
  background-color: #3b3c44;
  height: 85vh;
  width: 85%;
}
.channelCreationForm {
  background-color: #3b3c44;
  color: white;
  height: 90vh;
  padding-top: 3%;
  * {
    margin: 1% auto;
  }
  .searchBar {
    width: 20%;
  }
  .radioBundle {
    input {
      margin: 1%;
    }
  }
  .joinChannel {
    width: 20%;
  }
}
.upperChat {
  width: 100%;
  height: 100%;
}
.channelInfo {
  position: relative;
  float: right;
  width: 20%;
  height: 100%;
  .channelHeader {
    position: relative;
    text-align: left;
    background-color: #5b5a56;
    border-bottom: 3px solid black;
    h1,
    h3 {
      margin-top: 0;
      padding: 4% 0 0 4%;
      color: white;
    }
  }
  .actionBar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 3rem;
    .convListHeader {
      height: 100%;
    }
  }
}
.messages {
  overflow-y: scroll;
  float: left;
  height: 100%;
  width: 80%;
  padding: 0 5%;

  .friendName {
    color: #fadba2;
    margin-bottom: 0;
    margin-top: 0;
  }
  .clientName {
    color: #85724e;
    margin-bottom: 0;
    margin-top: 0;
  }
  p {
    margin-bottom: 0;
  }

  & > .clientMessage {
    //border: #c1a36b;
    //border-style: solid;
    background-color: #ede4d3;
    margin: 25px 0 25px auto;
    text-align: left;
    color: #453c2c;
    border-radius: 1.125rem 1.125rem 0 1.125rem;
    width: fit-content;
    max-width: 66%;
    overflow-wrap: break-word;
    padding: 10px;
    min-width: 30%;
  }

  & > .friendMessage {
    background-color: #9c8356;
    //border: #c1a36b;
    //border-style: solid;
    color: white;
    margin: 25px auto 25px 0;
    text-align: left;
    border-radius: 1.125rem 1.125rem 1.125rem 0;
    width: fit-content;
    max-width: 66%;
    overflow-wrap: break-word;
    padding: 10px;
    min-width: 30%;
  }
}
.messagesPrivate {
  overflow-y: scroll;
  height: 100%;
  width: 100%;
  padding: 0 5%;

  .friendName {
    color: #fadba2;
    margin-bottom: 0;
    margin-top: 0;
  }
  .clientName {
    color: #85724e;
    margin-bottom: 0;
    margin-top: 0;
  }
  p {
    margin-bottom: 0;
  }

  & > .clientMessage {
    //border: #c1a36b;
    //border-style: solid;
    background-color: #ede4d3;
    margin: 25px 0 25px auto;
    text-align: left;
    color: #453c2c;
    border-radius: 1.125rem 1.125rem 0 1.125rem;
    width: fit-content;
    max-width: 66%;
    overflow-wrap: break-word;
    padding: 10px;
    min-width: 30%;
  }

  & > .friendMessage {
    background-color: #9c8356;
    //border: #c1a36b;
    //border-style: solid;
    color: white;
    margin: 25px auto 25px 0;
    text-align: left;
    border-radius: 1.125rem 1.125rem 1.125rem 0;
    width: fit-content;
    max-width: 66%;
    overflow-wrap: break-word;
    padding: 10px;
    min-width: 30%;
  }
}
.input {
  height: 5vh;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
}
.textInput {
  width: 95%;
  height: 100%;
  border: 0px solid;
  font-size: 21px;
  padding-left: 20px;
}
.sendButton {
  height: 100%;
  background: #aa9e7d;
  width: 5%;
}
.channelButton {
  display: flex;
  align-items: center;
  background: #3b3c44;
  font-size: 25px;
  img {
    height: 40px;
  }
  p {
    padding: 0 8px;
    margin: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.channelMember {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #453800;
  border-bottom: 3px solid black;
  font-size: 25px;
  gap: 1em;
  color: white;
}
.channelMember img {
  height: 40px;
  margin-right: 0.5em;
  pointer-events: none;
}
.channelMember p {
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.textColorRed {
  color: red;
}
.textColorGold {
  color: gold;
}

.lobbyChat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #1e2328;
  color: white;
  height: 90vh;
}
.lobbyChat h4 {
  margin-top: 0;
}
.allChannels {
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 1%;
  gap: 1%;
}
.channel {
  position: relative;
  padding: 5px;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  width: 20%;
  text-align: left;
  h3 {
    margin-bottom: 0;
  }
}
.channelControl {
  display: flex;
  margin-bottom: 1rem;
  gap: 3%;
}
.joinChannel {
  @extend .convListHeader;
}
.textGrey {
  color: grey;
}

.inactiveConv {
  opacity: 0.3;
}
.convListHeader {
  padding: 5px;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

//searchbar ,need to move it in a component

.searchBar {
  position: relative;
  display: flex;
  justify-content: flex-start;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #242218, #c1a36b);
  background: linear-gradient(to bottom, #071018, #151d23);
  font-size: 10px;
  align-items: center;
  .searchField {
    width: 100%;
    border: unset;
    background: inherit;
    font-size: 2em;
    height: auto;
    color: grey;
  }
  .searchField:focus {
    outline: none;
    caret-color: grey;
  }
  .searchIcon {
    position: relative;
    color: grey;
    margin: 1em;
  }
}
</style>
