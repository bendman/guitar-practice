/// <reference types="vite/client" />

declare const __BUILD_TIME__: string;

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.css" {
  const css: string;
  export default css;
}
