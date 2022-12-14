<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeInviteModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h3>Invite to channel</h3>
    <div>
      <input type="text" v-model="nickname" placeholder="name" />
      <button class="button" @click="inviteToChannel">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { ref } from "vue";

const emits = defineEmits<{
  (e: "closeInviteModal"): void;
}>();

const store = useStore();

const nickname = ref("");

const inviteToChannel = async (): Promise<void> => {
  if (nickname.value.length > 0) {
    await fetchJSONDatas("api/chat/invite-to-channel", "POST", {
      channelId: store.currentChat!.id,
      username: nickname.value,
    })
      .then((data) => {
        addAlertMessage("Invitation successfully sent", 2);
        socketLocal.value?.emit("privateChannelInvite", { nickname: data.target, channel: data.channel });
        emits("closeInviteModal");
      })
      .catch(() => {});
  }
  nickname.value = "";
};
</script>
<style lang="scss" scoped>
@import "../../../styles/mixins/sizes";
.modal {
  z-index: 5;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 30%;
  @include screen-lg {
    width: 100vw;
  }
  div {
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    .button {
      width: 20%;
    }
  }
}
</style>
