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
import { DietListPage } from "../../features/nutrition/DietListPage";
import { DietFormPage } from "../../features/nutrition/DietFormPage";
import { FoodListPage } from "../../features/nutrition/FoodListPage";
import { FoodFormPage } from "../../features/nutrition/FoodFormPage";
import { FoodRequestsPage } from "../../features/nutrition/FoodRequestsPage";
import { FoodLogPage } from "../../features/nutrition/FoodLogPage";
import { WorkoutListPage } from "../../features/workouts/WorkoutListPage";
import { WorkoutFormPage } from "../../features/workouts/WorkoutFormPage";
import { ChallengeListPage } from "../../features/challenges/ChallengeListPage";
import { ChallengeFormPage } from "../../features/challenges/ChallengeFormPage";
import { ChallengeDetailPage } from "../../features/challenges/ChallengeDetailPage";
import { ParticipantsListPage } from "../../features/challenges/ParticipantsListPage";
import { ParticipantDetailPage } from "../../features/challenges/ParticipantDetailPage";
import { RewardsPage } from "../../features/rewards/RewardsPage";
import { TransformationsPage } from "../../features/progress/TransformationsPage";
import { MeasurementsPage } from "../../features/progress/MeasurementsPage";

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

      { path: "nutrition/diets", element: <DietListPage /> },
      { path: "nutrition/diets/new", element: <DietFormPage /> },
      { path: "nutrition/diets/:id/edit", element: <DietFormPage /> },
      { path: "nutrition/foods", element: <FoodListPage /> },
      { path: "nutrition/foods/new", element: <FoodFormPage /> },
      { path: "nutrition/foods/:id/edit", element: <FoodFormPage /> },
      { path: "nutrition/requests", element: <FoodRequestsPage /> },
      { path: "nutrition/log", element: <FoodLogPage /> },

      { path: "fitness/workouts", element: <WorkoutListPage /> },
      { path: "fitness/workouts/new", element: <WorkoutFormPage /> },
      { path: "fitness/workouts/:id/edit", element: <WorkoutFormPage /> },

      { path: "challenges", element: <ChallengeListPage /> },
      { path: "challenges/new", element: <ChallengeFormPage /> },
      { path: "challenges/:id", element: <ChallengeDetailPage /> },
      { path: "challenges/:id/edit", element: <ChallengeFormPage /> },
      { path: "challenges/:id/participants", element: <ParticipantsListPage /> },
      { path: "challenges/:id/participants/:userId", element: <ParticipantDetailPage /> },

      { path: "rewards", element: <RewardsPage /> },

      { path: "progress/transformations", element: <TransformationsPage /> },
      { path: "progress/measurements", element: <MeasurementsPage /> },

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
