<template>
  <div class="modal">
    <span @click="$emit('closeBanModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h2>Ban {{ member.nickname }}</h2>
    <div class="radioBundle">
      <div>
        <input type="radio" name="0" value="0" v-model="picked" checked />
        <label for="0">unban</label>
      </div>
      <div>
        <input type="radio" name="0.05" value="0.05" v-model="picked" />
        <label for="0.05">some min</label>
      </div>
      <div>
        <input type="radio" name="24" value="24" v-model="picked" />
        <label for="24">24 h</label>
      </div>
      <div>
        <input type="radio" name="72" value="72" v-model="picked" />
        <label for="72">3 days</label>
      </div>
      <div>
        <input type="radio" name="168" value="168" v-model="picked" />
        <label for="168">1 week</label>
      </div>
      <div>
        <input type="radio" name="720" value="720" v-model="picked" />
        <label for="720">1 month</label>
      </div>
      <div>
        <input type="radio" name="2160" value="2160" v-model="picked" />
        <label for="2160">3 month</label>
      </div>
      <div>
        <input type="radio" name="4320" value="4320" v-model="picked" />
        <label for="4320">6 month</label>
      </div>
    </div>
    <button class="button" @click="ban()">Submit</button>
  </div>
</template>

<script setup lang="ts">
import ChannelInModal from "@/components/chat/modals/ChannelInModal.vue";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelUser } from "@/types/Channel";
import { memberExpression, numberLiteralTypeAnnotation } from "@babel/types";
import { onMounted, ref, Ref } from "vue";

const props = defineProps<{
  member: ChannelUser;
}>();

const emits = defineEmits<{
  (e: "closeBanModal"): void;
}>();

const store = useStore();
let socket = store.socket;

const picked = ref(0);

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const ban = async () => {
  await fetchJSONDatas("api/chat/ban", "POST", {
    id: store.currentChat?.id,
    username: props.member.nickname,
    minutes: +picked.value * 60,
  })
    .then(() => {
      if (+picked.value == 0) {
        socket?.emit("memberGotUnbanned", { id: store.currentChat?.id, channel: (<Channel>store.currentChat)?.name, nickname: props.member.nickname });
        addAlertMessage(`${props.member.nickname} has successfully been unbanned`, 1);
      } else {
        socket?.emit("memberGotBanned", { id: store.currentChat?.id, channel: (<Channel>store.currentChat)?.name, nickname: props.member.nickname });
        addAlertMessage(`${props.member.nickname} has successfully been banned`, 1);
      }
      emits("closeBanModal");
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px;
  width: 20%;
  .radioBundle {
    display: flex;
    flex-direction: column;
    div {
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
  .button {
    margin-top: 15px;
  }
}
</style>
