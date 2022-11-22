<template>
  <div style="margin: 3rem">
    <h2>{{ user.nickname }} profile edition</h2>
    <label class="switch">
      <input type="checkbox" id="2faSwitch" @change="twoFactorSwitch($event)" />
      <span class="slider round"></span>
    </label>
    <div v-if="toggleClicked == true">
      <div v-if="missingPhoneNumber == true">
        Add a phone number to your profile in order to enable 2FA
      </div>
      <div v-if="twoFactorEnabled == true">
        2FA enabled ! You will be asked for a code sent by sms during your next
        connection
      </div>
      <div v-else>2FA Disabled !</div>
    </div>
    <div>
      <div class="edition-section">
        <input class="text-input" type="text" v-model="nickname" />
        <input
          class="submit-input"
          type="submit"
          value="update nickname"
          @click.stop.prevent="updateNickname()"
        />
        <div v-if="nicknameUsed">Nickname is already in use.</div>
        <div v-if="success">Nickname successfully updated.</div>
      </div>
      <div class="edition-section">
        <img :src="getUserAvatar()" alt="" class="image" /><br />
        <label for="avatar">Update your profile picture:</label><br />
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/*"
          @change="updateAvatar"
        />
      </div>
      <div class="edition-section">
        <input
          class="text-input"
          type="text"
          placeholder="+33 6 11 22 33 44"
          v-model="phone"
          @input="formatPhone"
        />
        <input
          class="submit-input"
          type="submit"
          value="update phone"
          :disabled="phoneFormatError.length ? true : false"
          @click.stop.prevent="updatePhone()"
        />
        <div v-if="phoneSuccess == true">
          Phone number updated successfully !
        </div>
        <div v-if="phoneFormatError.length">
          {{ phoneFormatError }}
        </div>
      </div>
      <div v-if="!user.intraId" class="edition-section">
        <input
          class="text-input"
          type="text"
          placeholder="new password"
          v-model="password"
        /><br />
        <br />
        <input
          class="text-input"
          type="password"
          placeholder="please confirm new password"
          v-model="confirmPassword"
        />
        <input
          class="submit-input"
          type="submit"
          value="confirm password"
          @click.stop.prevent="updatePassword()"
        />
        <div v-if="!passwordMatchFlag">Passwords don't match.</div>
        <div v-if="!ValidPasswordFlag">
          Password must contains at least one uppercase, one lowercase, one
          special character, and be between 9 and 13 characters long.
        </div>
        <div v-if="updatePasswordSuccess" color="green">
          Password successfully updated!
        </div>
      </div>
    </div>
    <button
      type="button"
      id="deleteAccountButton"
      @click.stop.prevent="deleteAccount()"
    >
      DELETE MY ACCOUNT
    </button>
  </div>
  <friend-alert :requester-name="this.incomingFriendRequest" />
</template>

<script lang="ts">
import { getUserAvatar } from "@/functions/funcs";
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
      image: ref(""),
      nickname: JSON.parse(localStorage.getItem("user") || "{}").nickname,
      nicknameUsed: ref(false),
      success: ref(false),
      phoneSuccess: ref(false),
      newAvatar: File.prototype,
      password: ref(""),
      confirmPassword: ref(""),
      ValidPasswordFlag: ref(true),
      passwordMatchFlag: ref(true),
      updatePasswordSuccess: ref(false),
      missingPhoneNumber: ref(false),
      twoFactorEnabled: ref(false),
      toggleClicked: ref(false),
      phoneFormatError: ref(""),
    };
  },
  emits: ["notification"],
  mounted() {
    this.initTwoFactorToggle();
    funcs.getUserById(this.user.id).then((data: any) => {
      this.avatar = data.path;
      this.image = funcs.getUserAvatar(this.avatar);
    });
  },
  components: { FriendAlert },
  methods: {
    async updateNickname() {
      let fetch_ret = await fetch(
        "http://" +
          window.location.hostname +
          ":3000/api/user/nicknameEdit/" +
          this.nickname,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          method: "PUT",
        }
      )
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      console.log(JSON.stringify(fetch_ret));
      if (fetch_ret.user) {
        localStorage.setItem("user", JSON.stringify(fetch_ret.user));
        localStorage.setItem("token", fetch_ret.token);
        this.user = fetch_ret.user;
        this.nicknameUsed = false;
        this.success = true;
      } else {
        this.nicknameUsed = true;
        this.success = false;
      }
    },
    updateAvatar(event: Event) {
      this.newAvatar = (event.target as HTMLInputElement).files?.[0]!;
      if (this.newAvatar != File.prototype) this.updatePicture();
    },
    async updatePicture() {
      let formData = new FormData();
      formData.append("avatar", this.newAvatar);
      let fetch_ret = await fetch(
        "http://" + window.location.hostname + ":3000/api/user/avatarEdit",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          method: "PUT",
          body: formData,
        }
      )
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      this.image = funcs.getUserAvatar(fetch_ret.avatar.path);
      localStorage.setItem("user", JSON.stringify(fetch_ret.user));
      localStorage.setItem("token", fetch_ret.token);
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
        return;
      }
      if (!this.passwordsMatch(this.password, this.confirmPassword)) {
        this.passwordMatchFlag = false;
        return;
      }
      const updateResult = await fetch(
        "http://" + window.location.hostname + ":3000/api/user/passwordEdit",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            newPassword: this.password,
          }),
        }
      )
        .then((res) => {
          return res.json();
        })
        .catch((err) => {
          console.log(err);
        });
      if (updateResult.success) {
        this.updatePasswordSuccess = true;
      }
    },

    async deleteAccount() {
      await fetch(
        "http://" + window.location.hostname + ":3000/api/user/delete",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          method: "DELETE",
        }
      );
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
      this.toggleClicked = true;
      if (this.phone == null) {
        this.missingPhoneNumber = true;
        const checkbox = document.getElementById(
          "2faSwitch"
        ) as HTMLInputElement | null;

        if (checkbox != null) {
          checkbox.checked = false;
        }
      } else {
        this.updateTwoFactorAuth();
      }
    },
    async updatePhone() {
      let fetch_ret = await fetch(
        "http://" +
          window.location.hostname +
          ":3000/api/user/phoneEdit/" +
          this.phone,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          method: "PUT",
        }
      )
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
        this.phoneSuccess = true;
        this.missingPhoneNumber = false;
      } else this.phoneSuccess = false;
    },

    async updateTwoFactorAuth() {
      let fetch_ret = await fetch(
        "http://" +
          window.location.hostname +
          ":3000/api/user/twofactorAuthEdit/",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          method: "PUT",
        }
      )
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
        this.twoFactorEnabled = fetch_ret.newValue;
      }
    },
    formatPhone() {
      console.log("formatPhone");
      if (this.phone.match(/\+\d{2}[6,7]\d{8}/) && this.phone.length == 12)
        this.phoneFormatError = "";
      else this.phoneFormatError = "phone must be in format '+33611223344'";
    },
  },
});
</script>

<style scoped>
.edition-section {
  border: 0.2rem solid black;
  border-radius: 10px;
  margin-top: 0.5rem;
  padding: 0.5rem;
}
.text-input {
  padding: 0.7rem;
  width: 50%;
  box-sizing: border-box;
}
.submit-input {
  padding: 0.7rem;
  background-color: #5aff75;
}
#deleteAccountButton {
  background-color: #e13511;
  border-radius: 20px;
  width: 15rem;
  box-sizing: border-box;
  padding: 1rem;
  margin-top: 2rem;
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
</style>
