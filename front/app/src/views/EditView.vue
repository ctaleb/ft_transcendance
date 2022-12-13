<template>
  <div class="principalSection">
    <div class="mainContainer">
      <h3>Personnal informations</h3>
      <div class="containerSections">
        <div class="section">
          <img :src="avatarUrl" alt="" class="image" />
          <label for="avatar" class="fileInput"
            >Select picture <i class="gg-image"></i><input type="file" id="avatar" name="avatar" accept="image/*" @change="updateAvatar"
          /></label>
        </div>
        <div class="section">
          <input id="nick" type="text" v-model="nickname" maxlength="15" minlength="3" />
          <button type="submit" class="button" @click.stop.prevent="updateNickname()">Update nickname</button>
        </div>
        <div class="section">
          <input id="phone" type="text" placeholder="+33 6 11 22 33 44" v-model="phone" @input="formatPhone" />
          <button type="submit" class="button" :disabled="phoneFormatError.length ? true : false" @click.stop.prevent="updatePhone()">Update phone</button>
          <div v-if="phoneFormatError.length">
            {{ phoneFormatError }}
          </div>
        </div>
        <div class="section" v-if="!user.intraId">
          <input id="password" type="password" placeholder="new password" v-model="password" />
          <input type="password" placeholder="please confirm new password" v-model="confirmPassword" />
          <button type="submit" class="button" @click.stop.prevent="updatePassword()">Update password</button>
        </div>
        <div class="responsiveSvgSection">
          <img :class="{ lessOpacity: twoFactorEnabled == false }" src="../assets/twoFaDisabled.svg" alt="" />
          <div class="content">
            <label class="switch">
              <input type="checkbox" class="2faSwitch" @change="twoFactorSwitch($event)" />
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="svgSection">
      <img :class="{ lessOpacity: twoFactorEnabled == false }" src="../assets/twoFaDisabled.svg" alt="" />
      <div class="content">
        <h2 v-if="twoFactorEnabled == false">2FA disabled</h2>
        <h2 v-else>2FA enabled</h2>
        <label class="switch">
          <input type="checkbox" class="2faSwitch" @change="twoFactorSwitch($event)" />
          <span class="slider round"></span>
        </label>
      </div>
    </div>
    <!--<div>
      <h4>Two factor authentication</h4>
      <h6 :class="{ twoFaTitleActive: twoFactorEnabled }">You will receive an sms code during your future connections</h6>
    </div>-->
  </div>

  <svg class="bottomSvg" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
    <path
      fill="#C1A36B"
      fill-opacity="1"
      d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,74.7C1120,75,1280,53,1360,42.7L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
    ></path>
  </svg>
</template>

<script lang="ts">
import { fetchJSONDatas, trySetupUser } from "@/functions/funcs";
import { useStore } from "@/store";
import { getUserById } from "@/types/User";
import { defineComponent, ref } from "vue";
let funcs = require("../functions/funcs");

export default defineComponent({
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
      missingPhoneNumber: ref(false),
      twoFactorEnabled: ref(false),
      toggleClicked: ref(false),
      phoneFormatError: ref(""),
      avatarUrl: ref(""),
    };
  },
  async mounted() {
    this.initTwoFactorToggle();
    const _user = await getUserById(this.user.id);
    this.avatar = _user.avatar;
    this.avatarUrl = this.getUserAvatar();
  },
  methods: {
    async updateNickname() {
      if (this.nickname.length < 1) return;
      let fetch_ret = await funcs.fetchJSONDatas("api/user/nicknameEdit/" + this.nickname, "PUT").catch(() => {
        return null;
      });
      if (fetch_ret == null) {
        funcs.addAlertMessage("Nickname must stay between 3 and 15 chars.", 1);
        return;
      }
      if (fetch_ret.user) {
        localStorage.setItem("user", JSON.stringify(fetch_ret.user));
        localStorage.setItem("token", fetch_ret.token);
        this.user = fetch_ret.user;
        this.store.user!.nickname = this.nickname;
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
      this.store.user!.avatar = "/api/user/profile-picture/" + fetch_ret.user.avatar.path;

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
      await fetchJSONDatas("api/user/passwordEdit", "PUT", {
        newPassword: this.password,
      })
        .then((data) => {
          if (data.success) {
            this.password = "";
            this.confirmPassword = "";
            funcs.addAlertMessage("Password updated !", 1);
          }
        })
        .catch(() => {});
    },
    getUserAvatar(): string {
      return `http://${window.location.hostname}:3000${this.store.user?.avatar}`;
    },

    initTwoFactorToggle() {
      if (this.user.twoFactorAuth == true) {
        this.twoFactorEnabled = true;
        this.setSwitches(true);
      } else {
        console.log("2fa disabled");
      }
    },
    twoFactorSwitch(event: any) {
      console.log(this.phone);
      if (this.phone == null) {
        funcs.addAlertMessage("Missing phone number", 1);
        this.setSwitches(false);
      } else {
        this.updateTwoFactorAuth();
      }
    },
    async updatePhone() {
      if (this.phone == "") this.phone = "delete";
      await fetchJSONDatas(`api/user/phoneEdit/${this.phone}`, "PUT")
        .then((data) => {
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);
            this.user = data.user;
            if (this.phone == "delete") {
              if (this.twoFactorEnabled == true) this.updateTwoFactorAuth();
              this.phone = null;
              this.store.user!.phone = this.phone;
              this.setSwitches(false);
            } else this.store.user!.phone = this.phone;
            funcs.addAlertMessage("Phone successfully updated", 2);
            this.missingPhoneNumber = false;
            trySetupUser();
          } else funcs.addAlertMessage("Updated failed", 3);
        })
        .catch(() => {});
    },

    async updateTwoFactorAuth() {
      await fetchJSONDatas("api/user/twofactorAuthEdit", "PUT")
        .then((data) => {
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);
            this.user = data.user;
            if (data.newValue == true) {
              funcs.addAlertMessage("2fa enabled !", 2);
              this.twoFactorEnabled = true;
            } else {
              this.twoFactorEnabled = false;
              funcs.addAlertMessage("2fa Disabled", 2);
            }
          }
        })
        .catch(() => {});
    },
    formatPhone() {
      console.log("formatPhone");
      if ((this.phone.match(/\+\d{2}[6,7]\d{8}/) && this.phone.length == 12) || this.phone == "") this.phoneFormatError = "";
      else this.phoneFormatError = "phone must be in format '+33611223344'";
    },

    setSwitches(val: boolean) {
      const switches = document.getElementsByClassName("2faSwitch");
      Array.prototype.forEach.call(switches, function (el) {
        el.checked = val;
      });
    },
  },
});
</script>

<style lang="scss" scoped>
@import "../styles/variables";
@import "../styles/inputsAndButtons.scss";
@import "../styles/svgStyles.scss";
@import "../styles/containerStyle.scss";
@import "../styles/switch.scss";
.principalSection {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 20px;
  align-items: center;
  width: 100vw;
  height: 75vh;
  @include screen-lg {
    justify-content: center;
  }

  .mainContainer {
    height: 100%;
    .containerSections {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      width: 100%;
      height: 100%;
      @include screen-md {
        justify-content: flex-start;
      }
    }
    .responsiveSvgSection {
      display: none;
    }
    h3 {
      margin-bottom: 3px;
    }
    @include screen-lg {
      width: 100%;
      padding: 20px 0 0 0;
      h3 {
        display: none;
      }
      .svgSection {
        display: none;
      }
      .responsiveSvgSection {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 9px;
      }
    }
  }
  .svgSection {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35%;
    color: white;
    position: relative;
    @include screen-lg {
      display: none;
    }
    img {
      width: 100%;
      transition: opacity 0.4s ease;
    }

    & > .content {
      // Self
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;

      // Layout
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }

  .section {
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .image {
      padding: 0;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .button {
    margin-top: 15px;
  }
  .lessOpacity {
    opacity: 0.5;
  }
}
</style>
