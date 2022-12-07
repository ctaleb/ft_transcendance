<template>
  <div class="member-controll" @click="toggleMemberAction()">
    <div v-if="me.role !== ChannelRole.MEMBER && member.role !== ChannelRole.OWNER && toggleMode" class="member-action">
      <button class="primary-btn" @click="showMuteModal = true"><i class="gg-mic"></i></button>
      <button class="primary-btn" @click="showBanModal = true"><i class="gg-thermostat"></i></button>
      <button v-if="me.role === ChannelRole.OWNER" @click="giveTakeAdmin()" class="primary-btn">
        <i v-if="member.role === ChannelRole.MEMBER" class="gg-math-plus"></i>
        <i v-else class="gg-math-minus"></i>
      </button>
    </div>
    <div v-else>
      <img class="user-image" :src="User.getAvatar(member)" alt="" />
      <h4 v-if="member.role === ChannelRole.OWNER" style="color: red">{{ member.nickname }}<i class="gg-crown"></i></h4>
      <h4 v-else-if="member.role === ChannelRole.ADMIN" style="color: gold">
        {{ member.nickname }}
      </h4>
      <h4 v-else>
        {{ member.nickname }}
      </h4>
    </div>
  </div>
  <MuteModal v-if="showMuteModal" @close-mute-modal="showMuteModal = false" :member="member" />
  <BanModal v-if="showBanModal" @close-ban-modal="showBanModal = false" :member="member" />
</template>

<script setup lang="ts">
import BanModal from "@/components/chat/modals/BanModal.vue";
import MuteModal from "@/components/chat/modals/MuteModal.vue";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { ChannelRole, ChannelUser } from "@/types/Channel";
import { User } from "@/types/User";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  member: ChannelUser;
  me: ChannelUser;
}>();

const toggleMode = ref(false);
const showMuteModal = ref(false);
const showBanModal = ref(false);

const store = useStore();

const emits = defineEmits(["closeMuteModal", "closeBanModal"]);

const toggleMemberAction = () => {
  toggleMode.value = !toggleMode.value;
};

const giveTakeAdmin = async () => {
  if (props.me.role === ChannelRole.OWNER) {
    if (props.member.role === ChannelRole.MEMBER) {
      await giveAdmin(props.member);
    } else {
      await takeAdmin(props.member);
    }
    socketLocal.value?.emit("updateChannelMembers", { id: store.currentChat!.id });
  } else {
    addAlertMessage("You have no right to change channel members role", 3);
  }
};

const giveAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/give-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
};

const takeAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/take-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
};

onMounted(() => {
  watch(
    () => store.currentChat!.id,
    () => {
      toggleMode.value = false;
    }
  );
});
</script>
