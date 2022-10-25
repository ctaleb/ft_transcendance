<template>
  <p>Welcome to the fc_transcendance portal</p>
  <friend-alert :requester-name="this.incomingFriendRequest" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FriendAlert from "../components/FriendAlert.vue";
let funcs = require("../functions/funcs");

export default defineComponent({
  props: ["incomingFriendRequest"],
  data() {
    return {};
  },
  emits: ["notification"],
  mounted() {},
  components: { FriendAlert },
});
</script>
