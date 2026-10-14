import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field } from "@/components/shared";
import { loginSchema, mapErrors } from "@/lib/validations";
import { useAuth } from "./AuthProvider";
import { BrandMark, VehicleIllustration } from "@/components/layout/Brand";
export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  if (auth.session) return <Navigate to="/dashboard" replace />;
  return (
    <main className="login-page">
      <section className="login-art">
        <BrandMark />
        <div className="login-editorial">
          <div className="eyebrow">THE ART OF FLEET MANAGEMENT</div>
          <h1>
            Exceptional cars.
            <br />
            <em>Effortless control.</em>
          </h1>
          <p>
            A considered space for every vehicle,
            <br />
            every reservation, every journey.
          </p>
        </div>
        <VehicleIllustration />
        <div className="login-art-footer">
          <span>PRECISION. PERFORMANCE. POSSIBILITY.</span>
          <ArrowUpRight size={22} />
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-mobile-brand">
          <BrandMark />
        </div>
        <div className="login-form">
          <div className="icon-tile">
            <LockKeyhole size={23} />
          </div>
          <div className="eyebrow mt-7">ADMINISTRATOR ACCESS</div>
          <h2>Welcome back.</h2>
          <p className="text-muted-foreground mb-9">
            Sign in to take the driver’s seat.
          </p>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await auth.login(values.username, values.password);
                const from = (location.state as { from?: string } | null)?.from;
                navigate(
                  from?.startsWith("/") && !from.startsWith("//")
                    ? from
                    : "/dashboard",
                  { replace: true },
                );
              } catch (e) {
                setError(e);
                mapErrors(e, form.setError);
              }
            })}
            className="space-y-5"
          >
            <Field
              label="Username"
              error={form.formState.errors.username?.message}
            >
              <input
                className="control"
                autoComplete="username"
                autoFocus
                placeholder="Your username"
                {...form.register("username")}
              />
            </Field>
            <Field
              label="Password"
              error={form.formState.errors.password?.message}
            >
              <span className="password-control">
                <input
                  className="control"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
            <ErrorNotice error={error} />
            <Button
              className="w-full h-12 mt-3"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? "Signing in…"
                : "Sign in to dashboard"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="login-security">
            <LockKeyhole size={13} /> Secure access · Authorized administrators
            only
          </p>
        </div>
        <footer className="login-footer">
          AUREL <span>Fleet management, thoughtfully refined.</span>
        </footer>
      </section>
    </main>
  );
}
