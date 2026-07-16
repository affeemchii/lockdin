import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // This runs after the order is saved to Gadget's database
  // We check if this order used a lockdIn selling plan
  // If yes, we tag it with "lockdin-deposit" in Shopify
  // This tag is how we identify lockdIn orders on the Orders page

  try {
    // Step 1: Get all lockdIn selling plan IDs from our depositRule records
    // These are the selling plan IDs we created via lockdIn
    const depositRules = await api.depositRule.findMany({
      filter: { shop: { id: { equals: record.shopId } } },
      select: { shopifySellingPlanId: true, depositType: true, depositValue: true },
    });

    if (!depositRules || depositRules.length === 0) {
      // No lockdIn selling plans exist for this shop yet
      return;
    }

    // Build a Set of our selling plan IDs for fast lookup
    // Shopify selling plan IDs in the REST webhook payload are numeric
    // e.g. "1234567890" not "gid://shopify/SellingPlan/1234567890"
    const lockdinPlanIds = new Set(
      depositRules.map((rule: any) => {
        // Extract numeric ID from GID if needed
        const id = rule.shopifySellingPlanId || "";
        return id.includes("/") ? id.split("/").pop() : id;
      })
    );

    // Step 2: Check the order's line items for selling plan allocations
    const shopify = connections.shopify.current;
    if (!shopify) return;

    // Fetch the order with line items from Shopify GraphQL API
    const numericOrderId = record.id;
    const orderGid = `gid://shopify/Order/${numericOrderId}`;
    const orderResponse = await shopify.graphql(`
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          lineItems(first: 50) {
            edges {
              node {
                sellingPlan {
                  sellingPlanId
                }
              }
            }
          }
        }
      }
    `, { id: orderGid });

    const orderData = orderResponse?.order;
    if (!orderData || !orderData.lineItems?.edges) {
      logger.warn({ orderGid }, "Could not fetch order line items via GraphQL");
      return;
    }

    // Step 3: Check if any line item has a lockdIn selling plan
    let isLockdinOrder = false;
    let matchedPlanId = null;

    for (const edge of orderData.lineItems.edges) {
      const sellingPlan = edge.node.sellingPlan;
      if (sellingPlan && sellingPlan.sellingPlanId) {
        const planId = sellingPlan.sellingPlanId.split("/").pop();
        if (lockdinPlanIds.has(planId)) {
          isLockdinOrder = true;
          matchedPlanId = planId;
          break;
        }
      }
    }

    if (!isLockdinOrder) {
      // This order did not use a lockdIn selling plan
      return;
    }

    logger.info(
      { orderId: numericOrderId, matchedPlanId },
      "lockdIn deposit order detected — tagging order"
    );

    // Step 4: Add lockdin-deposit tag to the order in Shopify
    // Update the order tags in Shopify using tagsAdd mutation
    await shopify.graphql(`
      mutation tagOrder($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          node {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: orderGid,
      tags: ["lockdin-deposit"],
    });

    logger.info(
      { orderId: numericOrderId },
      "Successfully tagged order as lockdin-deposit"
    );

  } catch (err: any) {
    // Log but do not throw — we do not want to fail the order save
    // just because our tagging logic had an error
    logger.error({ error: err.message }, "Error in lockdIn order tagging");
  }
};

export const options: ActionOptions = { actionType: "create" };
