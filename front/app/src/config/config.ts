import { io, Socket } from "socket.io-client";

export default {
  socket: io("http://" + window.location.hostname + ":3500", {
    transports: ["websocket"],
    // path: "/api/socket.io/",
    autoConnect: false,
  }),
};
