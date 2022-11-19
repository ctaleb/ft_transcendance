<template>
  <div class="convList">
    <CollapseList title="Conversations" :data="convs" v-slot="{ element }">{{ element }}</CollapseList>
    <CollapseList title="Friends" :data="store.user?.friends" v-slot="{ element }">{{ element }}</CollapseList>
    <CollapseList title="Channels" :data="channels" v-slot="{ element }">{{ element }}</CollapseList>
    <!-- <div class="searchBar">
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
            conv.notif === true ? 'notifPrivateConvButton' : 'privateConvButton'
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
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { Channel, Conversation } from "@/types/Channel";
import { useStore } from "@/store";
import CollapseList from "@/components/Common/CollapseList.vue";

const props = defineProps<{
  current: Channel | Conversation;
  channels: Channel[];
  convs: Conversation[];
}>();

const store = useStore();
</script>
