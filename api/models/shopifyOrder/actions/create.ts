import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    // Log the full params and record so we can see what data
    // Gadget gives us from the webhook payload
    logger.info({ 
      recordId: record.id,
      recordKeys: Object.keys(record),
      paramsKeys: Object.keys(params || {}),
      recordTags: record.tags,
      recordFinancialStatus: record.financialStatus,
    }, "shopifyOrder create - inspecting available data");

  } catch (err: any) {
    logger.error({ error: err.message }, "Error in lockdIn order tagging");
  }
};

export const options: ActionOptions = { actionType: "create" };
