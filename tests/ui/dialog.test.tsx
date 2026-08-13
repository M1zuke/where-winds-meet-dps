import { useRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Dialog } from "../../src/ui/components/dialog/Dialog"

describe("Dialog", () => {
  it("closes on Escape and on a click that lands on the backdrop", () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="title" onClose={onClose}>
        <h2 id="title">Titled</h2>
      </Dialog>,
    )

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it("stays open on a click that lands inside the surface", () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="title" onClose={onClose}>
        <h2 id="title">Titled</h2>
      </Dialog>,
    )

    fireEvent.mouseDown(screen.getByText("Titled"))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("cannot be dismissed when it is given no close handler", () => {
    render(
      <Dialog labelledBy="title">
        <h2 id="title">Titled</h2>
      </Dialog>,
    )

    fireEvent.keyDown(document, { key: "Escape" })
    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(screen.getByRole("dialog")).toBeTruthy()
  })

  it("lets Escape reach only the topmost of two stacked dialogs", () => {
    const closeUnderneath = vi.fn()
    const closeOnTop = vi.fn()
    render(
      <>
        <Dialog labelledBy="under" onClose={closeUnderneath}>
          <h2 id="under">Underneath</h2>
        </Dialog>
        <Dialog labelledBy="top" onClose={closeOnTop} layer="confirm">
          <h2 id="top">On top</h2>
        </Dialog>
      </>,
    )

    fireEvent.keyDown(document, { key: "Escape" })
    expect(closeOnTop).toHaveBeenCalledTimes(1)
    expect(closeUnderneath).not.toHaveBeenCalled()
  })

  it("leaves Escape alone once something inside has handled it", () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="title" onClose={onClose}>
        <h2 id="title">Titled</h2>
      </Dialog>,
    )

    const handled = new KeyboardEvent("keydown", { key: "Escape", cancelable: true })
    handled.preventDefault()
    document.dispatchEvent(handled)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("focuses what it is told to focus on open", () => {
    function Focused() {
      const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
      return (
        <Dialog labelledBy="title" initialFocusRef={confirmButtonRef}>
          <h2 id="title">Titled</h2>
          <button type="button" ref={confirmButtonRef}>
            Confirm
          </button>
        </Dialog>
      )
    }
    render(<Focused />)

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }))
  })
})
