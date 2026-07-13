/*
NOTE ABOUT TYPES
- There is a known issue with Polaris web component types - https://community.shopify.dev/t/missing-app-bridge-type-declarations-for-s-app-nav/26478
- The `<s-app-nav>` JSX component has broken types when used in React 19 with @shopify/polaris-types v1.0.1
- The actual component works properly as documented - https://shopify.dev/docs/api/app-home/app-bridge-web-components/app-nav
*/

export function NavMenu() {
  return (
    <>
      <s-app-nav>
        <s-link href="/app">Dashboard</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/integrations">Integrations</s-link>
      </s-app-nav>
    </>
  );
}
