const API_KEY = "AIzaSyDV1HGkXOd_a8_c_8bjihkd-cYfVH-QFoI" ; // Replace with your actual API key
const chatBox = document.getElementById("chat-box");

function appendMessage(sender, message) {
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("You", userMessage);
  input.value = "";

  const typingMsg = document.createElement("div");
  typingMsg.innerHTML = `<strong>Gemini:</strong> Typing...`;
  chatBox.appendChild(typingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userMessage }] }]
    }),
  });

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from Gemini.";
  typingMsg.innerHTML = `<strong>Gemini:</strong> ${reply}`;
}
