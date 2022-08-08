import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import RegisterView from "../views/RegisterView.vue";
import LoginView from "../views/LoginView.vue";
import ProfileView from "../views/ProfileView.vue";

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
		path: "/signup",
		name: "sign up",
		component: RegisterView,
	},
	{
		path: "/signin",
		name: "signin",
		component: LoginView,
	},
	{
		path: "/profile",
		name: "profile",
		component: ProfileView,
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
});

export default router;
