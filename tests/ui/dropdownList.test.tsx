import { useRef, useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Dialog } from "../../src/ui/components/dialog/Dialog"
import { DropdownList, DropdownOption } from "../../src/ui/components/dropdown-list/DropdownList"

interface Geometry {
  anchor: { left: number; top: number; width: number; height: number }
  listWidth: number
  viewportHeight?: number
}

const VIEWPORT = { width: 1000, height: 600 }
const ANCHOR = { left: 100, top: 100, width: 120, height: 30 }

function rectOf(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }
}

function stubGeometry(geometry: Geometry) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: VIEWPORT.width })
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: geometry.viewportHeight ?? VIEWPORT.height,
  })
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.getAttribute("role") === "listbox") return rectOf(0, 0, geometry.listWidth, 100)
    const { left, top, width, height } = geometry.anchor
    return rectOf(left, top, width, height)
  })
}

function Harness({ onSelect = () => {} }: { onSelect?: () => void }) {
  const [open, setOpen] = useState(true)
  const anchorRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={anchorRef} type="button" onClick={() => setOpen(true)}>
        anchor
      </button>
      <span>outside</span>
      <DropdownList
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        ariaLabel="menu"
      >
        <DropdownOption
          label="Alpha"
          selected={false}
          highlighted={false}
          onSelect={onSelect}
          onHover={() => {}}
        />
      </DropdownList>
    </>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DropdownList positioning", () => {
  it("opens below the anchor when there is room", () => {
    stubGeometry({ anchor: ANCHOR, listWidth: 200 })
    render(<Harness />)
    const list = screen.getByRole("listbox")
    expect(list.style.top).toBe("132px")
    expect(list.style.bottom).toBe("")
  })

  it("flips above the anchor when there is no room below", () => {
    stubGeometry({ anchor: { ...ANCHOR, top: 540 }, listWidth: 200 })
    render(<Harness />)
    const list = screen.getByRole("listbox")
    expect(list.style.top).toBe("")
    expect(list.style.bottom).toBe("62px")
  })

  it("clamps to the right edge of the viewport", () => {
    stubGeometry({ anchor: { ...ANCHOR, left: 900 }, listWidth: 200 })
    render(<Harness />)
    expect(screen.getByRole("listbox").style.left).toBe("792px")
  })

  it("keeps a margin from the left edge", () => {
    stubGeometry({ anchor: { ...ANCHOR, left: -20 }, listWidth: 200 })
    render(<Harness />)
    expect(screen.getByRole("listbox").style.left).toBe("8px")
  })

  it("caps the height at the fixed ceiling when there is plenty of room", () => {
    stubGeometry({ anchor: ANCHOR, listWidth: 200 })
    render(<Harness />)
    expect(screen.getByRole("listbox").style.maxHeight).toBe("240px")
  })

  it("caps the height at the room left when it is below the ceiling", () => {
    stubGeometry({ anchor: ANCHOR, listWidth: 200, viewportHeight: 300 })
    render(<Harness />)
    expect(screen.getByRole("listbox").style.maxHeight).toBe("162px")
  })

  it("starts from fresh coordinates after being closed and reopened", () => {
    stubGeometry({ anchor: ANCHOR, listWidth: 200 })
    render(<Harness />)
    fireEvent.mouseDown(screen.getByText("outside"))
    expect(screen.queryByRole("listbox")).toBeNull()

    vi.restoreAllMocks()
    stubGeometry({ anchor: { ...ANCHOR, top: 300 }, listWidth: 200 })
    fireEvent.click(screen.getByText("anchor"))
    expect(screen.getByRole("listbox").style.top).toBe("332px")
  })
})

describe("DropdownList portal and dismissal", () => {
  function renderOpen(ui: React.ReactElement) {
    stubGeometry({ anchor: ANCHOR, listWidth: 200 })
    return render(ui)
  }

  it("renders under document.body, outside the component's own subtree", () => {
    const { container } = renderOpen(<Harness />)
    const list = screen.getByRole("listbox")
    expect(list.parentElement).toBe(document.body)
    expect(container.contains(list)).toBe(false)
  })

  it("closes on a mousedown outside the list and the anchor", () => {
    renderOpen(<Harness />)
    fireEvent.mouseDown(screen.getByText("outside"))
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("stays open on a mousedown on the anchor or inside the list", () => {
    renderOpen(<Harness />)
    fireEvent.mouseDown(screen.getByText("anchor"))
    fireEvent.mouseDown(screen.getByRole("listbox"))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("closes on Escape", () => {
    renderOpen(<Harness />)
    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("closes on Escape without closing the dialog that contains its anchor", () => {
    const onClose = vi.fn()
    renderOpen(
      <Dialog labelledBy="title" onClose={onClose}>
        <h2 id="title">Titled</h2>
        <Harness />
      </Dialog>,
    )
    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("keeps a dialog open when an option inside it is pressed", () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    renderOpen(
      <Dialog labelledBy="title" onClose={onClose}>
        <h2 id="title">Titled</h2>
        <Harness onSelect={onSelect} />
      </Dialog>,
    )
    fireEvent.mouseDown(screen.getByRole("option", { name: "Alpha" }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})
