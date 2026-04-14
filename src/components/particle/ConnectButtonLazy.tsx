import { lazy } from "react";

export const ConnectButtonLazy = lazy(() =>
  import("@particle-network/connectkit").then((m) => ({
    default: m.ConnectButton,
  }))
);
