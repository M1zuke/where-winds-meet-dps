import { useState } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import { classKey } from "../../../../i18n/contentKeys"
import { getSchool } from "../../../../engine/panel"
import type { Inputs } from "../../../../engine/types"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { TalentsTab } from "../talents-tab/TalentsTab"
import { OdditiesTab } from "../oddities-tab/OdditiesTab"
import { EnhancementTab } from "../enhancement-tab/EnhancementTab"

export function TalentsOdditiesTab({
  inputs,
  onChange,
}: {
  inputs: Inputs
  onChange: (next: Inputs) => void
}) {
  const { t } = useI18n()
  const [sub, setSub] = useState<"enhancement" | "oddities" | "talents">("enhancement")
  const school = getSchool(inputs.classId)
  const className = t(classKey(school.id), school.displayName)
  return (
    <>
      <SubTabs
        active={sub}
        onSelect={setSub}
        tabs={[
          { key: "enhancement", label: t("talents.enhancement.enhancement") },
          { key: "oddities", label: t("talents.oddities.oddities") },
          { key: "talents", label: `${t("talents.oddities.classTalents")} (${className})` },
        ]}
      />
      <SubTabPanel>
        {sub === "enhancement" && <EnhancementTab inputs={inputs} onChange={onChange} />}
        {sub === "oddities" && <OdditiesTab inputs={inputs} onChange={onChange} />}
        {sub === "talents" && <TalentsTab inputs={inputs} />}
      </SubTabPanel>
    </>
  )
}
