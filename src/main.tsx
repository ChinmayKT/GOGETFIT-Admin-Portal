import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router/routes";
import { AuthProvider } from "./app/providers/AuthProvider";
import { RoleProvider } from "./app/providers/RoleProvider";
import { ToastProvider } from "./components/feedback/ToastProvider";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RoleProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </RoleProvider>
    </AuthProvider>
  </StrictMode>,
);
