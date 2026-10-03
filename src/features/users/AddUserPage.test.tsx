import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AddUserPage, heightCm, previewFigures, validateUserForm, type UserFormState } from "./AddUserPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";
import {
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
  FOOD_TYPES,
  ageInYears,
  computeBmr,
  computeBodyFatPercentage,
  computeTdee,
  type ActivityLevel,
  type Gender,
} from "../../constants/fitnessProfile";

/** Produced by running the Flutter app's own functions with `dart run` (same vectors as the backend test). */
const DART_VECTORS: [Gender, number, number, number, ActivityLevel, number, number, number][] = [
  ["male", 28, 170.7, 72.5, "moderate", 20.097415397983905, 1656.875, 2568.15625],
  ["female", 35, 158.5, 61.2, "light", 31.88305038362408, 1266.625, 1741.609375],
  ["male", 13, 121.9, 30.0, "sedentary", 11.01674619320426, 1001.875, 1202.25],
  ["female", 100, 243.8, 250.0, "veryActive", 68.07238790250886, 3362.75, 6389.224999999999],
  ["male", 45, 182.9, 95.4, "active", 28.371749643747645, 1877.125, 3238.040625],
];

const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
let calls: { method: string; url: string; body: unknown }[] = [];
let respond: () => Response;

const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: "/users", element: <p>Users list</p> },
      { path: "/users/new", element: <AddUserPage /> },
      { path: "/users/:id", element: <p>User detail</p> },
    ],
    { initialEntries: ["/users/new"] },
  );
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return router;
};

/** yyyy-mm-dd for someone who turned [years] ten days ago. */
const dobForAge = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const choose = (label: RegExp, value: string) => fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });
const fillAll = () => {
  type(/^Phone/, "98765 43210");
  type(/^Name/, "Rahul Sharma");
  fireEvent.click(screen.getByRole("radio", { name: "Male" }));
  type(/Date of Birth/, dobForAge(28));
  type(/^City/, "Bengaluru");
  type(/^Height/, "5.6"); // decimal feet, as the app's wheel - 170.7 cm
  type(/^Weight/, "72.5");
  choose(/Activity Level/, "moderate");
  choose(/Food Type/, "nonVegetarian");
  choose(/Goal/, "maintainPhysique");
};

beforeEach(() => {
  calls = [];
  respond = () => json(201, { success: true, data: { user: { id: "new-user-1" }, freeDietPlan: { status: "matched", planId: "p1" } } });
  tokenStore.set("t");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", url: String(input), body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
      return respond();
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Flutter parity", () => {
  it("9, 13. body fat, BMR and TDEE give the app's exact numbers", () => {
    for (const [gender, age, h, w, level, bodyFat, bmr, tdee] of DART_VECTORS) {
      expect(computeBodyFatPercentage(gender, w, h, age)).toBe(bodyFat);
      expect(computeBmr(gender, w, h, age)).toBe(bmr);
      expect(computeTdee(bmr, level)).toBe(tdee);
    }
  });

  it("10-12. activity level, food type and goal use the app's values and labels", () => {
    expect(ACTIVITY_LEVELS.map((a) => [a.value, a.label, a.multiplier])).toEqual([
      ["sedentary", "Sedentary", 1.2],
      ["light", "Lightly Active", 1.375],
      ["moderate", "Moderately Active", 1.55],
      ["active", "Active", 1.725],
      ["veryActive", "Very Active", 1.9],
    ]);
    expect(FOOD_TYPES.map((f) => [f.value, f.label])).toEqual([
      ["vegetarian", "Vegetarian"],
      ["nonVegetarian", "Non-Vegetarian"],
      ["vegetarianPlusEgg", "Vegetarian + Egg"],
    ]);
    expect(FITNESS_GOALS.map((g) => [g.value, g.label])).toEqual([
      ["fatLoss", "Fat / Weight Loss"],
      ["muscleGain", "Muscle / Weight Gain"],
      ["maintainPhysique", "Maintain Physique"],
    ]);
  });

  it("8. height: decimal feet converted to cm exactly as the app's wheel (all 41 positions, from dart run)", () => {
    const DART_CM = [
      121.9, 125.0, 128.0, 131.1, 134.1, 137.2, 140.2, 143.3, 146.3, 149.4, 152.4, 155.4, 158.5, 161.5, 164.6, 167.6, 170.7, 173.7, 176.8, 179.8, 182.9,
      185.9, 189.0, 192.0, 195.1, 198.1, 201.2, 204.2, 207.3, 210.3, 213.4, 216.4, 219.5, 222.5, 225.6, 228.6, 231.6, 234.7, 237.7, 240.8, 243.8,
    ];
    expect(Array.from({ length: 41 }, (_, i) => heightCm(((40 + i) / 10).toFixed(1)))).toEqual(DART_CM);
  });

  it("6. age is whole years from DOB, as the app's ageInYears", () => {
    const asOf = new Date(2026, 9, 1); // 1 Oct 2026
    expect(ageInYears("1998-10-01", asOf)).toBe(28); // birthday today
    expect(ageInYears("1998-10-02", asOf)).toBe(27); // tomorrow
    expect(ageInYears("2000-02-29", asOf)).toBe(26);
  });
});

describe("Add User page", () => {
  it("is a simple onboarding form: no User Type or role choice", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Add User" })).toBeTruthy();
    for (const label of [/^Phone/, /^Name/, /Date of Birth/, /^City/, /^Height/, /^Weight/]) expect(screen.getByLabelText(label)).toBeTruthy();
    for (const label of [/Activity Level/, /Food Type/, /Goal/]) expect(screen.getByRole("combobox", { name: label })).toBeTruthy();
    expect(screen.queryByText(/User Type/i)).toBeNull();
    expect(screen.queryByText(/^Role/i)).toBeNull();
    expect(screen.queryByRole("option", { name: /Admin|Coach|Client/ })).toBeNull();
    // City is a free text box, not a dropdown.
    expect((screen.getByLabelText(/^City/) as HTMLElement).tagName).toBe("INPUT");
  });

  it("6, 9, 13. age, body fat, BMR and TDEE appear as calculated read-only values and follow the inputs", () => {
    renderPage();
    const calc = within(screen.getByLabelText("Calculated from the profile"));
    expect(calc.getAllByText("Calculated")).toHaveLength(3);
    expect(screen.queryByRole("spinbutton", { name: /Body Fat|BMR|TDEE|Age/ })).toBeNull();

    fillAll();
    expect(screen.getByLabelText("Age (from date of birth)").textContent).toBe("Age 28");
    expect(screen.getByLabelText("Converted height (cm)").textContent).toBe("170.7 cm");
    expect(calc.getByLabelText("Body Fat %").textContent).toContain("20.10");
    expect(calc.getByLabelText("BMR").textContent).toContain("1657");
    expect(calc.getByLabelText("TDEE").textContent).toContain("2568");

    // Recalculated when an input changes.
    fireEvent.click(screen.getByRole("radio", { name: "Female" }));
    expect(calc.getByLabelText("BMR").textContent).toContain(String(Math.round(1656.875 - 166)));
  });

  it("1-4, 8. Create User sends the profile only - never roles, age or calculated figures", async () => {
    const router = renderPage();
    fillAll();
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/new-user-1"));

    const post = calls.find((c) => c.method === "POST")!;
    expect(post.url).toMatch(/\/admin\/users$/);
    expect(post.body).toEqual({
      phone: "98765 43210",
      name: "Rahul Sharma",
      dateOfBirth: dobForAge(28),
      gender: "male",
      city: "Bengaluru",
      fitnessProfile: { height: 170.7, weight: 72.5, activityLevel: "moderate", foodType: "nonVegetarian", goal: "maintainPhysique" },
    });
    expect(JSON.stringify(post.body)).not.toMatch(/roles|userType|age"|bodyFat|bmr|tdee/);
  });

  it("16. nothing is sent until the form is valid; errors appear next to the fields", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
    for (const msg of ["Enter a valid mobile number.", "Enter the user's name.", "Select the date of birth.", "Select a gender.", "Enter a city.", "Select an activity level.", "Select a food type.", "Select a goal."]) {
      expect(screen.getByText(msg)).toBeTruthy();
    }
    expect(screen.getByText("Height must be 4.0–8.0 ft, in 0.1 steps.")).toBeTruthy();
    expect(screen.getByText("Weight must be 30–250 kg.")).toBeTruthy();
  });

  it("email is optional, checked with the app's rule, and sent only when entered", async () => {
    renderPage();
    fillAll();
    type(/^Email/, "rahul@gmail");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);

    type(/^Email/, " rahul.sharma+gym@gmail.com ");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect((calls.find((c) => c.method === "POST")!.body as { email: string }).email).toBe("rahul.sharma+gym@gmail.com");
  });

  it("18. a duplicate phone is shown on the phone field", async () => {
    respond = () => json(409, { success: false, error: { code: "PHONE_ALREADY_REGISTERED", message: "A user with this phone number already exists" } });
    renderPage();
    fillAll();
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    expect(await screen.findByText("A user with this phone number already exists.")).toBeTruthy();
  });

  it("any other server refusal is shown above the buttons", async () => {
    respond = () => json(400, { success: false, error: { code: "VALIDATION_ERROR", message: "fitnessProfile.bodyFatPercentage must be a realistic body fat percentage (1-80)" } });
    renderPage();
    fillAll();
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/body fat percentage/);
  });
});

describe("Edit User (same form)", () => {
  const stored = {
    id: "u9",
    phone: { raw: "9876543210", normalized: "919876543210" },
    profile: {
      name: "Spurthi I M",
      email: "spurthi@gmail.com",
      isEmailVerified: false,
      dateOfBirth: "1995-06-15",
      age: 31,
      gender: "female",
      city: "Bangalore",
      profilePicture: null,
      freeDietPlanId: null,
      // A migrated height that is not on the 0.1 ft grid.
      fitnessProfile: { height: 164, weight: 73, bodyFatPercentage: null, activityLevel: "light", foodType: "vegetarian", goal: "fatLoss", bmr: null, tdee: null },
    },
    profileCompleted: true,
    roles: ["user", "client"],
    status: "active",
    legacy: null,
    createdAt: null,
    updatedAt: null,
  };
  const renderEdit = (user = stored) => {
    respond = () => json(200, { success: true, data: { user, freeDietPlan: { status: "matched", planId: "p1" } } });
    const router = createMemoryRouter(
      [
        { path: "/users/:id/edit", element: <AddUserPage /> },
        { path: "/users/:id", element: <p>User detail</p> },
      ],
      { initialEntries: ["/users/u9/edit"] },
    );
    render(
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>,
    );
    return router;
  };

  it("loads the user into the Add User form; phone is locked", async () => {
    renderEdit();
    expect(await screen.findByRole("heading", { name: "Edit User" })).toBeTruthy();
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe("Spurthi I M");
    expect((screen.getByLabelText(/^Phone/) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/^Email/) as HTMLInputElement).value).toBe("spurthi@gmail.com");
    expect((screen.getByLabelText(/Date of Birth/) as HTMLInputElement).value).toBe("1995-06-15");
    expect(screen.getByRole("radio", { name: "Female" }).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByLabelText(/^Height/) as HTMLInputElement).value).toBe("5.4");
    expect(screen.getByLabelText("Converted height (cm)").textContent).toBe("164 cm");
    expect((screen.getByRole("combobox", { name: /Activity Level/ }) as HTMLSelectElement).value).toBe("light");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy();
    expect(screen.queryByText(/User Type/i)).toBeNull();
  });

  it("saves with PATCH, without the phone, keeping an untouched height exactly", async () => {
    const router = renderEdit();
    await screen.findByRole("heading", { name: "Edit User" });
    type(/^City/, "Mysuru");
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/u9"));
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toMatch(/\/admin\/users\/u9$/);
    const sent = patch.body as { city: string; phone?: string; fitnessProfile: { height: number } };
    expect(sent.city).toBe("Mysuru");
    expect(sent.phone).toBeUndefined();
    expect(sent.fitnessProfile.height).toBe(164);
  });

  it("a changed height is converted from feet like the app", async () => {
    renderEdit();
    await screen.findByRole("heading", { name: "Edit User" });
    type(/^Height/, "5.6");
    expect(screen.getByLabelText("Converted height (cm)").textContent).toBe("170.7 cm");
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PATCH")).toBe(true));
    expect((calls.find((c) => c.method === "PATCH")!.body as { fitnessProfile: { height: number } }).fitnessProfile.height).toBe(170.7);
  });

  it("a verified email is shown but cannot be edited", async () => {
    renderEdit({ ...stored, profile: { ...stored.profile, isEmailVerified: true } });
    await screen.findByRole("heading", { name: "Edit User" });
    expect((screen.getByLabelText(/^Email/) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("Verified by the user - cannot be changed")).toBeTruthy();
  });

  it("an unknown user shows not found instead of loading forever", async () => {
    respond = () => json(404, { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    const router = createMemoryRouter([{ path: "/users/:id/edit", element: <AddUserPage /> }], { initialEntries: ["/users/zz/edit"] });
    render(
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>,
    );
    expect(await screen.findByText("User not found")).toBeTruthy();
  });
});

describe("form rules", () => {
  const base = (): UserFormState => ({
    phone: "9876543210",
    name: "Rahul",
    email: "",
    dateOfBirth: dobForAge(28),
    gender: "male",
    city: "Navi Mumbai (Kharghar)",
    height: "5.6",
    weight: "72.5",
    activityLevel: "moderate",
    foodType: "vegetarian",
    goal: "fatLoss",
  });

  it("7, 16. arbitrary city text is fine; zero, negative and out-of-range fitness values are not", () => {
    expect(validateUserForm(base())).toEqual({});
    for (const height of ["0", "-5", "3.9", "8.1", "5.65", "170", "abc"]) expect(validateUserForm({ ...base(), height }).height).toBeTruthy();
    for (const weight of ["0", "-1", "29.9", "250.1"]) expect(validateUserForm({ ...base(), weight }).weight).toBeTruthy();
    expect(validateUserForm({ ...base(), dateOfBirth: dobForAge(12) }).dateOfBirth).toBeTruthy();
    expect(validateUserForm({ ...base(), dateOfBirth: dobForAge(101) }).dateOfBirth).toBeTruthy();
  });

  it("figures stay empty until their inputs exist, like the app", () => {
    expect(previewFigures({ ...base(), gender: "" })).toMatchObject({ bodyFat: null, bmr: null, tdee: null });
    expect(previewFigures({ ...base(), activityLevel: "" }).tdee).toBeNull();
  });
});
