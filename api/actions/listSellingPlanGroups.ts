import { ListSellingPlanGroupsGlobalActionContext } from "gadget-server";

export const params = {};

export const run = async ({ logger, connections }: ListSellingPlanGroupsGlobalActionContext) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  const query = `
    query listSellingPlanGroups {
      sellingPlanGroups(first: 50) {
        edges {
          node {
            id
            name
            merchantCode
            createdAt
            sellingPlans(first: 1) {
              edges {
                node {
                  id
                  name
                  billingPolicy {
                    ... on SellingPlanFixedBillingPolicy {
                      remainingBalanceChargeTrigger
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

  const result = await shopify.graphql(query);

  const plans = result.sellingPlanGroups.edges
    .filter((edge: any) => 
      edge.node.merchantCode?.startsWith("lockdin-upfront-deposit")
    )
    .map((edge: any) => {
      const node = edge.node;
      const plan = node.sellingPlans.edges[0]?.node;
      const billing = plan?.billingPolicy;
      
      return {
        id: node.id,
        name: node.name,
        merchantCode: node.merchantCode,
        createdAt: node.createdAt,
        sellingPlanId: plan?.id,
        depositType: billing?.checkoutCharge?.type === "PERCENTAGE" ? "percentage" : "exact_amount",
        depositValue: billing?.checkoutCharge?.value?.percentage || billing?.checkoutCharge?.value?.amount || 0,
        balanceDueTrigger: billing?.remainingBalanceChargeTrigger,
      };
    });

  logger.info({ count: plans.length }, "Listed selling plan groups");

  return { plans };
};
