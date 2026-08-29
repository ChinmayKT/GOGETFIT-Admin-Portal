import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { PlaceholderPage } from "../../components/layout/PlaceholderPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { UserListPage } from "../../features/users/UserListPage";
import { ClientListPage } from "../../features/users/ClientListPage";
import { UserDetailPage } from "../../features/users/UserDetailPage";
import { UserFormPage } from "../../features/users/UserFormPage";
import { CoachListPage } from "../../features/coaches/CoachListPage";
import { CoachDetailPage } from "../../features/coaches/CoachDetailPage";
import { CoachFormPage } from "../../features/coaches/CoachFormPage";
import { CoachCertificatesPage } from "../../features/coaches/CoachCertificatesPage";
import { AssignmentsPage } from "../../features/assignments/AssignmentsPage";

const placeholder = (title: string) => <PlaceholderPage title={title} />;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },

      { path: "users", element: <UserListPage /> },
      { path: "users/clients", element: <ClientListPage /> },
      { path: "users/new", element: <UserFormPage /> },
      { path: "users/:id", element: <UserDetailPage /> },
      { path: "users/:id/edit", element: <UserFormPage /> },

      { path: "coaches", element: <CoachListPage /> },
      { path: "coaches/new", element: <CoachFormPage /> },
      { path: "coaches/:id", element: <CoachDetailPage /> },
      { path: "coaches/:id/edit", element: <CoachFormPage /> },
      { path: "coaches/:id/certificates", element: <CoachCertificatesPage /> },

      { path: "assignments", element: <AssignmentsPage /> },

      { path: "nutrition/diets", element: placeholder("Diet Plans") },
      { path: "nutrition/diets/new", element: placeholder("Add Diet Plan") },
      { path: "nutrition/diets/:id/edit", element: placeholder("Edit Diet Plan") },
      { path: "nutrition/foods", element: placeholder("Food Database") },
      { path: "nutrition/foods/new", element: placeholder("Add Food") },
      { path: "nutrition/foods/:id/edit", element: placeholder("Edit Food") },
      { path: "nutrition/requests", element: placeholder("Food Requests") },
      { path: "nutrition/log", element: placeholder("Food Log") },

      { path: "fitness/workouts", element: placeholder("Workouts") },
      { path: "fitness/workouts/new", element: placeholder("Add Workout") },
      { path: "fitness/workouts/:id/edit", element: placeholder("Edit Workout") },

      { path: "challenges", element: placeholder("Challenges") },
      { path: "challenges/new", element: placeholder("Add Challenge") },
      { path: "challenges/:id", element: placeholder("Challenge Detail") },
      { path: "challenges/:id/participants", element: placeholder("Challenge Participants") },
      { path: "challenges/:id/participants/:userId", element: placeholder("Participant Detail") },

      { path: "rewards", element: placeholder("Rewards") },

      { path: "progress/transformations", element: placeholder("Transformations") },
      { path: "progress/measurements", element: placeholder("Measurements") },

      { path: "content/articles", element: placeholder("Articles") },
      { path: "content/banners", element: placeholder("Banners") },
      { path: "content/faqs", element: placeholder("FAQs") },
      { path: "content/quotes", element: placeholder("Quotes") },
      { path: "content/media", element: placeholder("Media Library") },

      { path: "commerce/products", element: placeholder("Products") },
      { path: "commerce/packages", element: placeholder("Packages") },
      { path: "commerce/orders", element: placeholder("Orders") },
      { path: "commerce/coupons", element: placeholder("Coupons") },

      { path: "operations/notifications", element: placeholder("Notifications") },
      { path: "operations/analytics", element: placeholder("Analytics") },

      { path: "system/admin-users", element: placeholder("Admin Users") },
      { path: "system/permissions", element: placeholder("Roles & Permissions") },
      { path: "system/audit-logs", element: placeholder("Audit Logs") },
      { path: "system/settings", element: placeholder("Settings") },
      { path: "system/feature-flags", element: placeholder("Feature Flags") },

      { path: "*", element: placeholder("Not Found") },
    ],
  },
]);
