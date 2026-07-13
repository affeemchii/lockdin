export default function Analytics() {
  return (
    <s-page heading="Analytics">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Metric Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <s-card>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>Secured Sales</p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#202223" }}>$0.00</h3>
              <p style={{ fontSize: "11px", color: "#4b8026", marginTop: "4px" }}>0% from previous period</p>
            </div>
          </s-card>
          
          <s-card>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>Deposit Orders</p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#202223" }}>0</h3>
              <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "4px" }}>0 plan activations</p>
            </div>
          </s-card>

          <s-card>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>Collection Rate</p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#202223" }}>100.0%</h3>
              <p style={{ fontSize: "11px", color: "#4b8026", marginTop: "4px" }}>All balances collected</p>
            </div>
          </s-card>
        </div>

        {/* Detailed reports */}
        <s-card>
          <div style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a", marginBottom: "12px" }}>Downpayment Performance Metrics</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e1e3e5", paddingBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#202223" }}>Checkout conversions</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#202223" }}>0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e1e3e5", paddingBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#202223" }}>Pay in full orders</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#202223" }}>0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                <span style={{ fontSize: "14px", color: "#202223" }}>Deposit-only orders</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#202223" }}>0</span>
              </div>
            </div>
          </div>
        </s-card>

        {/* Empty status chart placeholder */}
        <s-card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", textAlign: "center" }}>
            <div style={{ color: "#8c9196", marginBottom: "16px" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
                <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
                <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
              </svg>
            </div>
            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#202223", marginBottom: "4px" }}>No performance data found</h4>
            <p style={{ fontSize: "12px", color: "#6d7175", maxWidth: "320px" }}>
              This view is dedicated to tracking downpayment performance metrics. Once customers start placing orders using deposit options, you'll see conversion trends and fulfillment rates here.
            </p>
          </div>
        </s-card>

      </div>
    </s-page>
  );
}
