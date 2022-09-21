<template>
  <button @click="openModal()">Add friend</button>
  <div class="modal hidden">
  <form>
    <input type="text" name="friend" placeholder="Search..." />
    <button @click="sendFriendRequest()">Send friend request</button>
  </div>
  </form>
  <div @click="closeModal()" class="overlay hidden"></div>

  Friend request sent:
  <ul id='friend-list'>
  <li class='friend' v-for="user in invitationsOut">
    {{ user.name }}
  </li>
  </ul>

  Friend request received:
  <ul id='friend-list'>
  <li class='friend selected'>
    <img src='https://i.imgur.com/nkN3Mv0.jpg' />
    <div class='name'>
      Andres Perez
    </div>
  </li>
  </ul>

  Friends:
  <ul id='friend-list'>
  <li class='friend selected'>
    <img src='https://i.imgur.com/nkN3Mv0.jpg' />
    <div class='name'>
      Andres Perez
    </div>
  </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from "vue";
const props = defineProps('userId');
const invitationsOut = ref([]);
const invitationsIn = ref([]);
const friends = ref([]);

function sendFriendRequest() {
  let sendFriendRequestForm = new FormData();
  sendFriendRequestForm.append(props.userId);
  sendFriendRequestForm.append("friend");
  

  fetch("http://localhost:3000/api/friend-list/sendFriendRequest", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: sendFriendRequestForm,
  });
  closeModal();
}

onBeforeMount(() => {
  fetch("http://localhost:3000/api/friend-list", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  }).then(res => res.json()).then((data) => {
    friends.value = data.friends;
    invitationsIn.value = data.invitationsIn;
    invitationsOut.value = data.invitationsOut;
  });
});
</script>

<style type="scss"></style>
