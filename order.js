const puppeteer = require('puppeteer');
const fs = require('fs');
const cookiesPath = "cookies.txt";

async function order(ids) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({width: 1000, height: 1080});
  const content = fs.readFileSync(cookiesPath);
  const cookiesArr = JSON.parse(content);
  for (let cookie of cookiesArr) {
    console.log('set cookie')
    await page.setCookie(cookie)
  }
  await page.goto('https://dodopizza.kz/astana');
  for (let id of ids) {
    console.log(`Processing product ${id}`);
    const productSelector = `[data-testid="menu__meta-product_${id}"]`;
    const productButton = await page.$(productSelector);
    if (!productButton) {
      console.log(`Product ${id} not found, skipping`);
      continue;
    }
    await page.click(`${productSelector} button`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const addToCartButton = await page.$('[data-testid="button_add_to_cart"]');
    if (addToCartButton) {
      await page.click('[data-testid="menu__pizza_size_25 см"]')
      await addToCartButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log(`Already in cart`);
    }
  }
  console.log('Cart button clicked');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await page.goto('https://dodopizza.kz/astana/checkout');
  await page.waitForSelector('[data-testid="checkout_order_button"]');
  const orderButton = await page.$('[data-testid="checkout_order_button"]');
  console.log({orderButton});
  await new Promise(resolve => setTimeout(resolve, 5000));
  await page.click('[data-testid="checkout_order_button"]');
}

module.exports = {
  order
}

// order(['11ef8a03b59fa3dfcb87a5f78d594eb0', '11ef36579b0519063d4fef960864c090']);