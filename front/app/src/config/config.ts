import { io, Socket } from "socket.io-client";

export default {
	socket: io(),
	hsToken: "",
	hsNick: "",
};
