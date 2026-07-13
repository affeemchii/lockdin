import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <s-page heading="Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Banner: Theme extension block status */}
        <s-banner heading="Theme extension block [Inactive]" tone="warning">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
            <p>
              lockdIn theme extensions may not be enabled. Open the theme editor to ensure lockdIn is properly installed in your theme.
            </p>
            <s-link href="https://shopify.com/admin/themes/current/editor" target="_blank">
              <s-button variant="secondary">
                Open Theme Editor
              </s-button>
            </s-link>
          </div>
        </s-banner>

        {/* Top metrics bar */}
        <s-card>
          <div style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#1a1a1a" }}>Performance Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", textAlign: "center" }}>
              <div style={{ borderRight: "1px solid #e1e3e5", padding: "8px" }}>
                <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>Total lockdIn Sales</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#202223" }}>$0.00</p>
                <p style={{ fontSize: "10px", color: "#8c9196", marginTop: "4px" }}>Prior 7 days</p>
              </div>
              <div style={{ borderRight: "1px solid #e1e3e5", padding: "8px" }}>
                <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>Total lockdIn Orders</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#202223" }}>0</p>
                <p style={{ fontSize: "10px", color: "#8c9196", marginTop: "4px" }}>Prior 7 days</p>
              </div>
              <div style={{ padding: "8px" }}>
                <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>lockdIn AOV</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#202223" }}>$0.00</p>
                <p style={{ fontSize: "10px", color: "#8c9196", marginTop: "4px" }}>Prior 7 days</p>
              </div>
            </div>
          </div>
        </s-card>

        {/* Empty-state section */}
        <s-card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
            
            {/* Graphic illustration */}
            <div style={{ marginBottom: "20px", color: "#6d7175" }}>
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <rect x="30" y="38" width="40" height="30" rx="3" stroke="currentColor" strokeWidth="3" fill="none" />
                <path d="M40 38V30C40 24.4772 44.4772 20 50 20C55.5228 20 60 24.4772 60 30V38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="53" r="4" fill="currentColor" />
                <path d="M50 57V62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="25" cy="72" r="3" fill="#ff9900" />
                <circle cx="75" cy="72" r="3" fill="#ff9900" />
                <circle cx="50" cy="80" r="3" fill="#ff9900" />
              </svg>
            </div>

            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#202223", marginBottom: "8px" }}>
              Create your first purchase option
            </h2>
            
            <p style={{ fontSize: "14px", color: "#6d7175", maxWidth: "450px", marginBottom: "24px" }}>
              Now that you've completed initial setup, create a purchase option and choose which products to offer with a deposit.
            </p>

            {/* Warning banner inside empty state */}
            <div style={{ maxWidth: "500px", width: "100%", marginBottom: "24px" }}>
              <s-banner heading="New to lockdIn?" tone="warning">
                <p style={{ fontSize: "13px", color: "#4f5359", textAlign: "left" }}>
                  If you're new to lockdIn, we recommend starting with a test product and running through the full buying experience before going live.
                </p>
              </s-banner>
            </div>

            {/* Primary button navigation */}
            <s-link href="/app/create">
              <s-button variant="primary">Create purchase option</s-button>
            </s-link>
            
          </div>
        </s-card>

      </div>
    </s-page>
  );
}
