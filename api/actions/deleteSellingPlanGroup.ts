import { DeleteSellingPlanGroupGlobalActionContext } from "gadget-server";

export const params = {
  sellingPlanGroupId: { type: "string" },
  depositRuleId: { type: "string" },
};

export const run = async ({ params, logger, connections, api }: DeleteSellingPlanGroupGlobalActionContext) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  const { sellingPlanGroupId, depositRuleId } = params as any;

  const mutation = `
    mutation deleteSellingPlanGroup($id: ID!) {
      sellingPlanGroupDelete(id: $id) {
        deletedSellingPlanGroupId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await shopify.graphql(mutation, { id: sellingPlanGroupId });

  if (result.sellingPlanGroupDelete.userErrors?.length > 0) {
    const errors = result.sellingPlanGroupDelete.userErrors
      .map((e: any) => `${e.field}: ${e.message}`)
      .join(", ");
    throw new Error(`Shopify delete errors: ${errors}`);
  }

  if (depositRuleId) {
    await api.depositRule.delete(depositRuleId);
  }

  logger.info({ sellingPlanGroupId }, "Selling plan group deleted successfully");

  return {
    success: true,
    deletedId: sellingPlanGroupId,
  };
};
