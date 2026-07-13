export default function Integrations() {
  return (
    <s-page heading="Integrations">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
        
        {/* Card 1: Shopify Flow */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Shopify Flow Extension</h3>
              <span style={{ backgroundColor: "#e2f1e5", color: "#165a29", fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px" }}>Active</span>
            </div>
            
            <p style={{ fontSize: "13px", color: "#6d7175" }}>
              Use the <strong>Downpay: Collect balance payment</strong> action inside Shopify Flow to charge the customer's card on file when order milestones are met.
            </p>
            
            <div style={{ marginTop: "4px" }}>
              <s-link href="https://shopify.com/admin/flow" target="_blank">
                <s-button variant="secondary">Open Shopify Flow</s-button>
              </s-link>
            </div>
          </div>
        </s-card>

        {/* Card 2: Custom Developer Actions */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Developer Webhooks & API</h3>
            
            <p style={{ fontSize: "13px", color: "#6d7175" }}>
              Listen to events like <code>deposits.secured</code>, <code>balances.due</code>, and <code>payments.collected</code> via developer webhooks to synchronize with external ERPs or accounting software.
            </p>

            <div style={{ marginTop: "4px" }}>
              <s-button variant="secondary" onClick={() => window.shopify?.toast.show("Custom webhook endpoints feature is coming soon")}>
                Configure Webhooks
              </s-button>
            </div>
          </div>
        </s-card>

      </div>
    </s-page>
  );
}
