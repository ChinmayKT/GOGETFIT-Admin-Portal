import { describe, expect, it } from "vitest";
import { ROLE_ORDER, sortRoles, type Role } from "./admin";

describe("roles are additive", () => {
  it("keeps every role, not just the first", () => {
    const roles: Role[] = ["user", "client", "coach", "admin"];
    expect(sortRoles(roles)).toHaveLength(4);
  });

  it("normalises order so the badge row reads consistently", () => {
    expect(sortRoles(["admin", "user"])).toEqual(["user", "admin"]);
    expect(sortRoles(["coach", "client", "user"])).toEqual(["user", "client", "coach"]);
  });

  it("drops anything not a known role", () => {
    expect(sortRoles(["user", "superuser" as Role])).toEqual(["user"]);
  });

  it("has exactly the four canonical roles", () => {
    expect(ROLE_ORDER).toEqual(["user", "client", "coach", "admin"]);
  });
});
