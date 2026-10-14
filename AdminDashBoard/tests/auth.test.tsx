import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { authApi } from "@/lib/api/services";
import { ApiError, readSession } from "@/lib/api/client";
import { AuthProvider, ProtectedRoute } from "@/features/auth/AuthProvider";
import LoginPage from "@/features/auth/LoginPage";
function renderRoutes(start: string) {
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={query}>
      <AuthProvider>
        <MemoryRouter initialEntries={[start]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<h1>Protected overview</h1>} />
              <Route path="/cars" element={<h1>Private cars</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
describe("admin authentication UI", () => {
  it("redirects an unauthenticated route to login", async () => {
    renderRoutes("/cars");
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Private cars")).not.toBeInTheDocument();
  });
  it("signs in and stores the Passport token in session scope", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "local-test-token",
      tokenType: "Bearer",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      admin: { id: 1, username: "admin" },
    });
    vi.spyOn(authApi, "me").mockResolvedValue({ id: 1, username: "admin" });
    renderRoutes("/login");
    await userEvent.type(screen.getByPlaceholderText("Your username"), "admin");
    await userEvent.type(
      screen.getByPlaceholderText("Enter your password"),
      "safe-test-password",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Sign in to dashboard/ }),
    );
    expect(await screen.findByText("Protected overview")).toBeInTheDocument();
    expect(readSession()?.token).toBe("local-test-token");
  });
  it("shows failed credentials without creating a session", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new ApiError("Authentication required.", 401),
    );
    renderRoutes("/login");
    await userEvent.type(screen.getByPlaceholderText("Your username"), "admin");
    await userEvent.type(
      screen.getByPlaceholderText("Enter your password"),
      "wrong",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Sign in to dashboard/ }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Authentication required.",
      ),
    );
    expect(readSession()).toBeNull();
  });
});
