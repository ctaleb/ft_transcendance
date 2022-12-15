<template>
  <li class="friend">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
      <path
        fill="#C1A36B"
        fill-opacity="1"
        d="M0,288L10.9,272C21.8,256,44,224,65,213.3C87.3,203,109,213,131,229.3C152.7,245,175,267,196,250.7C218.2,235,240,181,262,149.3C283.6,117,305,107,327,90.7C349.1,75,371,53,393,48C414.5,43,436,53,458,80C480,107,502,149,524,170.7C545.5,192,567,192,589,170.7C610.9,149,633,107,655,90.7C676.4,75,698,85,720,112C741.8,139,764,181,785,170.7C807.3,160,829,96,851,101.3C872.7,107,895,181,916,229.3C938.2,277,960,299,982,288C1003.6,277,1025,235,1047,224C1069.1,213,1091,235,1113,250.7C1134.5,267,1156,277,1178,250.7C1200,224,1222,160,1244,128C1265.5,96,1287,96,1309,90.7C1330.9,85,1353,75,1375,90.7C1396.4,107,1418,149,1429,170.7L1440,192L1440,0L1429.1,0C1418.2,0,1396,0,1375,0C1352.7,0,1331,0,1309,0C1287.3,0,1265,0,1244,0C1221.8,0,1200,0,1178,0C1156.4,0,1135,0,1113,0C1090.9,0,1069,0,1047,0C1025.5,0,1004,0,982,0C960,0,938,0,916,0C894.5,0,873,0,851,0C829.1,0,807,0,785,0C763.6,0,742,0,720,0C698.2,0,676,0,655,0C632.7,0,611,0,589,0C567.3,0,545,0,524,0C501.8,0,480,0,458,0C436.4,0,415,0,393,0C370.9,0,349,0,327,0C305.5,0,284,0,262,0C240,0,218,0,196,0C174.5,0,153,0,131,0C109.1,0,87,0,65,0C43.6,0,22,0,11,0L0,0Z"
      ></path>
    </svg>
    <img class="user-image" :src="User.getAvatar(friend)" alt="" />
    <h3>{{ friend.nickname }}</h3>
    <h4 style="text-align: center" :class="statusClass">{{ friend.status }}</h4>
    <div class="socialIcons">
      <i
        v-if="friend.status === 'inGame' && store.user?.status === 'online'"
        title="Spectate your friend"
        class="gg-eye"
        @click="User.spectateGame(router, friend)"
      ></i>
      <i title="Go to profile" class="gg-profile" @click="watchProfile()"></i>
      <template v-if="currentUserProfile?.id === store.user?.id">
        <i title="Delete friend" class="gg-close-o" @click="unfriend()"></i>
        <i
          v-if="friend.status === 'online' && store.user?.status === 'online'"
          title="Invite in game"
          class="gg-games"
          @click="User.inviteCustom(router, friend)"
        ></i>
      </template>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { currentUserProfile, socketLocal, useStore } from "@/store";
import { User } from "@/types/User";
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  friend: User;
}>();

const router = useRouter();
const store = useStore();
const statusClass = computed(() => props.friend.status);

const watchProfile = () => {
  router.push("/profile/" + props.friend.nickname);
};

const unfriend = async () => {
  if ((await User.unfriend(props.friend)) === true) {
    store.user?.friends!.splice(store.user?.friends!.indexOf(props.friend), 1);
    socketLocal.value?.emit("unfriend", { id: store.user?.id, addresseeId: props.friend.id });
  }
};
</script>

<style lang="scss"></style>
