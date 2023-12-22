const router = require("express").Router();
const paypal = require("../paypal-api");

const {
  createOrder,
  capturePayment,
  generateAccessToken,
  generateClientToken,
} = paypal;

// render checkout page with client id & unique client token
router.get("/", async (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  try {
    const clientToken = await paypal.generateClientToken();
    res.render("checkout", { clientId, clientToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// create order
router.post("/payment/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// capture payment
router.post("/payment/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
