<template>
  <h2>{{ user.nickname }} profile edition</h2>
  <div class="mainContainer">
    <div class="textInputs">
      <h4>Personnal informations</h4>
      <div class="edition-section">
        <label for="nick" class="label">Nickname</label>
        <hr class="solid" />
        <div class="inputAndButton">
          <input id="nick" class="text-input" type="text" v-model="nickname" />
          <input class="submit-input" type="submit" value="update nickname" @click.stop.prevent="updateNickname()" />
        </div>
      </div>
      <div class="edition-section">
        <label for="phone" class="label">Phone</label>
        <hr class="solid" />

        <div class="inputAndButton">
          <input id="phone" class="text-input" type="text" placeholder="+33 6 11 22 33 44" v-model="phone" @input="formatPhone" />
          <input
            class="submit-input"
            type="submit"
            value="update phone"
            :disabled="phoneFormatError.length ? true : false"
            @click.stop.prevent="updatePhone()"
          />
        </div>
        <div v-if="phoneFormatError.length">
          {{ phoneFormatError }}
        </div>
      </div>
      <div v-if="!user.intraId" class="edition-section">
        <label for="password">Password</label>
        <hr class="solid" />

        <input id="password" class="text-input" type="password" placeholder="new password" v-model="password" /><br />
        <div class="inputAndButton">
          <input class="text-input" type="password" placeholder="please confirm new password" v-model="confirmPassword" />
          <input class="submit-input" type="submit" value="confirm password" @click.stop.prevent="updatePassword()" />
        </div>
      </div>
    </div>
    <div class="avatarAndTwofa">
      <h4>Avatar</h4>
      <div class="edition-section">
        <img :src="avatarUrl" alt="" class="image" /><br />
        <label for="avatar"
          >Select picture <i class="gg-image"></i><input type="file" id="avatar" name="avatar" accept="image/*" @change="updateAvatar" /></label
        ><br />
      </div>
      <h4>2fa</h4>
      <label class="switch">
        <input type="checkbox" id="2faSwitch" @change="twoFactorSwitch($event)" />
        <span class="slider round"></span>
      </label>
    </div>
    <friend-alert :requester-name="incomingFriendRequest" />
  </div>
</template>

<script lang="ts">
import { getUserAvatar, trySetupUser } from "@/functions/funcs";
import { User, getUserById } from "@/types/User";
import { useStore } from "@/store";
import { defineComponent, ref } from "vue";
import FriendAlert from "../components/FriendAlert.vue";
let funcs = require("../functions/funcs");

export default defineComponent({
  props: ["incomingFriendRequest"],
  data() {
    return {
      store: useStore(),
      user: JSON.parse(localStorage.getItem("user") || "{}"),
      avatar: "{}",
      phone: JSON.parse(localStorage.getItem("user") || "{}").phone,
      nickname: JSON.parse(localStorage.getItem("user") || "{}").nickname,
      phoneSuccess: ref(false),
      newAvatar: File.prototype,
      password: ref(""),
      confirmPassword: ref(""),
      ValidPasswordFlag: ref(true),
      missingPhoneNumber: ref(false), //addAlert
      twoFactorEnabled: ref(false),
      toggleClicked: ref(false),
      phoneFormatError: ref(""),
      avatarUrl: ref(""),
    };
  },
  emits: ["notification"],
  async mounted() {
    this.initTwoFactorToggle();
    const _user = await getUserById(this.user.id);
    this.avatar = _user.avatar;
    this.avatarUrl = this.getUserAvatar();
  },
  components: { FriendAlert },
  methods: {
    async updateNickname() {
      if (this.nickname.length < 1) return;
      let fetch_ret = await funcs.fetchJSONDatas("api/user/nicknameEdit/" + this.nickname, "PUT").catch(() => {
        return null;
      });
      if (fetch_ret == null) {
        return;
      }
      if (fetch_ret.user) {
        localStorage.setItem("user", JSON.stringify(fetch_ret.user));
        localStorage.setItem("token", fetch_ret.token);
        this.user = fetch_ret.user;
        funcs.addAlertMessage("Nickname successfully updated", 2);
      }
    },
    updateAvatar(event: Event) {
      if ((event.target as HTMLInputElement).files?.[0].size! < 2097152) {
        this.newAvatar = (event.target as HTMLInputElement).files?.[0]!;
        if (this.newAvatar != File.prototype) {
          this.updatePicture();
        }
      } else {
        funcs.addAlertMessage("File too big, should be less than 2Mb", 1);
      }
    },
    async updatePicture() {
      let formData = new FormData();
      formData.append("avatar", this.newAvatar);
      let fetch_ret = await fetch("http://" + window.location.hostname + ":3000/api/user/avatarEdit", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        method: "PUT",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) return Promise.reject();
          return res.json();
        })
        .catch((err) => {
          funcs.addAlertMessage("Unauthorized", 3);
          return null;
        });
      if (fetch_ret == null) return;
      localStorage.setItem("user", JSON.stringify(fetch_ret.user));
      localStorage.setItem("token", fetch_ret.token);
      await trySetupUser();
      this.avatarUrl = this.getUserAvatar();
    },

    containsUppercase(value: string) {
      return /[A-Z]/.test(value);
    },
    containsLowercase(value: string) {
      return /[a-z]/.test(value);
    },
    containsSpecial(value: string) {
      return /[#?!@$%^&*-]/.test(value);
    },
    containsNumber(value: string) {
      return /[0-9]/.test(value);
    },

    isValidPassword(password: string) {
      return (
        this.containsUppercase(password) &&
        this.containsLowercase(password) &&
        this.containsSpecial(password) &&
        this.containsNumber(password) &&
        password.length >= 9 &&
        password.length <= 13
      );
    },

    passwordsMatch(password: string, confirmPassword: string) {
      return password === confirmPassword;
    },

    async updatePassword() {
      if (!this.isValidPassword(this.password)) {
        this.ValidPasswordFlag = false;
        funcs.addAlertMessage(
          "Password must contains at least one uppercase, one lowercase, one special character, and be between 9 and 13 characters long.",
          2
        );
        return;
      }
      if (!this.passwordsMatch(this.password, this.confirmPassword)) {
        funcs.addAlertMessage("Passwords don't match", 2);
        return;
      }
      const updateResult = await fetch("http://" + window.location.hostname + ":3000/api/user/passwordEdit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          newPassword: this.password,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      if (updateResult.success) {
        funcs.addAlertMessage("Password updated !", 1);
      }
    },

    async deleteAccount() {
      await fetch("http://" + window.location.hostname + ":3000/api/user/delete", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        method: "DELETE",
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.$router.push("/");
    },
    getUserAvatar(): string {
      return `http://${window.location.hostname}:3000${this.store.user?.avatar}`;
    },

    initTwoFactorToggle() {
      if (this.user.twoFactorAuth == true) {
        document.getElementById("2faSwitch")?.setAttribute("checked", "true");
      } else {
        console.log("2fa disabled");
      }
    },
    twoFactorSwitch(event: any) {
      if (this.phone == null) {
        funcs.addAlertMessage("Missing phone number", 2);
        const checkbox = document.getElementById("2faSwitch") as HTMLInputElement | null;

        if (checkbox != null) {
          checkbox.checked = false;
        }
      } else {
        this.updateTwoFactorAuth();
      }
    },
    async updatePhone() {
      let fetch_ret = await fetch("http://" + window.location.hostname + ":3000/api/user/phoneEdit/" + this.phone, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        method: "PUT",
      })
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      if (fetch_ret.user) {
        localStorage.setItem("user", JSON.stringify(fetch_ret.user));
        localStorage.setItem("token", fetch_ret.token);
        this.user = fetch_ret.user;
        funcs.addAlertMessage("Phone successfully updated", 2);
        this.missingPhoneNumber = false;
      } else funcs.addAlertMessage("Updated failed", 3);
    },

    async updateTwoFactorAuth() {
      let fetch_ret = await fetch("http://" + window.location.hostname + ":3000/api/user/twofactorAuthEdit/", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        method: "PUT",
      })
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      if (fetch_ret.user) {
        localStorage.setItem("user", JSON.stringify(fetch_ret.user));
        localStorage.setItem("token", fetch_ret.token);
        this.user = fetch_ret.user;
        if (fetch_ret.newValue == true) funcs.addAlertMessage("2fa enabled !", 2);
        else funcs.addAlertMessage("2fa Disabled", 2);
      }
    },
    formatPhone() {
      console.log("formatPhone");
      if (this.phone.match(/\+\d{2}[6,7]\d{8}/) && this.phone.length == 12) this.phoneFormatError = "";
      else this.phoneFormatError = "phone must be in format '+33611223344'";
    },
  },
});
</script>

<style lang="scss" scoped>
@import "../styles/variables";

.mainContainer {
  width: 100vw;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.textInputs {
  padding: 2rem;
  font-size: 25px;
  display: flex;
  flex-direction: column;
  border: 1px solid $primary;
  border-radius: 10px;
  width: 40vw;
  align-items: flex-start;
  label {
    color: $primary;
  }
  .edition-section {
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: column;
    width: 100%;
    hr {
      border-color: #c1a36b;
      text-align: left;
      height: 1px;
      width: 75%;
      margin-inline: 0;
      margin-top: 1px;
    }
    #password {
      width: 75%;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
    }
    .inputAndButton {
      display: flex;
      flex-direction: row;
      input[type*="text"],
      input[type*="password"] {
        width: 60%;
      }
      input[type*="submit"] {
        width: 15%;
        border: 1px solid yellow;
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        border-left-style: hidden;
      }
    }
  }
  .text-input {
    padding: 0.8rem;
    border: 1px solid yellow;
    border-right-style: hidden;
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }
}
.avatarAndTwofa {
  padding: 2rem;
  font-size: 25px;
  border: 1px solid $primary;
  border-radius: 10px;
  width: 40vw;
  .edition-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    img {
      width: 250px;
      height: 250px;
      border: 1px solid $primary;
      border-radius: 10000px;
    }
    label {
      input {
        display: none;
      }
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      border: 1px solid $primary;
      i {
        margin-left: 10px;
      }
    }
    label:hover {
      background: #c1a36b;
      cursor: pointer;
    }
  }
}
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #c1a36b;
}

input:focus + .slider {
  box-shadow: 0 0 1px #c1a36b;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.image {
  width: 15%;
  height: 15rem;
  object-fit: cover;
}

//css icon
.gg-image {
  box-sizing: border-box;
  position: relative;
  display: block;
  transform: scale(var(--ggs, 1));
  width: 20px;
  height: 16px;
  overflow: hidden;
  box-shadow: 0 0 0 2px;
  border-radius: 2px;
}
.gg-image::after,
.gg-image::before {
  content: "";
  display: block;
  box-sizing: border-box;
  position: absolute;
  border: 2px solid;
}
.gg-image::after {
  transform: rotate(45deg);
  border-radius: 3px;
  width: 16px;
  height: 16px;
  top: 9px;
  left: 6px;
}
.gg-image::before {
  width: 6px;
  height: 6px;
  border-radius: 100%;
  top: 2px;
  left: 2px;
}
</style>
