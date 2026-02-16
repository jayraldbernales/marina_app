declare module "react-resizable-panels" {
  import * as React from "react";

  export const PanelGroup: React.ComponentType<any>;
  export const Panel: React.ComponentType<any>;
  export const PanelResizeHandle: React.ComponentType<any>;

  export type PanelProps = any;
  export type PanelResizeHandleProps = any;

  const _default: {
    PanelGroup: typeof PanelGroup;
    Panel: typeof Panel;
    PanelResizeHandle: typeof PanelResizeHandle;
  };

  export default _default;
}
