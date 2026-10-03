import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DataTable } from "./DataTable";

afterEach(cleanup);

const rows = [{ id: "a", name: "Asha" }, { id: "b", name: "Vikram" }];
const columns = [{ key: "name", header: "Name" }];

describe("DataTable - SL NO", () => {
  it("is the first column of every table, numbered from 1", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["SL NO", "Name"]);
    const body = screen.getAllByRole("row").slice(1);
    expect(body.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["1", "2"]);
  });

  it("keeps counting across pages", () => {
    // Page 3 of 10 per page.
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} rowOffset={(3 - 1) * 10} />);
    const body = screen.getAllByRole("row").slice(1);
    expect(body.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["21", "22"]);
  });

  it("comes before the selection checkbox", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} selectable selectedIds={new Set()} onSelectionChange={() => {}} />);
    const firstRow = screen.getAllByRole("row")[1];
    const cells = within(firstRow).getAllByRole("cell");
    expect(cells[0].textContent).toBe("1");
    expect(within(cells[1]).getByRole("checkbox")).toBeTruthy();
  });
});
