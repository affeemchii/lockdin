import { CreateSellingPlanGroupGlobalActionContext } from "gadget-server";

export const params = {
  name: { type: "string" },
  lineItemHelpText: { type: "string" },
  allocationType: { type: "string" }, // "products" | "variants" | "tags" | "whole_store"
  selectedProducts: { type: "string" }, // JSON stringified Array<{ id: string, title: string }>
  selectedVariants: { type: "string" }, // JSON stringified Array<{ id: string, title: string, productTitle?: string }>
  productTags: { type: "string" },
  excludedProducts: { type: "string" }, // JSON stringified Array<{ id: string, title: string }>
  depositType: { type: "string" }, // "percentage" | "exact_amount"
  depositValue: { type: "number" },
  payInFull: { type: "boolean" },
  displaySettings: { type: "string" }, // "always" | "out_of_stock"
  paymentCollection: { type: "string" }, // "manual"
  balanceDueTrigger: { type: "string" }, // "fulfillment" | "days" | "date"
  balanceDueDays: { type: "number" },
  balanceDueDate: { type: "string" }
};

export const run = async ({ params, logger, connections }: CreateSellingPlanGroupGlobalActionContext) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found or user is unauthenticated");
  }

  const {
    name,
    lineItemHelpText,
    allocationType,
    selectedProducts: selectedProductsRaw,
    selectedVariants: selectedVariantsRaw,
    productTags,
    excludedProducts: excludedProductsRaw,
    depositType,
    depositValue,
    payInFull,
    displaySettings,
    paymentCollection,
    balanceDueTrigger,
    balanceDueDays,
    balanceDueDate
  } = params as any;

  // Safe parsing helper
  const safeJsonParse = (raw: string | undefined): any[] => {
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const selectedProducts = safeJsonParse(selectedProductsRaw);
  const selectedVariants = safeJsonParse(selectedVariantsRaw);
  const excludedProducts = safeJsonParse(excludedProductsRaw);

  let productIds: string[] = [];
  let productVariantIds: string[] = [];

  // Resolve resources to attach the selling plan to
  if (allocationType === "products") {
    productIds = selectedProducts.map((p: any) => p.id);
  } else if (allocationType === "variants") {
    productVariantIds = selectedVariants.map((v: any) => v.id);
  } else if (allocationType === "tags" && productTags) {
    const tags = productTags.split(",").map((t: string) => `tag:${t.trim()}`).join(" OR ");
    logger.info({ tags }, "Querying products by tags");
    
    const response = await shopify.graphql(`
      query getProductsByTag($query: String!) {
        products(first: 250, query: $query) {
          edges {
            node {
              id
            }
          }
        }
      }
    `, { query: tags });
    
    productIds = response.products.edges.map((edge: any) => edge.node.id);
  } else if (allocationType === "whole_store") {
    logger.info("Querying all products for whole-store application");
    const response = await shopify.graphql(`
      query getAllProducts {
        products(first: 250) {
          edges {
            node {
              id
            }
          }
        }
      }
    `);
    
    const excludedIds = new Set(excludedProducts.map((p: any) => p.id));
    productIds = response.products.edges
      .map((edge: any) => edge.node.id)
      .filter((id: string) => !excludedIds.has(id));
  }

  // Construct billing policy
  const chargeValue: any = {};
  if (depositType === "percentage") {
    chargeValue.percentage = Number(depositValue);
  } else {
    chargeValue.fixedValue = Number(depositValue);
  }

  const billingPolicy: any = {
    fixed: {
      checkoutCharge: {
        type: depositType === "percentage" ? "PERCENTAGE" : "PRICE",
        value: chargeValue
      },
      remainingBalanceChargeTrigger: "ON_FULFILLMENT" // default fallback
    }
  };

  if (balanceDueTrigger === "days") {
    billingPolicy.fixed.remainingBalanceChargeTrigger = "TIME_AFTER_CHECKOUT";
    billingPolicy.fixed.remainingBalanceChargeTimeAfterCheckout = `P${balanceDueDays ?? 0}D`;
  } else if (balanceDueTrigger === "date") {
    billingPolicy.fixed.remainingBalanceChargeTrigger = "EXACT_TIME";
    billingPolicy.fixed.remainingBalanceChargeExactTime = new Date(balanceDueDate).toISOString();
  } else {
    billingPolicy.fixed.remainingBalanceChargeTrigger = "ON_FULFILLMENT";
  }

  const mutation = `
    mutation createDepositSellingPlanGroup($input: SellingPlanGroupInput!, $resources: SellingPlanGroupResourceInput) {
      sellingPlanGroupCreate(input: $input, resources: $resources) {
        sellingPlanGroup {
          id
          sellingPlans(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    name: name,
    merchantCode: `lockdin-upfront-deposit-${Date.now()}`,
    options: ["Deposit Option"],
    sellingPlansToCreate: [
      {
        name: name,
        options: lineItemHelpText || "Deposit only due at checkout",
        category: "TRY_BEFORE_YOU_BUY",
        billingPolicy: billingPolicy,
        inventoryPolicy: {
          reserve: "ON_SALE"
        },
        deliveryPolicy: {
          fixed: {
            fulfillmentTrigger: "ASAP"
          }
        }
      }
    ]
  };

  const resources = {
    productIds,
    productVariantIds
  };

  logger.info({ input, resources }, "Executing sellingPlanGroupCreate mutation");

  const result = await shopify.graphql(mutation, { input, resources });

  if (result.sellingPlanGroupCreate.userErrors && result.sellingPlanGroupCreate.userErrors.length > 0) {
    const errors = result.sellingPlanGroupCreate.userErrors
      .map((e: any) => `${e.field.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Shopify UserErrors: ${errors}`);
  }

  const sellingPlanGroup = result.sellingPlanGroupCreate.sellingPlanGroup;
  return {
    success: true,
    sellingPlanGroupId: sellingPlanGroup.id,
    sellingPlanId: sellingPlanGroup.sellingPlans.edges[0]?.node?.id
  };
};
