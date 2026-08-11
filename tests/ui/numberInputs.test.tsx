import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { NumInput, PercentInput } from "../../src/ui/components/number-inputs/NumberInputs"

function valueOf(): string {
  return (screen.getByRole("spinbutton") as HTMLInputElement).value
}

describe("NumInput display", () => {
  it("rounds a long fraction to two decimals", () => {
    render(<NumInput value={45.568999999999996} onChange={() => {}} />)
    expect(valueOf()).toBe("45.57")
  })

  it("drops trailing zeros rather than padding", () => {
    render(<NumInput value={30} onChange={() => {}} />)
    expect(valueOf()).toBe("30")
  })

  it("keeps four decimals below 0.01 so a small coefficient is not shown as zero", () => {
    render(<NumInput value={0.0005} onChange={() => {}} />)
    expect(valueOf()).toBe("0.0005")
  })

  it("shows a true zero as zero", () => {
    render(<NumInput value={0} onChange={() => {}} />)
    expect(valueOf()).toBe("0")
  })

  it("does not report a change just for rounding the display", () => {
    const onChange = vi.fn()
    render(<NumInput value={45.568999999999996} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("PercentInput display", () => {
  it("rounds the percent to two decimals", () => {
    render(<PercentInput value={0.05828} onChange={() => {}} />)
    expect(valueOf()).toBe("5.83")
  })
})
