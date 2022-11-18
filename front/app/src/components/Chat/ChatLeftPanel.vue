<template>
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
    <button class="convListHeader" @click="changeConvListStatus">
      Private messages <i :class="iconConvList"></i>
    </button>
    <button
      v-for="conv in privateConvs"
      class="channelButton privateMsg"
      @click="displayMessages(conv, $event)"
      v-bind:key="conv.uuid"
    >
      <img :src="conv.avatarToDisplay" alt="" width="45" height="45" />
      <p v-if="conv.user1.nickname != clientNickname">
        {{ conv.user1.nickname }}
      </p>
      <p v-else>{{ conv.user2.nickname }}</p>
    </button>

    <button class="convListHeader" @click="changeFriendListStatus">
      Friends <i :class="iconFriendList"></i>
    </button>
    <button
      v-for="friend in friends"
      class="channelButton friendMsg"
      @click="createConv(friend, $event)"
      v-bind:key="friend.nickname"
    >
      <img :src="friend.avatarToDisplay" alt="" width="45" height="45" />
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
</template>

<script setup lang="ts">
function changeConvListStatus() {
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
}

function displayMessages(conv: privateConv, event: any) {
  thisChannel.value = null;
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  conv.user1.nickname == clientNickname
    ? (friendNickname.value = conv.user2.nickname)
    : (friendNickname.value = conv.user1.nickname);
  fetchJSONDatas(`api/privateConv/getMessages/${conv.uuid}`, "GET").then(
    (data) => {
      messagesToDisplay.value = data;
    }
  );
  show.value = 2;
}

function changeFriendListStatus() {
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
}

function changeChannelListStatus() {
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
}

function createConv(friend: user, event: any) {
  friendNickname.value = friend.nickname;
  fetchJSONDatas(`api/privateConv/createConv/${friend.nickname}`, "GET").then(
    async (data) => {
      data.conv.avatarToDisplay = await funcs
        .getUserAvatar(friend.path)
        .then((data: any) => {
          return URL.createObjectURL(data);
        });
      if (data.created == true) {
        privateConvs.value.push(data.conv);
        organizeFriends();
      }
      displayMessages(data.conv, event);
    }
  );
}

function loadChannel(channel: Channel, event: any) {
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  channelMessageSkip.value = 0;
  channelMembers.value = [];
  thisChannel.value = null;
  show.value = 2;
  fetchJSONDatas("api/chat/load-channel", "POST", { id: channel.id }).then(
    (data) => {
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
      channelMembers.value.forEach(async (member) => {
        member.avatarToDisplay = await funcs
          .getUserAvatar(member.path)
          .then((image: any) => {
            return URL.createObjectURL(image);
          });
      });
    }
  );
}

function loadChannelMessages(channel: Channel) {
  fetchJSONDatas("api/chat/messages", "POST", {
    id: channel.id,
    skip: channelMessageSkip.value,
  }).then((data) => {
    data.date = moment(data.date)
      .tz(timezone)
      .add(1, "hours")
      .format("MMMM Do YYYY, h:mm:ss a");
    messagesToDisplay.value.push(data);
    channelMessageSkip.value += data.length;
  });
}

function channelCreationForm() {
  thisChannel.value = null;
  channelsNum.value = 0;
  channelName.value = "";
  channelPassword.value = "";
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  show.value = 3;
}

function loadAllChannels() {
  thisChannel.value = null;
  channelsNum.value = 0;
  allChannels.value = [];
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  getAllChannels();
  show.value = 1;
}
</script>
