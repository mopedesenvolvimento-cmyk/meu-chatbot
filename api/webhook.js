import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Verificação do Webhook (Facebook/WhatsApp)
app.get("/webhook", (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN || "meu_token_secreto";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  } else {
    console.log("Falha na verificação do webhook");
    return res.sendStatus(403);
  }
});

// Recepção de mensagens
app.post("/webhook", async (req, res) => {
  console.log("Payload recebido:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body;

      let reply = "Bem-vindo! Digite:\n1 - Informações\n2 - Suporte\n3 - Atendente";

      if (text === "1") reply = "📄 Aqui estão as informações...";
      if (text === "2") reply = "🛠️ Suporte: descreva seu problema.";
      if (text === "3") reply = "👩‍💼 Um atendente falará com você em breve.";

      console.log(`Mensagem recebida de ${from}: ${text}`);
      console.log(`Resposta gerada: ${reply}`);

      // Envia a resposta para o WhatsApp via Graph API
      await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply },
        }),
      });
    }
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
  }

  return res.sendStatus(200);
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
