import { useState, useEffect } from "react";
import { api } from "../api";
import { useBilling } from "../hooks/useBilling";
import { UpgradeModal } from "../components/UpgradeModal";

export default function OrdersPage() {

  // BILLING — check order limit on mount
  const { billing, startUpgrade } = useBilling();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // orders: array of deposit orders fetched from Shopify
  const [orders, setOrders] = useState<any[]>([]);

  // loading: true while fetching orders
  const [loading, setLoading] = useState(true);

  // error: any error message to display
  const [error, setError] = useState<string | null>(null);

  // collectingId: the order ID currently being marked as collected
  // used to show loading state on the specific button
  const [collectingId, setCollectingId] = useState<string | null>(null);

  // Fetch all deposit orders when page loads
  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getDepositOrders();
      setOrders(result.orders || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  // Called before allowing a new deposit order to be processed.
  // If free merchant has hit 25 orders this month, show upgrade modal.
  function checkOrderLimit(): boolean {
    if (billing?.isOrderLimitHit) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }

  // Called when merchant clicks "Mark as Collected" on an order
  async function handleMarkCollected(order: any) {
    setCollectingId(order.id);
    try {
      await api.markBalanceCollected({
        orderId: order.gadgetId,
        orderTags: JSON.stringify(order.tags),
        remainingBalance: order.remainingBalance,
        currencyCode: order.currencyCode,
      });
      // Refresh orders list to show updated status
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || "Failed to mark balance as collected");
    } finally {
      setCollectingId(null);
    }
  }

  // Format a number as currency string
  function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  }

  // Format ISO date string to readable date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Get status badge color based on financial status
  function getStatusColor(status: string, balanceCollected: boolean) {
    if (balanceCollected) return "#1a7f37";
    if (status === "PAID") return "#1a7f37";
    if (status === "PARTIALLY_PAID") return "#b54708";
    return "#6d7175";
  }

  // Get status label to show merchant
  function getStatusLabel(status: string, balanceCollected: boolean) {
    if (balanceCollected) return "Balance Collected";
    if (status === "PARTIALLY_PAID") return "Deposit Paid — COD Pending";
    if (status === "PAID") return "Fully Paid";
    return status;
  }

  return (
    <s-page heading="Deposit Orders">
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="You've reached your monthly order limit"
        message="You've used all 25 deposit orders on the free plan this month. Upgrade to Pro for unlimited orders."
        limitType="orders"
        billing={billing}
        startUpgrade={startUpgrade}
      />

      <div style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#6d7175" }}>
        Orders where customers paid a deposit. Mark balance as collected after receiving COD payment.
      </div>

      {/* Order limit warning banner — shown when approaching or at limit */}
      {!billing?.isPro && billing && billing.monthlyOrderCount >= billing.FREE_ORDER_LIMIT * 0.8 && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: billing.isOrderLimitHit ? "#fff4f4" : "#fff4e5",
          border: `1px solid ${billing.isOrderLimitHit ? "#d82c0d" : "#ffc453"}`,
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "13px", color: billing.isOrderLimitHit ? "#d82c0d" : "#916a00" }}>
            {billing.isOrderLimitHit
              ? `You have reached your limit of ${billing.FREE_ORDER_LIMIT} deposit orders this month.`
              : `You have used ${billing.monthlyOrderCount} of ${billing.FREE_ORDER_LIMIT} free deposit orders this month.`
            }
          </span>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#202223",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginLeft: "12px",
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <s-banner tone="critical" style={{ marginBottom: "16px" }}>
          {error}
        </s-banner>
      )}

      {/* Loading state */}
      {loading && (
        <s-card>
          <div style={{ padding: "40px", textAlign: "center", color: "#6d7175" }}>
            Loading orders...
          </div>
        </s-card>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <s-card>
          <div style={{ padding: "60px 40px", textAlign: "center" }}>
            <div style={{
              fontSize: "40px",
              marginBottom: "16px"
            }}>📦</div>
            <div style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#202223",
              marginBottom: "8px"
            }}>
              No deposit orders yet
            </div>
            <div style={{ fontSize: "14px", color: "#6d7175" }}>
              When customers place orders using your deposit purchase options, they will appear here.
            </div>
          </div>
        </s-card>
      )}

      {/* Orders list */}
      {!loading && orders.length > 0 && (
        <s-card>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1.5fr 1fr",
            gap: "12px",
            padding: "12px 16px",
            borderBottom: "1px solid #e1e3e5",
            fontSize: "12px",
            fontWeight: "600",
            color: "#6d7175",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            <div>Order</div>
            <div>Customer</div>
            <div>Date</div>
            <div>Deposit Paid</div>
            <div>Balance Due</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {/* Order rows */}
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1.5fr 1fr",
                gap: "12px",
                padding: "16px",
                borderBottom: "1px solid #f1f2f3",
                alignItems: "center",
                fontSize: "14px",
              }}
            >
              {/* Order number */}
              <div style={{ fontWeight: "600", color: "#202223" }}>
                {order.orderNumber}
              </div>

              {/* Customer info */}
              <div>
                <div style={{ fontWeight: "500", color: "#202223" }}>
                  {order.customerName}
                </div>
                <div style={{ fontSize: "12px", color: "#6d7175" }}>
                  {order.customerEmail}
                </div>
              </div>

              {/* Date */}
              <div style={{ color: "#6d7175" }}>
                {formatDate(order.createdAt)}
              </div>

              {/* Deposit amount paid */}
              <div style={{ fontWeight: "600", color: "#1a7f37" }}>
                {formatMoney(order.totalReceived, order.currencyCode)}
              </div>

              {/* Remaining balance */}
              <div style={{
                fontWeight: "600",
                color: order.balanceCollected ? "#6d7175" : "#b54708"
              }}>
                {order.balanceCollected
                  ? "—"
                  : formatMoney(order.remainingBalance, order.currencyCode)
                }
              </div>

              {/* Status badge */}
              <div>
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: getStatusColor(order.financialStatus, order.balanceCollected) + "20",
                  color: getStatusColor(order.financialStatus, order.balanceCollected),
                }}>
                  {getStatusLabel(order.financialStatus, order.balanceCollected)}
                </span>
              </div>

              {/* Action button */}
              <div>
                {!order.balanceCollected && order.remainingBalance > 0 ? (
                  <button
                    onClick={() => handleMarkCollected(order)}
                    disabled={collectingId === order.id}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: collectingId === order.id ? "#e1e3e5" : "#202223",
                      color: collectingId === order.id ? "#6d7175" : "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: collectingId === order.id ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {collectingId === order.id ? "Saving..." : "Mark Collected"}
                  </button>
                ) : (
                  <span style={{ fontSize: "12px", color: "#6d7175" }}>
                    ✓ Done
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Footer summary */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #e1e3e5",
            fontSize: "13px",
            color: "#6d7175",
          }}>
            {orders.length} deposit order{orders.length !== 1 ? "s" : ""} found
            {" · "}
            {orders.filter(o => !o.balanceCollected && o.remainingBalance > 0).length} pending COD collection
          </div>
        </s-card>
      )}
    </s-page>
  );
}
