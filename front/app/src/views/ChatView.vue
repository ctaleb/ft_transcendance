<template>
  <div class="mainContainer">
    <div class="convList">
      <div class="searchBar">
        <div class="searchIcon"><i class="gg-search"></i></div>
        <input
          type="text"
          class="searchField"
          name="searchFriend"
          placeholder="Player name"
        />
      </div>
      <button class="privateMessagesHeader" @click="changeConvListStatus">
        Private messages <i :class="iconConvList"></i>
      </button>
      <template v-for="conv in privateConvs" v-bind:key="conv.uuid">
        <div class="fullPrivateConvButton">
          <button
            @click="displayMessages(conv, $event)"
            :class="
              conv.notif === true
                ? 'notifPrivateConvButton'
                : 'privateConvButton'
            "
          >
            <img
              :src="conv.avatarToDisplay"
              alt=""
              width="45"
              height="45"
              class="avatar"
            />
            <p v-if="conv.user1.nickname != clientNickname">
              {{ conv.user1.nickname }}
            </p>
            <p v-else>{{ conv.user2.nickname }}</p>
          </button>
          <div
            v-if="currentConv && currentConv.uuid == conv.uuid"
            class="socialOptions"
          >
            <button @click="spectateGame()"><i class="gg-eye"></i></button>
            <button @click="goToProfile()"><i class="gg-profile"></i></button>
          </div>
        </div>
      </template>
      <button class="convListHeader" @click="changeFriendListStatus">
        Friends <i :class="iconFriendList"></i>
      </button>
      <button
        v-for="friend in friends"
        class="channelButton friendMsg"
        @click="createConv(friend, $event)"
        v-bind:key="friend.nickname"
      >
        <img :src="friend.image" alt="" />
        <p>{{ friend.nickname }}</p>
      </button>

      <button class="convListHeader" @click="changeChannelListStatus">
        Channels <i :class="iconChannelList"></i>
      </button>
      <button
        v-for="channel in myChannels"
        class="channelButton channelMsg"
        @click="loadChannel(channel, $event)"
        v-bind:key="channel.id"
      >
        <p>{{ channel.name }}</p>
      </button>
      <div class="leftActionPannel">
        <button class="convListHeader" @click="channelCreationForm()">
          Create channel
        </button>
        <button class="convListHeader" @click="loadAllChannels()">
          Display all channels
        </button>
      </div>
    </div>
    <div v-if="show == 0" class="lobbyChat">
      <h2>Welcome on the chat</h2>
      <br />
      <h4>Chat with your friends with the contact list to the left</h4>
    </div>
    <div v-if="show == 1" class="lobbyChat allChannels">
      <template v-for="channel in allChannels">
        <div class="channel">
          <h5 v-if="channel.type == ChannelType.PRIVATE">Channel invitation</h5>
          <h3>{{ channel.name }}</h3>
          <h5 class="textGrey">{{ channel.type }}</h5>
          <div class="channelControl">
            <div v-if="channel.type == ChannelType.PROTECTED" class="searchBar">
              <input
                type="password"
                placeholder="password"
                class="searchField"
                v-model="channel.passwordField"
              />
            </div>
            <button
              v-if="channel.type == ChannelType.PRIVATE"
              class="joinChannel"
              @click="joinChannel(channel)"
            >
              Accept
            </button>
            <button v-else class="joinChannel" @click="joinChannel(channel)">
              Join
            </button>
            <button
              v-if="channel.type == ChannelType.PRIVATE"
              class="joinChannel"
              @click="declineChannelInvitation(channel)"
            >
              Decline
            </button>
          </div>
        </div>
      </template>
    </div>
    <div v-if="show == 2" class="conversation">
      <div class="upperChat">
        <div
          :class="{
            messagesPrivate: thisChannel == null,
            messages: thisChannel != null,
          }"
        >
          <button class="loadMoreButton" @click="loadMoreMessages($event)">
            Load more
          </button>
          <template v-for="message in messagesToDisplay">
            <div
              v-if="message.author == clientNickname"
              class="clientMessage"
              v-bind:key="message.text"
            >
              <h4 class="clientName">
                {{ message.author }}
              </h4>
              <p>{{ message.text }}</p>
              <p>{{ message.date }}</p>
            </div>
            <div v-else class="friendMessage" v-bind:key="message.text">
              <h4 class="friendName">
                {{ message.author }}
              </h4>
              <p>{{ message.text }}</p>
              <p>{{ message.date }}</p>
            </div>
          </template>
          <div ref="messagesBoxRef"></div>
        </div>
        <div v-if="thisChannel != null" class="channelInfo">
          <div class="channelHeader">
            <h1>{{ thisChannel.name }}</h1>
            <h3>{{ thisChannel.type }}</h3>
          </div>
          <div v-for="member in channelMembers" class="channelMember">
            <img :src="member.image" alt="" />
            <p
              :class="{
                textColorRed: member.role == ChannelRole.OWNER,
                textColorGold: member.role == ChannelRole.ADMIN,
              }"
            >
              {{ member.nickname }}
            </p>
          </div>
          <div class="actionBar">
            <button @click="leaveChannel()" class="convListHeader">
              Leave channel
            </button>
            <button
              v-if="thisChannel.type == ChannelType.PRIVATE"
              @click="showInvitation()"
              class="convListHeader"
            >
              Invite
            </button>
          </div>
        </div>
      </div>
      <div class="input">
        <input
          type="text"
          placeholder="Send message"
          class="textInput"
          v-model="messageInput"
        />
        <button
          v-if="thisChannel == null"
          class="sendButton"
          @click="sendPrivateMessage(friendNickname)"
        >
          <i class="gg-slack"></i>
        </button>
        <button v-else class="sendButton" @click="sendChannelMessage()">
          <i class="gg-slack"></i>
        </button>
      </div>
    </div>
    <div v-if="show == 3" class="channelCreationForm">
      <h2>Create channel</h2>
      <label for="channelName">Channel name:</label>
      <div class="searchBar">
        <input
          type="text"
          class="searchField"
          name="channelName"
          placeholder="Channel name"
          v-model="channelName"
          required
        />
      </div>
      <div>Channel type: {{ picked }}</div>

      <div class="radioBundle">
        <input
          type="radio"
          id="one"
          name="public"
          value="public"
          v-model="picked"
          checked
        />
        <label for="public">public</label>

        <input
          type="radio"
          id="two"
          name="protected"
          value="protected"
          v-model="picked"
        />
        <label for="protected">protected</label>

        <input
          type="radio"
          id="three"
          name="private"
          value="private"
          v-model="picked"
        />
        <label for="private">private</label>
      </div>
      <div v-if="picked == 'protected'">
        <label for="channelPassword">Password:</label>
        <div class="searchBar">
          <input
            type="password"
            class="searchField"
            name="channelPassword"
            placeholder="Password"
            v-model="channelPassword"
            required
          />
        </div>
      </div>
      <button @click="createChannel()" class="joinChannel">Submit</button>
    </div>
    <div v-if="showInvitationModal" class="overlay">
      <div class="modal">
        <button class="close" @click="closeInvitation()">&times;</button>
        <h2>Invite to channel</h2>
        <div class="searchBar">
          <input
            type="text"
            class="searchField"
            placeholder="Username"
            v-model="inviteUser"
            required
          />
        </div>
        <button class="modalBtn" @click="inviteToChannel()">Submit</button>
      </div>
    </div>
  </div>
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<script setup lang="ts">
import { onMounted, onUpdated, ref, Ref } from "vue";
import FriendAlert from "@/components/FriendAlert.vue";
import config from "@/config/config";
import {
  Channel,
  ChannelRole,
  ChannelType,
  ChannelUser,
} from "@/types/Channel";
import { fetchJSONDatas } from "@/functions/funcs";
import { getUserAvatar, User } from "@/types/User";
import { useStore } from "@/store";
import { Private } from "@babel/types";

export interface privateConv {
  user1: User;
  user2: User;
  avatarToDisplay: string;
  uuid: string;
  offset: number;
  notif: boolean;
}
export interface message {
  text: string;
  author: string;
}

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

let funcs = require("../functions/funcs");
const moment = require("moment-timezone");
const clientNickname = JSON.parse(
  localStorage.getItem("user") || "{}"
).nickname;
const friendNickname = ref("");
const imageUrl = ref("");
const messageInput = ref("");
const privateConvs = ref(Array<PrivateConv>());
const messagesToDisplay: Ref<Array<Message>> = ref([]);
const messagesBoxRef = ref<HTMLDivElement | null>(null);
const convListFlag = ref(true);
const friendListFlag = ref(true);
const channelListFlag = ref(true);
const iconConvList = ref("gg-remove");
const iconFriendList = ref("gg-remove");
const iconChannelList = ref("gg-remove");
const friends = ref(Array<User>());
let currentConv = ref<privateConv>();
let isLoadMore = false;

const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);
const messageText = ref("");
const joined = ref(false);

const myChannels: Ref<Array<Channel>> = ref([]);
const allChannels: Ref<Array<Channel>> = ref([]);
const thisChannel = ref<Channel | null>(null);
const channelMembers: Ref<Array<ChannelUser>> = ref([]);
const channelMessageSkip = ref(0);
const channelsNum = ref(0);
const show = ref(0);
const picked = ref("public");
const channelName = ref("");
const channelPassword = ref("");
const showInvitationModal = ref(false);
const inviteUser = ref("");
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

onUpdated(() => {
  if (isLoadMore == false) scrollDownMessages();
  isLoadMore = false;
});

onMounted(async () => {
  getChannels();
  var audio = new Audio(require("../assets/adelsol.mp3"));
  socket?.on(
    "Message to the client",
    async (privateMessage: { author: string; text: string }) => {
      if (privateMessage.author == friendNickname.value)
        messagesToDisplay.value.push(privateMessage);
      else {
        await getAllConvs();
        organizeFriends();
        notifConv(privateMessage.author);
        audio.play();
      }
    }
  );
  socket?.on("messageReceived", (channelId: number, msg: Message) => {
    if (thisChannel.value && channelId === thisChannel.value.id) {
      msg.date = moment(msg.date)
        .tz(timezone)
        .add(1, "hours")
        .format("MMMM Do YYYY, h:mm:ss a");
      messagesToDisplay.value.push(msg);
      channelMessageSkip.value++;
    } else {
      console.log("incoming message");
    }
  });
  socket?.on("updateChannelMembers", async (channelId: number) => {
    if (thisChannel.value && channelId === thisChannel.value.id) {
      let data = await fetchJSONDatas("api/chat/members", "POST", {
        id: thisChannel.value.id,
      });
      channelMembers.value.forEach(await fetchUserAvatarURL);
      channelMembers.value = data;
    }
  });
  socket?.on("Update conv list", (convData: { conv: privateConv }) => {
    console.log("UPDATE");

    let convIndex = privateConvs.value.findIndex(
      (conv) => conv.uuid === convData.conv.uuid
    );
    const convToTop = privateConvs.value.splice(convIndex, 1)[0];
    privateConvs.value.splice(0, 0, convToTop);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (thisChannel.value == null) sendPrivateMessage(friendNickname.value);
      else sendChannelMessage();
    }
  });
  await getAllConvs();
  if (store.user?.friends)
    friends.value = JSON.parse(JSON.stringify(store.user?.friends));
  organizeFriends();
});

function getConvAvatar(conv: privateConv) {
  if (clientNickname == conv.user1.nickname)
    return `http://${window.location.hostname}:3000${conv.user2.avatar}`;
  else return `http://${window.location.hostname}:3000${conv.user1.avatar}`;
}
function getFriendAvatar(friend: User) {
  return `http://${window.location.hostname}:3000${friend.avatar}`;
}

function initConv(convs: Array<privateConv>) {
  convs.forEach((conv) => {
    conv.offset = 0;
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

const getChannels = async (): Promise<void> => {
  let data: Channel[] = await fetchJSONDatas("api/chat", "GET");
  myChannels.value = data;
};

const createChannel = async (): Promise<void> => {
  if (
    channelName.value.length <= 0 ||
    (picked.value == "protected" && channelPassword.value.length <= 0)
  ) {
    return;
  }
  let channelType = <ChannelType>picked.value;
  let data: Channel = await fetchJSONDatas("api/chat/create-channel", "POST", {
    name: channelName.value,
    type: channelType,
    password: channelPassword.value,
  });
  myChannels.value.push(data);
  socket?.emit("joinChannelRoom", { id: data.id });
  channelCreationForm();
};

const channelCreationForm = () => {
  thisChannel.value = null;
  channelsNum.value = 0;
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
  channelsNum.value--;
  socket.emit("joinChannelRoom", { id: data.id });
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

const getAllChannels = async (): Promise<void> => {
  let data: Channel[] = await fetchJSONDatas("api/chat/list", "POST", {
    skip: channelsNum.value,
  });
  // TODO Check
  allChannels.value.push(...data);
  // allChannels.value = [...allChannels.value, ...data];
  channelsNum.value += data.length;
};

const getAllConvs = async (): Promise<void> => {
  let data: PrivateConv[] = await fetchJSONDatas(
    "api/privateConv/getAllConvs",
    "GET"
  );
  privateConvs.value = data;
  privateConvs.value.forEach(async (conv) => {
    conv.avatarToDisplay = getConvAvatar(conv);
  });
  initConv(privateConvs.value);
};

const leaveChannel = async (): Promise<void> => {
  let data: Channel = await fetchJSONDatas("api/chat/leave-channel", "DELETE", {
    id: thisChannel.value!.id,
  });
  myChannels.value = myChannels.value.filter((elem) => elem.id != data.id);
  socket.emit("leaveChannelRoom", { id: data.id });
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

const giveAdmin = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/give-admin", "PUT", {
    id: 22,
    username: "Ah Sahm",
  });
};

const takeAdmin = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/take-admin", "PUT", {
    id: 22,
    username: "Ah Sahm",
  });
};

const ban = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/ban", "POST", {
    id: 23,
    username: "Ah Sahm",
    minutes: 1500,
  });
};

const organizeFriends = () => {
  for (let i = 0; i < privateConvs.value.length; i++) {
    for (let j = 0; j < friends.value.length; j++) {
      if (
        privateConvs.value[i].user1.nickname == friends.value[j].nickname ||
        privateConvs.value[i].user2.nickname == friends.value[j].nickname
      )
        friends.value.splice(j, 1);
    }
  }
};

const scrollDownMessages = () => {
  messagesBoxRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
};

const displayMessages = async (
  conv: PrivateConv,
  event: any
): Promise<void> => {
  thisChannel.value = null;
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  conv.user1.nickname == clientNickname
    ? (friendNickname.value = conv.user2.nickname)
    : (friendNickname.value = conv.user1.nickname);
  let data: Message[] = await fetchJSONDatas(
    `api/privateConv/getMessages/${conv.uuid}/${conv.offset}`,
    "GET"
  );
  //if currentConv == conv, the user clicked on load more, so we just need to append older messages at the beginning of the array
  if (conv == currentConv.value && isLoadMore)
    messagesToDisplay.value.splice(0, 0, ...data);
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
    elem.date = moment(elem.date)
      .tz(timezone)
      .add(1, "hours")
      .format("MMMM Do YYYY, h:mm:ss a");
  });
  channelMessageSkip.value = data.messages.length;
  channelMembers.value.forEach(await fetchUserAvatarURL);
};

const loadChannelMessages = async (channel: Channel): Promise<void> => {
  let data = await fetchJSONDatas("api/chat/messages", "POST", {
    id: channel.id,
    skip: channelMessageSkip.value,
  });
  data.date = moment(data.date)
    .tz(timezone)
    .add(1, "hours")
    .format("MMMM Do YYYY, h:mm:ss a");
  messagesToDisplay.value.push(data);
  channelMessageSkip.value += data.length;
};

const createConv = async (friend: ChannelUser, event: any): Promise<void> => {
  friendNickname.value = friend.nickname;
  let data = await fetchJSONDatas(
    `api/privateConv/createConv/${friend.nickname}`,
    "GET"
  );
  await fetchUserAvatarURL(friend);
  if (data.created == true) {
    privateConvs.value.push(data.conv);
    organizeFriends();
  }
  displayMessages(data.conv, event);
};

const sendChannelMessage = () => {
  if (messageInput.value != "") {
    socket.emit(
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
    socket.emit("deliverMessage", {
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

const changeConvListStatus = () => {
  if (convListFlag.value == true) {
    const el = document.querySelectorAll(".privateMsg");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconConvList.value = "gg-add";
    convListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".privateMsg");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    convListFlag.value = true;
    iconConvList.value = "gg-remove";
  }
};

const changeFriendListStatus = () => {
  if (friendListFlag.value == true) {
    const el = document.querySelectorAll(".friendMsg");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconFriendList.value = "gg-add";
    friendListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".friendMsg");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    friendListFlag.value = true;
    iconFriendList.value = "gg-remove";
  }
};

const changeChannelListStatus = () => {
  if (channelListFlag.value == true) {
    const el = document.querySelectorAll(".channelMsg");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconChannelList.value = "gg-add";
    channelListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".channelMsg");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    channelListFlag.value = true;
    iconChannelList.value = "gg-remove";
  }
};

const deleteConv = (conv: PrivateConv) => {
  console.log("Oye brav gens");
};
</script>

<style lang="scss" scoped>
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
.convList {
  height: 90vh;
  width: 15%;
  float: left;
  background-color: #5b5a56;
  overflow-y: scroll;
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
