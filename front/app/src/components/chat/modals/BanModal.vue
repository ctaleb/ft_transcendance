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
        <input type="radio" name="12" value="12" v-model="picked" />
        <label for="12">12 h</label>
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
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { ChannelUser } from "@/types/Channel";
import { ref } from "vue";

const props = defineProps<{
  member: ChannelUser;
}>();

const emits = defineEmits<{
  (e: "closeBanModal"): void;
}>();

const store = useStore();

const picked = ref(0);

const ban = async () => {
  await fetchJSONDatas("api/chat/ban", "POST", {
    id: store.currentChat?.id,
    username: props.member.nickname,
    minutes: +picked.value * 60,
  })
    .then(() => {
      if (+picked.value == 0) {
        socketLocal.value?.emit("memberGotUnbanned", {
          id: store.currentChat?.id,
          nickname: props.member.nickname,
        });
        addAlertMessage(`${props.member.nickname} has successfully been unbanned`, 2);
      } else {
        socketLocal.value?.emit("memberGotBanned", { id: store.currentChat?.id, nickname: props.member.nickname });
        addAlertMessage(`${props.member.nickname} has successfully been banned`, 2);
      }
      emits("closeBanModal");
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
@import "../../../styles/mixins/sizes";
@import "../../../styles/variables";
.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px;
  width: 20%;
  z-index: 6;
  @include screen-lg {
    width: 100vw;
  }
  .radioBundle {
    display: flex;
    flex-direction: column;
    div {
      display: flex;
      align-items: center;
      margin-top: 8px;
      margin-bottom: 8px;
      input {
        margin: 0;
        margin-right: 5px;
      }
    }
  }
  .button {
    margin-top: 15px;
  }
  input[type="radio"] {
    appearance: none;
    background-color: $secondary;
    font: inherit;
    color: currentColor;
    width: 1.15em;
    height: 1.15em;
    border: 0.09em solid currentColor;
    border-radius: 50%;
    &:checked {
      background-color: $primary;
    }
  }
}
</style>
