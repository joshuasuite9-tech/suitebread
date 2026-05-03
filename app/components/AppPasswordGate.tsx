"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

const APP_PASSWORD = "Suiteness123!";
const APP_UNLOCK_KEY = "suitebread-app-unlocked";

type UnlockState = "checking" | "locked" | "unlocked";

export function AppPasswordGate({
  children,
}: {
  children: ReactNode;
}) {
  const [unlockState, setUnlockState] =
    useState<UnlockState>("checking");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const isUnlocked =
      window.sessionStorage.getItem(APP_UNLOCK_KEY) === "true";
    setUnlockState(isUnlocked ? "unlocked" : "locked");
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === APP_PASSWORD) {
      window.sessionStorage.setItem(APP_UNLOCK_KEY, "true");
      setUnlockState("unlocked");
      setPassword("");
      setErrorMessage("");
      return;
    }

    setErrorMessage("Incorrect password.");
  };

  if (unlockState === "unlocked") {
    return <>{children}</>;
  }

  if (unlockState === "checking") {
    return (
      <div className="app-lock-shell">
        <div className="app-lock-card surface">
          <p className="eyebrow">Suite Bread</p>
          <h1 className="font-display text-3xl sm:text-4xl">
            Checking access
          </h1>
          <p className="app-lock-copy">
            Loading the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-lock-shell">
      <div className="app-lock-card surface">
        <div className="app-lock-head">
          <p className="eyebrow">Suite Bread</p>
          <span className="app-lock-badge">Protected</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl">
          Enter Password
        </h1>
        <p className="app-lock-copy">
          This app is locked. Enter the password to continue.
        </p>

        <form className="app-lock-form" onSubmit={handleSubmit}>
          <label className="app-lock-field">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="password"
              value={password}
              onChange={event => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              className="input-field w-full"
              placeholder="Enter password"
              autoFocus
            />
          </label>

          {errorMessage && (
            <p className="app-lock-error">{errorMessage}</p>
          )}

          <div className="app-lock-actions">
            <button type="submit" className="button-primary">
              Unlock App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
