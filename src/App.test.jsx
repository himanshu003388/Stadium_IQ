/**
 * App Root Component Tests
 * Covers initial render, BrowserRouter integration, and Layout presence
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it("renders the main layout header", async () => {
    render(<App />);
    // Header with Stadium IQ branding should appear
    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });
  });

  it("renders the main content region", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  it("renders navigation sidebar", async () => {
    render(<App />);
    await waitFor(() => {
      const navElements = screen.getAllByRole("navigation");
      expect(navElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders Command Center by default (first view)", async () => {
    render(<App />);
    // The default view is 'command' — Crowd Density KPI should be visible
    await waitFor(() => {
      expect(screen.getByText("Crowd Density")).toBeInTheDocument();
    });
  });

  it("renders Occupancy KPI card by default", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Occupancy")).toBeInTheDocument();
    });
  });

  it("renders the AI Active status indicator", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("AI Active")).toBeInTheDocument();
    });
  });

  it("renders skip-to-content link", async () => {
    render(<App />);
    await waitFor(() => {
      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).not.toBeNull();
    });
  });
});
