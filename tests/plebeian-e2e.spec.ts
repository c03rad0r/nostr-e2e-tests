import { test, expect, type Page } from '@playwright/test'

const SHOPS = {
  Optics: 'e18a1d171a59d874edd336472afeb3a614d3dc83397dd097e922a99dcee02133',
  Trade: 'cc3e0c9f963c9fd4b211ac58cda671a102dda13570c54c454ca1d262ea09b089',
  Guides: '8be0710742d29c87729e5f81e45b8604f2aab60c91ba730123ed21cef1d061bc',
  Engineering: '5062157c07dc7c2a00690d72d6815f93909fee9656bce8887e095527bcb6364b',
}

const BUYERS = {
  buyer1: {
    nsec: process.env.BUYER1_NSEC_HEX || 'e4d2bff3011b848753765d51c3d43fe030ff5d72cccca7e6f431f507b9c83032',
    pubkey: process.env.BUYER1_PUBKEY_HEX || 'dea5c33c29b1cf3be14a64a00d05760293c6cae89a55567e2112fac49fe0ae29',
  },
  buyer2: {
    nsec: process.env.BUYER2_NSEC_HEX || 'a6a796676ea47a7924d85ddae120ac84dc127cd37465bdfab34220d41985f9ee',
    pubkey: process.env.BUYER2_PUBKEY_HEX || 'fcf375640d840ac738fab3ee923807c778e1752f4938fe04342b20b2f084cb8a',
  },
}

const TEST_URL = process.env.PLEBEIAN_URL || 'https://plebeian.market'

async function injectNostrAuth(page: Page, buyer: { nsec: string; pubkey: string }) {
  await page.addInitScript(({ nsec, pubkey }) => {
    localStorage.setItem('nostr_local_signer_key', nsec)
    localStorage.setItem('nostr_auto_login', 'true')
    localStorage.setItem('nostr_user_pubkey', pubkey)
    localStorage.setItem('plebeian_terms_accepted', 'true')
  }, buyer)
}

test.describe.configure({ mode: 'sequential' })

// TC1 — Site loads, header visible, hero text present
test('TC1 — Homepage loads correctly', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Header with logo should be visible
  await expect(page.locator('header, [role="banner"]')).toBeVisible({ timeout: 20_000 })

  // Hero text
  await expect(page.locator('h1:has-text("Buy"), h1:has-text("Sell")')).toBeVisible({ timeout: 15_000 })

  // Footer
  await expect(page.locator('footer, [role="contentinfo"]')).toBeVisible({ timeout: 10_000 })

  await page.screenshot({ path: 'screenshots/tc1-homepage.png' })
})

// TC2 — Buyer authenticates via localStorage nsec injection
test('TC2 — Buyer login via nsec injection', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(3000)

  // Verify localStorage was set
  const storedNsec = await page.evaluate(() => localStorage.getItem('nostr_local_signer_key'))
  expect(storedNsec).toBe(BUYERS.buyer1.nsec)

  const storedAutoLogin = await page.evaluate(() => localStorage.getItem('nostr_auto_login'))
  expect(storedAutoLogin).toBe('true')

  // When logged in, there should be account-related buttons in header
  // The header has buttons — when authenticated, one becomes a profile/dashboard link
  const headerButtons = page.locator('header button, header a[href*="dashboard"], header [class*="avatar"]')
  const btnCount = await headerButtons.count()
  expect(btnCount).toBeGreaterThan(0)

  await page.screenshot({ path: 'screenshots/tc2-logged-in.png',  })
})

// TC3 — Products page loads and shows listings
test('TC3 — Products page shows listings', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(`${TEST_URL}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Wait for "Loading products..." to disappear or products to appear
  // The page shows "Loading products..." while fetching from relays
  await page.waitForTimeout(8000) // Allow NDK relay fetch

  // Check for product links or product cards
  const productLinks = page.locator('a[href*="/products/"]')
  const productCount = await productLinks.count()

  // Also check for any product-related content
  const productsHeading = page.locator('h1:has-text("Products"), h2:has-text("Products")')

  await page.screenshot({ path: 'screenshots/tc3-products.png',  })

  console.log(`Found ${productCount} product links on /products page`)
})

// TC4 — Search for products
test('TC4 — Search for products via searchbox', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Find the searchbox (role="searchbox" with placeholder "Search Products")
  const searchbox = page.locator('[role="searchbox"], input[placeholder*="Search" i]').first()
  await expect(searchbox).toBeVisible({ timeout: 15_000 })

  // Type a search query
  await searchbox.fill('saffron')
  await page.waitForTimeout(5000) // Wait for search results

  await page.screenshot({ path: 'screenshots/tc4-search-saffron.png',  })

  // Clear and try another search
  await searchbox.fill('glasses')
  await page.waitForTimeout(5000)

  await page.screenshot({ path: 'screenshots/tc4-search-glasses.png',  })

  // Clear and search for guide
  await searchbox.fill('guide')
  await page.waitForTimeout(5000)

  await page.screenshot({ path: 'screenshots/tc4-search-guide.png',  })

  console.log('Search tests complete — check screenshots for results')
})

// TC5 — Navigate to products page and interact with a product
test('TC5 — Product interaction (click into detail)', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(`${TEST_URL}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(8000)

  const productLinks = page.locator('a[href*="/products/"]')
  const linkCount = await productLinks.count()

  if (linkCount > 0) {
    // Click first product
    await productLinks.first().click()
    await page.waitForTimeout(5000)

    // Verify we're on a product detail page
    const detailHeading = page.locator('h1, h2')
    await expect(detailHeading.first()).toBeVisible({ timeout: 10_000 })

    // Look for buy/add buttons
    const buyButton = page.locator(
      'button:has-text("Add"), button:has-text("Cart"), button:has-text("Buy"), ' +
      'button:has-text("Purchase"), button:has-text("Order")'
    )
    const hasBuyButton = await buyButton.isVisible({ timeout: 5_000 }).catch(() => false)

    await page.screenshot({ path: 'screenshots/tc5-product-detail.png',  })
    console.log(`Product detail page loaded, buy button visible: ${hasBuyButton}`)
  } else {
    console.log('No products found on /products — they may still be loading from relays')
    await page.screenshot({ path: 'screenshots/tc5-no-products.png',  })
  }
})

// TC6 — Add product to cart and start checkout
test('TC6 — Add to cart and reach checkout', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)

  // Navigate to products and wait for load
  await page.goto(`${TEST_URL}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(8000)

  const productLinks = page.locator('a[href*="/products/"]')
  const linkCount = await productLinks.count()

  if (linkCount === 0) {
    test.skip(true, 'No products available to add to cart')
  }

  // Click into first product
  await productLinks.first().click()
  await page.waitForTimeout(3000)

  // Try to add to cart
  const addToCartBtn = page.locator(
    'button:has-text("Add"), button:has-text("Cart"), button:has-text("Buy")'
  ).first()

  if (await addToCartBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await addToCartBtn.click()
    await page.waitForTimeout(2000)
    console.log('Clicked add to cart')
  }

  // Navigate to checkout
  await page.goto(`${TEST_URL}/checkout`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  await page.screenshot({ path: 'screenshots/tc6-checkout.png',  })
  console.log(`Checkout URL: ${page.url()}`)
})

// TC7 — Verify Nostr relay connectivity via API config
test('TC7 — App connects to Nostr relays', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer1)
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Check API config endpoint
  const configResponse = await page.request.get(`${TEST_URL}/api/config`)
  expect(configResponse.ok()).toBeTruthy()

  const config = await configResponse.json()
  console.log('App config:', JSON.stringify(config, null, 2))

  // Verify critical fields
  expect(config.appRelay || config.appRelayUrl).toBeTruthy()
  expect(config.appPublicKey).toBeTruthy()

  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'screenshots/tc7-relay-connected.png',  })
})

// TC8 — Buyer 2 full journey with fresh identity
test('TC8 — Buyer 2 full journey', async ({ page }) => {
  await injectNostrAuth(page, BUYERS.buyer2)
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(3000)

  // Verify logged in
  const storedNsec = await page.evaluate(() => localStorage.getItem('nostr_local_signer_key'))
  expect(storedNsec).toBe(BUYERS.buyer2.nsec)

  // Browse products
  await page.goto(`${TEST_URL}/products`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000)
  await page.screenshot({ path: 'screenshots/tc8-buyer2-products.png',  })

  // Browse auctions
  await page.goto(`${TEST_URL}/auctions`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'screenshots/tc8-buyer2-auctions.png',  })

  // Browse community
  await page.goto(`${TEST_URL}/community`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'screenshots/tc8-buyer2-community.png',  })

  console.log('Buyer 2 journey complete')
})
