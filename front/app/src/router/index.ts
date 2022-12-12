import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import ChatView from "../views/ChatView.vue";
import ProfileView from "../views/ProfileView.vue";
import EditView from "../views/EditView.vue";
import twoFactorView from "../views/twoFactorView.vue";
import { isConnected } from "@/functions/funcs";
let funcs = require("../functions/funcs");

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/game",
    name: "game",
    component: GameView,
  },
  {
    path: "/chat",
    name: "chat",
    component: ChatView,
  },

  {
    path: "/profile/:nickname?",
    name: "profile",
    component: ProfileView,
  },
  {
    path: "/edit",
    name: "edit",
    component: EditView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from) => {
  let isConnected = funcs.isConnected(localStorage.getItem("token")).catch();
  if (to.fullPath != "/" && from.fullPath != "/") {
    if (isConnected) return true;
    else return { name: "home" };
  } else if (to.query.code) return true;
  else if (to.fullPath == "/" || to.fullPath == "/signup") return true;
  else if (from.fullPath == "/" && localStorage.getItem("token")) return true;
  return { name: "home" };
});

export default router;
