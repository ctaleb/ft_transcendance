<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeInviteModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h3>Invite to channel</h3>
    <input type="text" v-model="nickname" placeholder="name" />
    <button @click="inviteToChannel">Send</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { ref } from "vue";

const emits = defineEmits<{
  (e: "closeInviteModal"): void;
}>();

const store = useStore();
let socket = store.socket;

const nickname = ref("");

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const inviteToChannel = async (): Promise<void> => {
  if (nickname.value.length > 0) {
    await fetchJSONDatas("api/chat/invite-to-channel", "POST", {
      channelId: store.currentChat!.id,
      username: nickname.value,
    })
      .then((data) => {
        addAlertMessage("Invitation successfully sent", 1);
        console.log(data);
        socket?.emit("privateChannelInvite", { nickname: data.target, channel: data.channel });
        emits("closeInviteModal");
      })
      .catch(() => {});
  }
  nickname.value = "";
};
</script>
