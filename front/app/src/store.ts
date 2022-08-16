import { reactive } from 'vue'

export const store = reactive({
	token : {},
	user: {
		createdAt: null,
		id: null,
		nickname: null,
		updatedAt: null,
		uuid: null,
	},
	isConnected: false,
})