<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeMuteModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h2>Mute {{ member.nickname }}</h2>
    <div class="radioBundle">
      <div>
        <input type="radio" name="0" value="0" v-model="picked" checked />
        <label for="0">unmute</label>
      </div>
      <div>
        <input type="radio" name="5" value="5" v-model="picked" />
        <label for="5">5 min</label>
      </div>
      <div>
        <input type="radio" name="10" value="10" v-model="picked" />
        <label for="10">10 min</label>
      </div>
      <div>
        <input type="radio" name="30" value="30" v-model="picked" />
        <label for="30">30 min</label>
      </div>
      <div>
        <input type="radio" name="60" value="60" v-model="picked" />
        <label for="60">1 h</label>
      </div>
      <div>
        <input type="radio" name="180" value="180" v-model="picked" />
        <label for="180">3 h</label>
      </div>
      <div>
        <input type="radio" name="360" value="360" v-model="picked" />
        <label for="360">6 h</label>
      </div>
    </div>
    <button class="button" @click="mute()">Submit</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { ChannelUser } from "@/types/Channel";
import { ref } from "vue";

const props = defineProps<{
  member: ChannelUser;
}>();

const emits = defineEmits<{
  (e: "closeMuteModal"): void;
}>();

const store = useStore();
let socket = store.socket;

const picked = ref(0);

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const mute = async () => {
  await fetchJSONDatas("api/chat/mute", "POST", {
    id: store.currentChat?.id,
    username: props.member.nickname,
    minutes: +picked.value,
  })
    .then(() => {
      if (+picked.value == 0) addAlertMessage(`${props.member.nickname} has successfully been unmuted`, 1);
      else addAlertMessage(`${props.member.nickname} has successfully been muted`, 1);
      emits("closeMuteModal");
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
