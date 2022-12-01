<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeChannelModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h1>Update channel</h1>
    <div>Channel Name: {{ channel.name }}</div>
    <div>Channel type: {{ picked }}</div>
    <div class="radioBundle">
      <input type="radio" id="one" name="public" value="public" v-model="picked" checked />
      <label for="public">public</label>

      <input type="radio" id="two" name="protected" value="protected" v-model="picked" />
      <label for="protected">protected</label>

      <input type="radio" id="three" name="private" value="private" v-model="picked" />
      <label for="private">private</label>
    </div>
    <div v-if="picked === 'protected'">
      <label for="channelPassword">Password:</label>
      <div class="searchBar">
        <input type="password" class="searchField" name="channelPassword" placeholder="Password" v-model="channelPassword" required />
      </div>
    </div>
    <button @click="createChannel">Update channel</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { ref } from "vue";

const props = defineProps<{
  channel: Channel;
}>();
const emits = defineEmits(["closeChannelModal", "createNewChannel"]);

const store = useStore();
let socket = store.socket;

const picked = ref("public");
const channelPassword = ref("");

const createChannel = async (): Promise<void> => {
  if (picked.value === "protected" && channelPassword.value.length <= 0) {
    return;
  }
  const channelType = <ChannelType>picked.value;
  await fetchJSONDatas("api/chat/create-channel", "POST", {
    name: channelName.value,
    type: channelType,
    password: channelPassword.value,
  })
    .then((data: Channel) => {
      emits("createNewChannel", data);
      socket?.emit("joinChannelRoom", { id: data.id });
      addAlertMessage("Channel successfully created", 1);
      emits("closeChannelModal");
    })
    .catch(() => {});
};

store.$subscribe((mutation, state) => {
  socket = state.socket;
});
</script>
