import dayjs from "dayjs";

export interface Message {
  text: string;
  author: string;
  date: string;
}

export function transformDate(msg: Message): Message {
  const msgDate = dayjs(msg.date);
  if (msgDate.diff(dayjs(), "hour") > 24) {
    msg.date = msgDate.format("DD/MM/YYYY HH:mm");
  } else {
    if (msgDate.get("date") !== dayjs().get("date")) {
      msg.date = msgDate.format("[Yesterday at] HH:mm");
    } else {
      msg.date = msgDate.format("[Today at] HH:mm");
    }
  }
  return msg;
}
