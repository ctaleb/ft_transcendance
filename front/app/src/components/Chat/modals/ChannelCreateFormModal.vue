<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeChannelModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h1>Creating a new chat channel</h1>
    <input v-model="channelName" type="text" id="username" placeholder="Channel name" maxlength="15" />
    <div class="radioBundle">
      <div>
        <input type="radio" id="one" name="public" value="public" v-model="picked" checked />
        <label for="public">public</label>
      </div>
      <div>
        <input type="radio" id="two" name="protected" value="protected" v-model="picked" />
        <label for="protected">protected</label>
      </div>
      <div>
        <input type="radio" id="three" name="private" value="private" v-model="picked" />
        <label for="private">private</label>
      </div>
    </div>
    <div v-if="picked === 'protected'" class="protectedChan">
      <input type="password" class="channelPassword" name="channelPassword" placeholder="Password" v-model="channelPassword" required />
    </div>
    <button class="button" @click="createChannel">Create channel</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { ref } from "vue";

const emits = defineEmits(["closeChannelModal", "createNewChannel"]);

const store = useStore();

const channelName = ref("");
const picked = ref("public");
const channelPassword = ref("");

const createChannel = async (): Promise<void> => {
  if (channelName.value.length <= 0 || (picked.value === "protected" && channelPassword.value.length <= 0)) {
    return;
  }
  channelName.value = channelName.value.trim();
  const channelType = <ChannelType>picked.value;
  await fetchJSONDatas("api/chat/create-channel", "POST", {
    name: channelName.value,
    type: channelType,
    password: channelPassword.value,
  })
    .then((data: Channel) => {
      emits("createNewChannel", data);
      socketLocal.value?.emit("joinChannelRoom", { id: data.id });
      addAlertMessage("Channel successfully created", 2);
      emits("closeChannelModal");
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
@import "../../../styles/mixins/sizes";
.modal {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  z-index: 5;
  padding: 2rem;
  div {
    display: flex;
    align-items: center;
    input {
      margin-right: 11px;
    }
  }
  @include screen-lg {
    width: 100vw;
  }
  .radioBundle {
    width: 70%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 25px;
    margin-bottom: 10px;
    @include screen-md {
      flex-direction: column;
      align-items: flex-start;
      div {
        margin-bottom: 10px;
      }
    }
  }

  .button {
    margin-top: 20px;
  }
  .protectedChan {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>
