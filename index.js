const express = require("express");
const app = express();
const OpenAi = require("openai");
require("dotenv").config();
const { order } = require("./order");

const port = 3003;

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const requestedItems = []
let requesting = false

app.post("/", async (req, res) => {
  console.log(req.body, req.query);
  const { session, version, request } = req.body;
  if (session.message_id === 0) {
    requesting = true
    return res.send({
      response: {
        text: "Хорошо! Какую пиццу вы хотите заказать?",
        tts: "Хорошо! Какую пиццу вы хотите заказать?",
      },
      version: version,
      session: session,
    });
  }

  const { command } = request;

  if (requesting) {
    const availableProducts = require("./products.json");
    const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Вы - полезный ассистент, который может отвечать на вопросы и помогать с задачами.
  Вам предоставлен список продуктов и запрос для поиска продукта, соответствующего запросу.
  Вам нужно вернуть идентификаторы продуктов в формате JSON следующим образом:
  {
    "productIds": ["id1", "id2", "id3"]
  }
  Доступные продукты:
  ${JSON.stringify(
    availableProducts
      .map((item) => `ID: ${item.id} - Название: ${item.name} - Цена: ${item.price}`)
      .join("\n")
  )}`,
        },
        {
          role: "user",
          content: `Запрос пользователя: ${command}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const productIds = JSON.parse(response.choices[0].message.content);
    const products = availableProducts.filter((item) =>
      productIds.productIds.includes(item.id)
    );
    requestedItems.push(...products);
    requesting = false
    return res.send({
      response: {
        text: `Вы хотите заказать ${products
          .map((item) => item.name)
          .join(", ")}?`,
        tts: `Вы хотите заказать ${products
          .map((item) => item.name)
          .join(", ")}?`,
      },
      version: version,
      session: session,
    });
  }

  if (command.toLowerCase() === 'да' && requestedItems.length > 0) {
    order(requestedItems.map((item) => item.id))
    return res.send({
      response: {
        text: `Заказываем ${requestedItems.map((item) => item.name).join(", ")}`,
        tts: `Заказываем ${requestedItems.map((item) => item.name).join(", ")}`,
      },
      version: version,
      session: session,
    });
  }

  return res.send({
    response: {
      text: `Я не поняла вас`,
      tts: `Я не поняла вас`,
    },
    version: version,
    session: session,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
