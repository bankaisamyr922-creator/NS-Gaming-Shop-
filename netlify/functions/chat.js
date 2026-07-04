const SYSTEM_PROMPT = `Tu es l'assistant client du site "NS Gaming Shop", qui vend des recharges de jeux mobiles, des abonnements streaming et des cartes cadeaux en Haïti. Réponds toujours en français, de façon brève, chaleureuse et précise.

Catalogue (prix en HTG) :
Free Fire (Diamants) : 100=200, 310=520, 520=850, 1080=1700
PUBG Mobile (UC) : 60=200, 325=800, 660=1600
Mobile Legends (Diamants) : 86=350, 172=650, 429=1450
Call of Duty Mobile (CP) : 80=200, 420=800
Netflix (1 mois) : Basique=900, Standard=1450, Premium=2000
Disney+ (1 mois) : Standard=800
Spotify Premium (1 mois) : Individuel=650
Google Play (carte cadeau) : $10=1300, $25=3250, $50=6500
iTunes (carte cadeau) : $10=1300, $25=3250
Steam Wallet (carte cadeau) : $10=1300, $20=2600

Paiement accepté : MonCash (36 81 10 78) et NatCash (35 47 26 16), au nom d'Alix Murielle.
Livraison : après validation manuelle du paiement (référence de transaction), généralement sous quelques minutes à quelques heures.
Contact humain : WhatsApp +509 38 22 3773.

N'invente pas de prix ou produits hors de ce catalogue. Si une question dépasse tes informations, invite poliment le client à contacter le WhatsApp.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." }),
    };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "messages manquant ou invalide." }) };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.text })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data }) };
    }

    const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text);
    const reply = textBlocks.join("\n") || "Désolé, je n'ai pas pu répondre.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
