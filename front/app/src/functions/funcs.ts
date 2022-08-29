export function isConnected(token: string) {
	if (token == null)
		return false;
	fetch("http://localhost:3000/api/user/profile", {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + token,
		},
	})
	.then(res => res.json())
    .then((data) => {
		if (data.message)
			return false;
		else
			return true;
	})
	.catch(err => console.log(err.message));
}