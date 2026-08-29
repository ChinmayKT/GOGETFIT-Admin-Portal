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
import { FaqListPage } from "../../features/content/FaqListPage";
import { FaqFormPage } from "../../features/content/FaqFormPage";
import { QuotesPage } from "../../features/content/QuotesPage";
import { ArticleListPage } from "../../features/content/ArticleListPage";
import { ArticleFormPage } from "../../features/content/ArticleFormPage";
import { BannerListPage } from "../../features/content/BannerListPage";
import { BannerFormPage } from "../../features/content/BannerFormPage";
import { BannerViewPage } from "../../features/content/BannerViewPage";
import { MediaLibraryPage } from "../../features/content/MediaLibraryPage";
import { ProductListPage } from "../../features/commerce/ProductListPage";
import { ProductFormPage } from "../../features/commerce/ProductFormPage";
import { ProductViewPage } from "../../features/commerce/ProductViewPage";
import { CouponListPage } from "../../features/commerce/CouponListPage";
import { CouponFormPage } from "../../features/commerce/CouponFormPage";
import { PackageListPage } from "../../features/commerce/PackageListPage";
import { PackageFormPage } from "../../features/commerce/PackageFormPage";
import { OrderListPage } from "../../features/commerce/OrderListPage";
import { OrderDetailPage } from "../../features/commerce/OrderDetailPage";

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

      { path: "content/articles", element: <ArticleListPage /> },
      { path: "content/articles/new", element: <ArticleFormPage /> },
      { path: "content/articles/:id/edit", element: <ArticleFormPage /> },
      { path: "content/banners", element: <BannerListPage /> },
      { path: "content/banners/new", element: <BannerFormPage /> },
      { path: "content/banners/:id", element: <BannerViewPage /> },
      { path: "content/banners/:id/edit", element: <BannerFormPage /> },
      { path: "content/faqs", element: <FaqListPage /> },
      { path: "content/faqs/new", element: <FaqFormPage /> },
      { path: "content/faqs/:id/edit", element: <FaqFormPage /> },
      { path: "content/quotes", element: <QuotesPage /> },
      { path: "content/media", element: <MediaLibraryPage /> },

      { path: "commerce/products", element: <ProductListPage /> },
      { path: "commerce/products/new", element: <ProductFormPage /> },
      { path: "commerce/products/:id", element: <ProductViewPage /> },
      { path: "commerce/products/:id/edit", element: <ProductFormPage /> },
      { path: "commerce/packages", element: <PackageListPage /> },
      { path: "commerce/packages/new", element: <PackageFormPage /> },
      { path: "commerce/packages/:id/edit", element: <PackageFormPage /> },
      { path: "commerce/orders", element: <OrderListPage /> },
      { path: "commerce/orders/:id", element: <OrderDetailPage /> },
      { path: "commerce/coupons", element: <CouponListPage /> },
      { path: "commerce/coupons/new", element: <CouponFormPage /> },
      { path: "commerce/coupons/:id/edit", element: <CouponFormPage /> },

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
