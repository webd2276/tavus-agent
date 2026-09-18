const apiKey = "8f0b4e63867345f1bbedbe2a8ef64e80";
const palId = "p12ae6879d22";
const faceId = "r3f4182ef554";
const callbackUrl = "https://zain-video-agent.netlify.app/api/webhooks/tavus";

async function testTavus() {
  const res = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      pal_id: palId,
      face_id: faceId,
      callback_url: callbackUrl,
    }),
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

testTavus();
