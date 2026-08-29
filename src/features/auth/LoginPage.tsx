import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { LiquidBackground } from "../../components/layout/LiquidBackground";
import { GlassCard } from "../../components/ui/GlassCard";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../app/providers/AuthProvider";
import logo from "../../assets/brand/gogetfit-logo-transparent.png";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error ?? "Invalid email or password");
    }
  }

  return (
    <div className={styles.root}>
      <LiquidBackground />

      <div className={styles.panel}>
        <div className={styles.brandRow}>
          <img src={logo} alt="GoGetFit" className={styles.logo} />
          <span className={styles.brandCaption}>ADMIN PORTAL</span>
        </div>

        <GlassCard glow className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to the GoGetFit Admin Portal</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <Field label="Email" required>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.leadingIcon} />
                <Input
                  type="email"
                  autoComplete="username"
                  placeholder="you@gogetfit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.inputWithLeadingIcon}
                  autoFocus
                />
              </div>
            </Field>

            <Field label="Password" required>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.leadingIcon} />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputWithBothIcons}
                />
                <button
                  type="button"
                  className={styles.trailingIconBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} iconRight={!loading && <ArrowRight size={16} />} className={styles.submit}>
              Sign In
            </Button>
          </form>
        </GlassCard>

        <p className={styles.footer}>GoGetFit Admin Portal — internal use only</p>
      </div>
    </div>
  );
}
