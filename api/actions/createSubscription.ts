import { ActionOptions } from "gadget-server";

// WHAT: This action creates a Shopify app subscription and returns
// a confirmationUrl that we redirect the merchant to.
//
// WHY: Shopify requires all billing to go through their system.
// We cannot charge merchants ourselves. Shopify shows them a
// payment approval page, then redirects back to us.
//
// HOW IT WORKS:
// 1. Merchant clicks "Upgrade to Pro"
// 2. Frontend calls this action
// 3. We call Shopify's appSubscriptionCreate mutation
// 4. Shopify returns a confirmationUrl
// 5. We return that URL to the frontend
// 6. Frontend redirects merchant to that URL
// 7. Merchant approves on Shopify's page
// 8. Shopify redirects back to our /app/billing/confirm route

export const run: ActionRun = async ({ api, connections, logger }) => {
    // Get the Shopify API client for this merchant's shop
    // connections.shopify.current gives us an authenticated
    // GraphQL client scoped to the currently logged-in shop
    const shopify = await connections.shopify.current;

    if (!shopify) {
        throw new Error("No Shopify connection found. Is the app installed?");
    }

    // This is the Shopify GraphQL mutation that creates a subscription.
    // appSubscriptionCreate tells Shopify:
    // - What the plan is called (shown on merchant's Shopify bill)
    // - How much to charge ($14.99/month)
    // - Where to redirect after approval (our confirm route)
    // - Whether it's a test charge (true in development)
    const result = await shopify.graphql(`
    mutation appSubscriptionCreate(
      $name: String!
      $lineItems: [AppSubscriptionLineItemInput!]!
      $returnUrl: String!
      $test: Boolean
    ) {
      appSubscriptionCreate(
        name: $name
        lineItems: $lineItems
        returnUrl: $returnUrl
        test: $test
      ) {
        appSubscription {
          id
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `, {
        // The plan name shown on the merchant's Shopify invoice
        name: "lockdIn Pro",

        lineItems: [{
            plan: {
                appRecurringPricingDetails: {
                    // The price in USD — Shopify handles currency conversion
                    price: { amount: 14.99, currencyCode: "USD" },
                    // EVERY_30_DAYS = monthly billing
                    interval: "EVERY_30_DAYS"
                }
            }
        }],

        // After merchant approves, Shopify sends them back here.
        // We read the charge_id from the URL and confirm it.
        // IMPORTANT: This must match your app's allowed redirect URLs
        // in the Shopify Partner Dashboard.
        returnUrl: `https://lockdin--development.gadget.app/billing/confirm`,

        // TRUE in development = test charge (no real money moves)
        // You MUST set this to false before going to production
        test: true
    });

    // Check for GraphQL-level errors (not HTTP errors)
    const { appSubscriptionCreate } = result;

    if (appSubscriptionCreate.userErrors?.length > 0) {
        const errorMessages = appSubscriptionCreate.userErrors
            .map((e: any) => e.message)
            .join(", ");
        throw new Error(`Shopify billing error: ${errorMessages}`);
    }

    // Return the confirmationUrl to the frontend.
    // The frontend will do: window.open(confirmationUrl, "_top")
    // _top is required for Shopify embedded apps to break out
    // of the iframe and show the Shopify billing page.
    return {
        confirmationUrl: appSubscriptionCreate.confirmationUrl,
        subscriptionId: appSubscriptionCreate.appSubscription.id
    };
};

// ActionOptions tells Gadget how to expose this action.
// We do NOT need a Shopify API trigger here — this is called
// directly from our frontend when merchant clicks Upgrade.
export const options: ActionOptions = {
    actionType: "custom",
    triggers: {
        api: true
    }
};