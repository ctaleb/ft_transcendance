<template>
  <div id="chat">
    <ChatMenu :channels="myChannels" :convs="privateConvs" />
    <ChatWindow @update-channels-list="updateChannelsList()" />
  </div>
</template>

<script setup lang="ts">
import ChatMenu from "@/components/chat/ChatMenu.vue";
import ChatWindow from "@/components/chat/ChatWindow.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { Channel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { onMounted, ref, Ref } from "vue";

defineEmits(["updateChannelsList"]);

const privateConvs: Ref<Array<Conversation>> = ref([]);
const myChannels: Ref<Array<Channel>> = ref([]);

const updateChannelsList = () => {
  getMyChannels();
};

onMounted(async () => {
  await getMyChannels();
  await getAllConvs();
});

const getMyChannels = async (): Promise<void> => {
  myChannels.value = await fetchJSONDatas("api/chat", "GET").catch(() => {});
};

const getAllConvs = async (): Promise<void> => {
  privateConvs.value = await fetchJSONDatas("api/privateConv/getAllConvs", "GET").catch(() => {});
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
