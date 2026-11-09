import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes every cell, escapes quotes and writes null as empty", () => {
    expect(toCsv(["Name", "Note"], [['Asha, "A"', null]])).toBe('"Name","Note"\n"Asha, ""A""",""');
  });

  it("opens text that looks like a formula as plain text", () => {
    const rows = [["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"]];
    expect(toCsv(["a", "b", "c", "d", "e", "f"], rows).split("\n")[1]).toBe(
      '"\'=HYPERLINK(""http://x"")","\'+1+1","\'-2+3","\'@SUM(A1)","\'\tcmd","\'\rcmd"',
    );
  });

  it("leaves numbers and ordinary text alone, including negative amounts", () => {
    expect(toCsv(["a", "b", "c"], [[-250, 1499.5, "ASHA10"]]).split("\n")[1]).toBe('"-250","1499.5","ASHA10"');
  });
});
