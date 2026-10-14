import { lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useRouteError,
  Link,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/shared";
import { AuthProvider, ProtectedRoute } from "@/features/auth/AuthProvider";
import DashboardLayout from "@/components/layout/DashboardLayout";
const Login = lazy(() => import("@/features/auth/LoginPage"));
const Dashboard = lazy(() => import("@/features/dashboard/DashboardPage"));
const Cars = lazy(() => import("@/features/cars/CarsPage"));
const CarForm = lazy(() => import("@/features/cars/CarFormPage"));
const Bookings = lazy(() => import("@/features/bookings/BookingsPage"));
const BookingDetails = lazy(
  () => import("@/features/bookings/BookingDetailsPage"),
);
const Availability = lazy(
  () => import("@/features/availability/AvailabilityPage"),
);
const Categories = lazy(() => import("@/features/categories/CategoriesPage"));
const Locations = lazy(() => import("@/features/locations/LocationsPage"));
function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingSkeleton />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
function RouteError() {
  const error = useRouteError();
  useEffect(() => {
    document.title = "Aurel — Something went wrong";
  }, []);
  return (
    <main className="route-error">
      <ErrorState
        error={
          error instanceof Error
            ? error
            : new Error("The page encountered an error.")
        }
      />
      <Button asChild>
        <Link to="/dashboard">Return to overview</Link>
      </Button>
    </main>
  );
}
function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow">AN UNEXPECTED DETOUR</span>
      <strong>404</strong>
      <h1>This road doesn’t lead anywhere.</h1>
      <p>Let’s get you back to familiar ground.</p>
      <Button asChild>
        <Link to="/dashboard">Return to overview</Link>
      </Button>
    </main>
  );
}
const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  {
    path: "/login",
    element: (
      <Page>
        <Login />
      </Page>
    ),
    errorElement: <RouteError />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: (
              <Page>
                <Dashboard />
              </Page>
            ),
          },
          {
            path: "/cars",
            element: (
              <Page>
                <Cars />
              </Page>
            ),
          },
          {
            path: "/cars/new",
            element: (
              <Page>
                <CarForm />
              </Page>
            ),
          },
          {
            path: "/cars/:id/edit",
            element: (
              <Page>
                <CarForm />
              </Page>
            ),
          },
          {
            path: "/bookings",
            element: (
              <Page>
                <Bookings />
              </Page>
            ),
          },
          {
            path: "/bookings/:id",
            element: (
              <Page>
                <BookingDetails />
              </Page>
            ),
          },
          {
            path: "/availability",
            element: (
              <Page>
                <Availability />
              </Page>
            ),
          },
          {
            path: "/categories",
            element: (
              <Page>
                <Categories />
              </Page>
            ),
          },
          {
            path: "/locations",
            element: (
              <Page>
                <Locations />
              </Page>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
