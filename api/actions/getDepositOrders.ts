import { GetDepositOrdersGlobalActionContext } from "gadget-server";

export const params = {};

export const run = async ({ logger, connections }: GetDepositOrdersGlobalActionContext) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  // Step 1: Get all lockdIn selling plan IDs from Shopify
  // We need these to filter orders that used our selling plans
  const plansQuery = `
    query listLockdinPlans {
      sellingPlanGroups(first: 50) {
        edges {
          node {
            id
            name
            merchantCode
            sellingPlans(first: 5) {
              edges {
                node {
                  id
                  name
                  billingPolicy {
                    ... on SellingPlanFixedBillingPolicy {
                      checkoutCharge {
                        type
                        value {
                          ... on SellingPlanCheckoutChargePercentageValue {
                            percentage
                          }
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const plansResult = await shopify.graphql(plansQuery);

  // Filter only lockdIn selling plan groups
  const lockdinGroups = plansResult.sellingPlanGroups.edges.filter(
    (edge: any) =>
      edge.node.merchantCode?.startsWith("lockdin-upfront-deposit")
  );

  // Build a map of sellingPlanId -> deposit info
  // so we can look up deposit details when we find orders
  const sellingPlanMap: Record<string, any> = {};
  for (const edge of lockdinGroups) {
    for (const planEdge of edge.node.sellingPlans.edges) {
      const plan = planEdge.node;
      const billing = plan.billingPolicy;
      sellingPlanMap[plan.id] = {
        planName: plan.name,
        groupName: edge.node.name,
        depositType:
          billing?.checkoutCharge?.type === "PERCENTAGE"
            ? "percentage"
            : "exact_amount",
        depositValue:
          billing?.checkoutCharge?.value?.percentage ||
          billing?.checkoutCharge?.value?.amount ||
          0,
      };
    }
  }

  // If no lockdIn plans exist yet return empty
  if (Object.keys(sellingPlanMap).length === 0) {
    logger.info("No lockdIn selling plans found");
    return { orders: [] };
  }

  // Step 2: Query recent orders and find ones with lockdIn selling plans
  // We look at the last 250 orders for now
  // Note: customer fields (email, phone, displayName) are removed
  // because Shopify blocks the entire query if any protected customer
  // data fields are requested and the app does not have Protected
  // Customer Data approval from Shopify.
  // In production after App Store approval, customer fields can be
  // added back.
  const ordersQuery = `
    query getOrders {
      orders(first: 250, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalReceivedSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            tags
            note
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  sellingPlan {
                    sellingPlanId
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const ordersResult = await shopify.graphql(ordersQuery);

  // Log the full result so we can see what Shopify returned
  logger.info({ ordersResult: JSON.stringify(ordersResult) }, "Raw orders query result");

  // Guard against null orders response
  if (!ordersResult || !ordersResult.orders || !ordersResult.orders.edges) {
    logger.warn({ ordersResult: JSON.stringify(ordersResult) }, "Orders query returned null or unexpected shape");
    return { orders: [], scopeError: true };
  }

  // Step 3: Filter orders that have at least one line item 
  // with a lockdIn selling plan
  const depositOrders = [];

  for (const edge of ordersResult.orders.edges) {
    const order = edge.node;
    let hasLockdinPlan = false;
    let depositInfo: any = null;
    let depositLineItemPrice = 0;

    for (const lineEdge of order.lineItems.edges) {
      const lineItem = lineEdge.node;
      const sellingPlan = lineItem.sellingPlan;

      if (sellingPlan && sellingPlanMap[sellingPlan.sellingPlanId]) {
        hasLockdinPlan = true;
        depositInfo = sellingPlanMap[sellingPlan.sellingPlanId];
        depositLineItemPrice =
          parseFloat(lineItem.originalUnitPriceSet.shopMoney.amount) *
          lineItem.quantity;
        break;
      }
    }

    if (!hasLockdinPlan) continue;

    // Calculate deposit amount and remaining balance
    const totalPrice = parseFloat(order.totalPriceSet.shopMoney.amount);
    const totalReceived = parseFloat(order.totalReceivedSet.shopMoney.amount);
    const currencyCode = order.totalPriceSet.shopMoney.currencyCode;

    let depositAmount = 0;
    if (depositInfo.depositType === "percentage") {
      depositAmount = (depositLineItemPrice * depositInfo.depositValue) / 100;
    } else {
      depositAmount = depositInfo.depositValue;
    }

    const remainingBalance = totalPrice - totalReceived;

    // Check if merchant already marked balance as collected
    // We store this as a tag on the order: lockdin-balance-collected
    const balanceCollected = order.tags.includes("lockdin-balance-collected");

    depositOrders.push({
      id: order.id,
      orderNumber: order.name,
      createdAt: order.createdAt,
      customerName: "—",
      customerEmail: "",
      customerPhone: "",
      financialStatus: order.displayFinancialStatus,
      totalPrice: totalPrice,
      depositAmount: depositAmount,
      totalReceived: totalReceived,
      remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      currencyCode: currencyCode,
      planName: depositInfo.planName,
      balanceCollected: balanceCollected,
      tags: order.tags,
    });
  }

  logger.info({ count: depositOrders.length }, "Found lockdIn deposit orders");

  return { orders: depositOrders };
};
