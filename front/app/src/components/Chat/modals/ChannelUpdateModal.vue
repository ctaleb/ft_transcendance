<template>
  <div class="overlay"></div>
  <div class="modal">
    <span @click="$emit('closeChannelModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h3>{{ channel.name }} - {{ picked }} channel</h3>
    <div class="radioBundle">
      <input type="radio" id="one" name="public" value="public" v-model="picked" />
      <label for="public">public</label>

      <input type="radio" id="two" name="protected" value="protected" v-model="picked" />
      <label for="protected">protected</label>

      <input type="radio" id="three" name="private" value="private" v-model="picked" />
      <label for="private">private</label>
    </div>
    <div v-if="picked === 'protected'" class="searchBar">
      <input type="password" class="searchField" name="channelPassword" placeholder="Password" v-model="channelPassword" required />
    </div>
    <button class="button" @click="updateChannel">Update channel</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType, ChannelUser } from "@/types/Channel";
import { onMounted, Ref, ref } from "vue";

const props = defineProps<{
  channel: Channel;
}>();

const emits = defineEmits(["closeChannelModal", "updateChannel"]);

const store = useStore();

const picked = ref("public");
const channelPassword = ref("");

const updateChannel = async (): Promise<void> => {
  if (picked.value === "protected" && channelPassword.value.length <= 0) {
    return;
  }
  const channelType = <ChannelType>picked.value;
  await fetchJSONDatas("api/chat/update-channel", "PUT", {
    id: props.channel.id,
    type: channelType,
    password: channelPassword.value,
  })
    .then((data: Channel) => {
      emits("updateChannel");
      addAlertMessage("Channel successfully updated", 1);
      emits("closeChannelModal");
    })
    .catch(() => {});
};

onMounted(() => {
  picked.value = <string>props.channel.type;
});
</script>

<style lang="scss" scoped>
@import "../../../styles/variables";
.modal {
  z-index: 5;
  padding: 10px;
  width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  h3 {
    margin: 0;
    color: $primary;
  }
  .radioBundle {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 50%;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  .searchBar {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    width: 70%;
  }
}
</style>
