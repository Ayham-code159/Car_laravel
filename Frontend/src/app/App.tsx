import {
  Component,
  lazy,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { PageLoading, EmptyState } from "../components/shared/States";
import { ButtonLink } from "../components/ui/Primitives";
import { Seo } from "../components/shared/Seo";
import { ApiError } from "../lib/api/client";
const HomePage = lazy(() => import("../features/home/HomePage"));
const CarsPage = lazy(() => import("../features/cars/CarsPage"));
const CarDetailsPage = lazy(() => import("../features/cars/CarDetailsPage"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: (count, error) =>
        count < 1 &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Customer data is never sent to third-party logging. */
  }
  render() {
    return this.state.failed ? (
      <div className="container page-header">
        <h1>A small detour.</h1>
        <p>The page couldn’t load. Please refresh and try again.</p>
        <button
          className="button button-gold"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cars" element={<CarsPage />} />
                  <Route path="/cars/:slug" element={<CarDetailsPage />} />
                  <Route
                    path="*"
                    element={
                      <div className="container page-header">
                        <Seo
                          title="Page not found"
                          description="Find your way back to the collection."
                          path="/"
                          noindex
                        />
                        <EmptyState
                          title="A road less travelled."
                          message="This page doesn’t exist. Your next journey is waiting in the collection."
                          action={
                            <ButtonLink to="/cars">
                              Explore the collection
                            </ButtonLink>
                          }
                        />
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
