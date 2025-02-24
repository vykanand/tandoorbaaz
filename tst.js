import pkg from "maher-zubair-baileys";
const { makeWASocket, useMultiFileAuthState } = pkg;

async function testMenu() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    console.log("Received message:", msg.message?.conversation);

    if (msg.message?.conversation === "menu") {
      console.log("Sending menu...");
      const message = {
        text: "🔥 Welcome to Tandoorbaaz!\nSelect your favorite dish:",
        footer: "Fresh from our tandoor to your plate",
        buttons: [
          {
            buttonId: "1",
            buttonText: { displayText: "CHICKEN SEEKH KEBAB - ₹59" },
            type: 1,
          },
          {
            buttonId: "2",
            buttonText: { displayText: "TANDOORI CHICKEN - ₹89" },
            type: 1,
          },
          {
            buttonId: "3",
            buttonText: { displayText: "CHICKEN TIKKA - ₹149" },
            type: 1,
          },
        ],
        headerType: 1,
      };

      await sock.sendMessage(msg.key.remoteJid, message);
      console.log("Interactive menu sent!");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

testMenu();
