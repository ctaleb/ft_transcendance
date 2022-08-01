import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AboutView from "../views/AboutView.vue";
import RegisterView from "../views/RegisterView.vue";
import LoginView from "../views/LoginView.vue";
import UsersView from "../views/UsersView.vue";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		name: "home",
		component: HomeView,
	},
	{
		path: "/about",
		name: "about",
		component: AboutView,
	},
	{
		path: "/register",
		name: "register",
		component: RegisterView,
	},
	{
		path: "/login",
		name: "login",
		component: LoginView,
	},
	{
		path: "/users",
		name: "users",
		component: UsersView,
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
});

export default router;
