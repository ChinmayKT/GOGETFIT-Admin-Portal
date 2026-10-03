import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { ImageCropDialog } from "./ImageCropDialog";
import { cropToBlob, loadImage } from "./cropImage";

// jsdom cannot decode images or draw on a canvas; the math is what is tested here.
vi.mock("./cropImage", () => ({
  loadImage: vi.fn(),
  cropToBlob: vi.fn(),
}));

const source = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" });

beforeEach(() => {
  URL.createObjectURL = () => "blob:source";
  URL.revokeObjectURL = () => {};
  // A 1200x800 landscape photo.
  vi.mocked(loadImage).mockResolvedValue({ element: {} as HTMLImageElement, width: 1200, height: 800 });
  vi.mocked(cropToBlob).mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderCover = (onApply = vi.fn(), onCancel = vi.fn()) => {
  render(
    <ImageCropDialog file={source} title="Adjust Cover" aspect={3} outputWidth={1500} onApply={onApply} onCancel={onCancel} />,
  );
  return { onApply, onCancel };
};

/** The crop rectangle (source pixels) handed to the canvas. */
const lastArea = () => vi.mocked(cropToBlob).mock.calls.at(-1)![1];

describe("ImageCropDialog", () => {
  it("starts centred, covering the whole 3:1 frame", async () => {
    renderCover();
    await screen.findByAltText("Image being cropped");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalled());
    // Full width, vertically centred: 1200x400 out of 1200x800.
    expect(lastArea()).toEqual({ x: 0, y: 200, width: 1200, height: 400 });
    expect(vi.mocked(cropToBlob).mock.calls[0][2]).toBe(1500);
  });

  it("moves the image up and down with the arrow keys, never past its edges", async () => {
    renderCover();
    await screen.findByAltText("Image being cropped");
    const frame = screen.getByRole("application");

    // Moving the image down reveals more of its top.
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalledTimes(1));
    expect(lastArea().y).toBe(150);

    for (let i = 0; i < 50; i++) fireEvent.keyDown(frame, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalledTimes(2));
    expect(lastArea().y).toBe(0);

    for (let i = 0; i < 50; i++) fireEvent.keyDown(frame, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalledTimes(3));
    expect(lastArea().y).toBe(400);
  });

  it("zooms about the centre of the frame", async () => {
    renderCover();
    await screen.findByAltText("Image being cropped");
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalled());
    expect(lastArea()).toEqual({ x: 300, y: 300, width: 600, height: 200 });
  });

  it("shows the zoom as 0-100% while zooming", async () => {
    renderCover();
    await screen.findByAltText("Image being cropped");
    const level = () => screen.getByLabelText("Zoom level").textContent;

    expect(level()).toBe("0%");
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2.5" } });
    expect(level()).toBe("50%");
    expect(screen.getByLabelText("Zoom").getAttribute("aria-valuetext")).toBe("50%");
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "4" } });
    expect(level()).toBe("100%");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(level()).toBe("0%");
  });

  it("reset returns to the centred, unzoomed crop", async () => {
    renderCover();
    await screen.findByAltText("Image being cropped");
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "3" } });
    fireEvent.keyDown(screen.getByRole("application"), { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalled());
    expect(lastArea()).toEqual({ x: 0, y: 200, width: 1200, height: 400 });
  });

  it("hands back a cropped file and never the original", async () => {
    const { onApply } = renderCover();
    await screen.findByAltText("Image being cropped");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    const file = onApply.mock.calls[0][0] as File;
    expect(file).not.toBe(source);
    expect(file.name).toBe("photo-cropped.jpg");
    expect(file.type).toBe("image/jpeg");
  });

  it("uses a square frame for the profile picture", async () => {
    render(<ImageCropDialog file={source} title="Adjust" aspect={1} round outputWidth={800} onApply={vi.fn()} onCancel={vi.fn()} />);
    await screen.findByAltText("Image being cropped");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(cropToBlob).toHaveBeenCalled());
    // The centred 800x800 square of the 1200x800 photo.
    expect(lastArea()).toEqual({ x: 200, y: 0, width: 800, height: 800 });
  });

  it("cancel closes without cropping", async () => {
    const { onCancel, onApply } = renderCover();
    await screen.findByAltText("Image being cropped");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(cropToBlob).not.toHaveBeenCalled();
  });

  it("shows an error for an unreadable image", async () => {
    vi.mocked(loadImage).mockRejectedValue(new Error("This image could not be read."));
    renderCover();
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "This image could not be read.");
    expect(screen.getByRole("button", { name: "Apply" })).toHaveProperty("disabled", true);
  });
});
