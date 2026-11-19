import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PreviewProvider } from "@/lib/preview";
import { MobileAppPreview } from "@/components/mobile-app";
import { questionnaire } from "@/data/demo";

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("volunteer mobile app", () => {
  it("walks login → consent → age gate → questions → issues → submit", () => {
    render(<PreviewProvider><MobileAppPreview /></PreviewProvider>);
    click("Sign in");
    expect(screen.getByText(/3 pending upload/)).toBeInTheDocument();
    click("Start new survey");
    click("Continue");
    expect(screen.getByRole("button", { name: "Agree & continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    click("Agree & continue");

    const [name, , age] = screen.getAllByRole("textbox");
    fireEvent.change(name!, { target: { value: "Kamla Devi" } });
    fireEvent.change(age!, { target: { value: "16" } });
    expect(screen.getByRole("alert")).toHaveTextContent("उत्तरदाता की आयु 18 वर्ष या अधिक होनी चाहिए");
    expect(screen.getByRole("button", { name: "Start questions" })).toBeDisabled();
    fireEvent.change(age!, { target: { value: "41" } });
    click("Start questions");

    // Answer every visible question; Q1 = "Yes" hides the conditional Q2, so 11 screens.
    expect(screen.getByText("1 / 11")).toBeInTheDocument();
    for (let i = 0; i < 11; i++) {
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
      const q = questionnaire.find((x) => headings.some((h) => h.startsWith(x.en)))!;
      if (q.type === "Yes / No") click("Yes");
      else if (q.type === "Numeric rating") click("7");
      else if (q.type === "Dropdown") fireEvent.change(screen.getByRole("combobox"), { target: { value: q.options[0]!.en } });
      else if (q.type === "Single select") click(q.options[0]!.en);
      click("Next");
    }

    click("Roads");
    expect(screen.getByRole("slider", { name: /Roads priority/ })).toHaveValue("5");
    click("Next");
    click("Skip"); // photo is optional by default
    click("Submit");
    expect(screen.getByText("Synced successfully")).toBeInTheDocument();
  }, 60_000);
});
