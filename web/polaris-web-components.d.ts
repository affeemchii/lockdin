import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-card": any;
      "s-app-nav": any;
      "s-page": any;
      "s-banner": any;
      "s-text-field": any;
      "s-choice-list": any;
      "s-choice": any;
      "s-checkbox": any;
      "s-button": any;
      "s-link": any;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "s-card": any;
      "s-app-nav": any;
      "s-page": any;
      "s-banner": any;
      "s-text-field": any;
      "s-choice-list": any;
      "s-choice": any;
      "s-checkbox": any;
      "s-button": any;
      "s-link": any;
    }
  }
}
