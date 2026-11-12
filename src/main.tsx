import React from "react"
import ReactDOM from "react-dom/client"
// Must precede the component imports: same-specificity component rules need to win the cascade.
import "./styles/base.scss"
import "./styles/primitives.scss"
import { I18nProvider } from "./i18n/I18nProvider"
import { SunsetNotice } from "./ui/layout/sunset-notice/SunsetNotice"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <SunsetNotice />
    </I18nProvider>
  </React.StrictMode>,
)
