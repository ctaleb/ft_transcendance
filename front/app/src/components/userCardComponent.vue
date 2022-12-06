<template>
  <div class="card">
    <img :src="imageUrl" alt="PictureProfile" style="width: 100%" />
    <h1>{{ nickname }}</h1>
    <p>{{ phone }}</p>
    <p><button>ELO</button></p>
  </div>
</template>
<script lang="ts">
// import { any, number } from "@hapi/joi";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    nick: String,
  },
  data() {
    return {
      user: {},
      imageUrl: "",
      phone: "",
      nickname: "",
    };
  },
  mounted() {
    fetch("http://" + window.location.hostname + ":3000/api/user/bynickname/" + this.$props.nick, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        this.nickname = data.nickname;
        this.phone = data.phone;
        let avatar = data.avatar.path;
        fetch("http://" + window.location.hostname + ":3000/api/user/profile-picture/" + avatar, {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        })
          .then((res) => res.blob())
          .then((data) => {
            this.imageUrl = URL.createObjectURL(data);
          })
          .catch((err) => console.log(err.message));
      })
      .catch((err) => console.log(err.message));
  },
});
</script>

<style scoped>
.card {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  max-width: 300px;
  margin: auto;
  text-align: center;
}

.title {
  color: grey;
  font-size: 18px;
}

button {
  border: none;
  outline: 0;
  display: inline-block;
  padding: 8px;
  color: white;
  background-color: #000;
  text-align: center;
  cursor: pointer;
  width: 100%;
  font-size: 18px;
}

a {
  text-decoration: none;
  font-size: 22px;
  color: black;
}

button:hover,
a:hover {
  opacity: 0.7;
}
</style>
