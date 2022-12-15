<template>
  <div class="member-controll" @contextmenu.prevent="showUserMenu($event, member, me)">
    <div>
      <img class="user-image" :src="User.getAvatar(member)" alt="" />
      <h4 v-if="member.role === ChannelRole.OWNER" style="color: red">{{ member.nickname }}<i class="gg-crown"></i></h4>
      <h4 v-else-if="member.role === ChannelRole.ADMIN" style="color: gold">
        {{ member.nickname }}
      </h4>
      <h4 v-else>
        {{ member.nickname }}
      </h4>
      <h4 :class="statusClass">{{ member.status }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showUserMenu } from "@/functions/funcs";
import { useStore } from "@/store";
import { ChannelRole, ChannelUser } from "@/types/Channel";
import { User } from "@/types/User";
import { computed } from "@vue/reactivity";
import { ref } from "vue";

const props = defineProps<{
  member: ChannelUser;
  me: ChannelUser;
}>();
const statusClass = computed(() => props.member.status);

const store = useStore();
</script>
