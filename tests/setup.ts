import "@testing-library/jest-dom/vitest"

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
