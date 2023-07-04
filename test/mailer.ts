import path from "path";
import { useMailer } from "../pkg";
import { IMail, ISender } from "../pkg/types";

class Sender implements ISender {
  send(mail: IMail): void {
    console.log("Sent!", mail);
  }
}

const { Mail } = useMailer({
  sender: new Sender(),
  templatePath: path.join(__dirname, "templates"),
});

Mail.create({
  email: "sender@gmail.com",
  template: "text",
  data: {
    name: "Treasure",
    first_name: "Obisike",
  }
}).send();
