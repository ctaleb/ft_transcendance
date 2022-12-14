<template>
  <li>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
      <path
        fill="#C1A36B"
        fill-opacity="1"
        d="M0,224L12.6,218.7C25.3,213,51,203,76,213.3C101.1,224,126,256,152,224C176.8,192,202,96,227,96C252.6,96,278,192,303,218.7C328.4,245,354,203,379,165.3C404.2,128,429,96,455,85.3C480,75,505,85,531,128C555.8,171,581,245,606,256C631.6,267,657,213,682,192C707.4,171,733,181,758,197.3C783.2,213,808,235,834,240C858.9,245,884,235,909,202.7C934.7,171,960,117,985,112C1010.5,107,1036,149,1061,186.7C1086.3,224,1112,256,1137,266.7C1162.1,277,1187,267,1213,261.3C1237.9,256,1263,256,1288,218.7C1313.7,181,1339,107,1364,80C1389.5,53,1415,75,1427,85.3L1440,96L1440,0L1427.4,0C1414.7,0,1389,0,1364,0C1338.9,0,1314,0,1288,0C1263.2,0,1238,0,1213,0C1187.4,0,1162,0,1137,0C1111.6,0,1086,0,1061,0C1035.8,0,1011,0,985,0C960,0,935,0,909,0C884.2,0,859,0,834,0C808.4,0,783,0,758,0C732.6,0,707,0,682,0C656.8,0,632,0,606,0C581.1,0,556,0,531,0C505.3,0,480,0,455,0C429.5,0,404,0,379,0C353.7,0,328,0,303,0C277.9,0,253,0,227,0C202.1,0,177,0,152,0C126.3,0,101,0,76,0C50.5,0,25,0,13,0L0,0Z"
      ></path>
    </svg>
    <img class="user-image" :src="User.getAvatar(invitation)" alt="" />
    <h3>{{ invitation.nickname }}</h3>
    <h4>Invitation pending</h4>

    <div class="socialIcons">
      <i title="Block this user" class="gg-lock" @click="block(invitation)"></i>
      <i title="Go to profile" class="gg-profile" @click="watchProfile()"></i>
      <i title="Reject invite" class="gg-close-o" @click="decline(invitation)"></i>
      <i title="Accept invite" class="gg-check-o" @click="befriend(invitation)"></i>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { User } from "@/types/User";
import { useRouter } from "vue-router";

const props = defineProps<{
  invitation: User;
}>();

const router = useRouter();
const store = useStore();

const watchProfile = () => {
  router.push("/profile/" + props.invitation.nickname);
};

const befriend = async (invitation: User) => {
  await fetchJSONDatas("api/friendship/befriend", "PUT", {
    addressee: invitation.nickname,
  })
    .then(() => {
      store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
      store.user?.friends?.push(invitation);
      socketLocal.value?.emit("befriend", { id: store.user?.id, addresseeId: invitation.id });
    })
    .catch(() => {});
};

const decline = async (invitation: User) => {
  await fetchJSONDatas("api/friendship/decline", "DELETE", {
    addressee: invitation.nickname,
  })
    .then((data) => {
      store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
    })
    .catch(() => {});
};

const block = async (invitation: User) => {
  if ((await User.block(invitation)) === true) store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
};
</script>

<style lang="scss"></style>
