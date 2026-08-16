import { useCallback, useEffect, useMemo, useState } from "react"
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { runEngine } from "../engine/dps"
import { applyArmorSet, applyBowSet } from "../engine/panel"
import { withDerivedStats } from "../engine/derivedInputs"
import type { Inputs, StoredProfile } from "../engine/types"
import { OverviewTab } from "../ui/features/overview/overview-tab/OverviewTab"
import { MetricsCard, WarningsList } from "../ui/layout/output-panel/OutputPanel"
import { GithubLink } from "../ui/layout/github-link/GithubLink"
import { ChangelogButton } from "../ui/layout/changelog-button/ChangelogButton"
import { RotationTab } from "../ui/features/rotation/rotation-tab/RotationTab"
import { SimulationTab } from "../ui/features/simulation/simulation-tab/SimulationTab"
import { ProfilePanel } from "../ui/features/profile/profile-panel/ProfilePanel"
import { GearTab } from "../ui/features/gear/gear-tab/GearTab"
import { TalentsOdditiesTab } from "../ui/features/talents/talents-oddities-tab/TalentsOdditiesTab"
import { SkillsTab } from "../ui/features/skills/skills-tab/SkillsTab"
import { useGraduationRate } from "../ui/hooks/useGraduationRate"
import { useParseSimulation, type ParseSimulationRequest } from "../ui/hooks/useParseSimulation"
import { SimulationToast, SIMULATION_PATH } from "../ui/layout/simulation-toast/SimulationToast"
import { DpsActivityToast } from "../ui/layout/dps-activity-toast/DpsActivityToast"
import { GraduationBuildDialog } from "../ui/features/gear/graduation-build-dialog/GraduationBuildDialog"
import { SetupWizard, type SetupMode } from "../ui/features/setup/setup-wizard/SetupWizard"
import { useI18n } from "../i18n/i18nContext"
import { I18nProvider } from "../i18n/I18nProvider"
import { ConfirmProvider } from "../ui/components/confirm-dialog/ConfirmDialog"
import { useConfirm } from "../ui/components/confirm-dialog/confirmContext"
import {
  loadProfiles,
  saveProfiles,
  newProfileId,
  loadCustomSkills,
  loadCustomBuffs,
  loadCustomDebuffs,
  migrateSeededSkillIds,
  migrateDotStandinOverrides,
  type ProfilesState,
} from "../storage"
import type { Skill } from "../engine/skill"
import type { Buff } from "../engine/buff"
import type { Debuff } from "../engine/debuff"
import { blankInputs } from "../engine/defaults"
import styles from "./App.module.scss"

migrateSeededSkillIds()
migrateDotStandinOverrides()

function AppInner() {
  const simulation = useParseSimulation()
  const [startedRunCount, setStartedRunCount] = useState(0)
  const [acknowledgedRunCount, setAcknowledgedRunCount] = useState(0)
  const isSimulationRunning = simulation.status === "running"
  const isOnSimulationTab = useLocation().pathname === SIMULATION_PATH
  const areInputsLocked = isSimulationRunning && !isOnSimulationTab

  const startParseSimulation = simulation.start
  const startSimulation = useCallback(
    (request: ParseSimulationRequest) => {
      setStartedRunCount((count) => count + 1)
      startParseSimulation(request)
    },
    [startParseSimulation],
  )
  const acknowledgeSimulation = useCallback(
    () => setAcknowledgedRunCount(startedRunCount),
    [startedRunCount],
  )

  const initial = useState(() => loadProfiles())[0]
  const [committed, setCommitted] = useState<ProfilesState>({
    profiles: initial.profiles,
    activeId: initial.activeId,
  })
  const initialActive = committed.profiles.find((profile) => profile.id === committed.activeId)!
  const [activeDraft, setActiveDraft] = useState<Inputs>(initialActive.inputs)
  const inputs = activeDraft

  function setInputs(next: Inputs) {
    if (isSimulationRunning) return
    setActiveDraft(next)
  }
  const [lastSavedJson, setLastSavedJson] = useState(() => JSON.stringify(initialActive.inputs))
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [graduationDialogOpen, setGraduationDialogOpen] = useState(false)

  const [wizard, setWizard] = useState<{ mode: SetupMode; defaultName: string } | null>(() =>
    initial.firstRun ? { mode: "first-run", defaultName: "" } : null,
  )

  const draftJson = useMemo(() => JSON.stringify(activeDraft), [activeDraft])
  const isDirty = draftJson !== lastSavedJson

  const [customSkills, setCustomSkills] = useState<Skill[]>(() => loadCustomSkills())

  function changeCustomSkills(next: Skill[]) {
    if (isSimulationRunning) return
    setCustomSkills(next)
  }

  const [customBuffs] = useState<Buff[]>(() => loadCustomBuffs())
  const [customDebuffs] = useState<Debuff[]>(() => loadCustomDebuffs())

  const configuredInputs = useMemo(() => {
    const classSkills = customSkills.filter((skill) => skill.classId === inputs.classId)
    const classBuffs = customBuffs.filter((buff) => buff.classId === inputs.classId)
    const classDebuffs = customDebuffs.filter((debuff) => debuff.classId === inputs.classId)
    const withSkills = classSkills.length ? { ...inputs, customSkills: classSkills } : inputs
    const withBuffs = classBuffs.length ? { ...withSkills, customBuffs: classBuffs } : withSkills
    return classDebuffs.length ? { ...withBuffs, customDebuffs: classDebuffs } : withBuffs
  }, [inputs, customSkills, customBuffs, customDebuffs])

  const engineInputs = useMemo(() => {
    const derived = withDerivedStats(configuredInputs)
    return applyBowSet(applyArmorSet(derived))
  }, [configuredInputs])

  const result = useMemo(() => runEngine(engineInputs), [engineInputs])
  const graduation = useGraduationRate(configuredInputs, result.dps)
  const headerResult = useMemo(
    () => ({ ...result, graduationRate: graduation.rate }),
    [result, graduation.rate],
  )

  const { t } = useI18n()
  const confirm = useConfirm()

  function persist(next: ProfilesState) {
    setCommitted(next)
    saveProfiles(next)
  }

  function handleSave() {
    const next: ProfilesState = {
      ...committed,
      profiles: committed.profiles.map((profile) =>
        profile.id === committed.activeId ? { ...profile, inputs: activeDraft } : profile,
      ),
    }
    persist(next)
    setLastSavedJson(draftJson)
    setSavedAt(Date.now())
  }
  async function handleReset() {
    if (isSimulationRunning) return
    if (!isDirty) return
    if (!(await confirm(t("Discard unsaved changes?")))) return
    const active = committed.profiles.find((profile) => profile.id === committed.activeId)
    if (!active) return
    const restored = JSON.parse(JSON.stringify(active.inputs)) as Inputs
    setActiveDraft(restored)
    setLastSavedJson(JSON.stringify(restored))
    setSavedAt(null)
  }

  async function selectProfile(id: string) {
    if (isSimulationRunning) return
    if (id === committed.activeId) return
    if (isDirty && !(await confirm(t("You have unsaved changes — switch profiles anyway?")))) return
    const target = committed.profiles.find((profile) => profile.id === id)
    if (!target) return
    const next: ProfilesState = { ...committed, activeId: id }
    persist(next)
    setActiveDraft(target.inputs)
    setLastSavedJson(JSON.stringify(target.inputs))
    setSavedAt(null)
  }

  async function createProfile() {
    if (isSimulationRunning) return
    if (isDirty && !(await confirm(t("You have unsaved changes — switch profiles anyway?")))) return
    setWizard({
      mode: "new-profile",
      defaultName: `${t("New profile")} ${committed.profiles.length + 1}`,
    })
  }

  function handleWizardFinish(name: string, finishedInputs: Inputs) {
    if (isSimulationRunning) return
    const profile: StoredProfile = {
      id: newProfileId(),
      name,
      inputs: finishedInputs,
    }
    const next: ProfilesState =
      wizard?.mode === "first-run"
        ? { profiles: [profile], activeId: profile.id }
        : { profiles: [...committed.profiles, profile], activeId: profile.id }
    persist(next)
    setActiveDraft(profile.inputs)
    setLastSavedJson(JSON.stringify(profile.inputs))
    setSavedAt(null)
    setWizard(null)
  }

  function renameProfile(id: string, name: string) {
    const next: ProfilesState = {
      ...committed,
      profiles: committed.profiles.map((profile) =>
        profile.id === id ? { ...profile, name } : profile,
      ),
    }
    persist(next)
  }

  function duplicateProfile(id: string) {
    const sourceProfile = committed.profiles.find((profile) => profile.id === id)
    if (!sourceProfile) return
    const copy: StoredProfile = {
      id: newProfileId(),
      name: `${sourceProfile.name} ${t("Copy")}`,
      inputs: sourceProfile.inputs,
    }
    const next: ProfilesState = {
      ...committed,
      profiles: [...committed.profiles, copy],
    }
    persist(next)
  }

  async function handleImportProfile(imported: StoredProfile) {
    if (isSimulationRunning) return
    if (isDirty && !(await confirm(t("You have unsaved changes — switch profiles anyway?")))) return
    const next: ProfilesState = {
      profiles: [...committed.profiles, imported],
      activeId: imported.id,
    }
    persist(next)
    setActiveDraft(imported.inputs)
    setLastSavedJson(JSON.stringify(imported.inputs))
    setSavedAt(null)
  }

  async function deleteProfile(id: string) {
    if (committed.profiles.length <= 1) return
    if (!(await confirm(t("Delete this profile?")))) return
    const remaining = committed.profiles.filter((profile) => profile.id !== id)
    let nextActive = committed.activeId
    if (id === committed.activeId) {
      nextActive = remaining[0].id
      setActiveDraft(remaining[0].inputs)
      setLastSavedJson(JSON.stringify(remaining[0].inputs))
      setSavedAt(null)
    }
    const next: ProfilesState = { profiles: remaining, activeId: nextActive }
    persist(next)
  }

  useEffect(() => {
    if (!savedAt) return
    const id = setTimeout(() => setSavedAt(null), 2500)
    return () => clearTimeout(id)
  }, [savedAt])

  const TABS: { path: string; label: string; align?: "right" }[] = [
    { path: "/overview", label: t("Overview") },
    { path: "/gear", label: t("Gear") },
    { path: "/rotation", label: t("Rotation") },
    { path: "/simulation", label: t("Simulation") },
    { path: "/skills", label: t("Skill Editor") },
    { path: "/talents", label: t("Talents & Oddities") },
    { path: "/profile", label: t("Profiles"), align: "right" },
  ]

  return (
    <div className={styles.app}>
      <DpsActivityToast hidden={isSimulationRunning} />
      <SimulationToast
        status={simulation.status}
        done={simulation.progress.done}
        total={simulation.progress.total}
        hasUnacknowledgedRun={acknowledgedRunCount < startedRunCount}
        onCancel={simulation.cancel}
        onAcknowledge={acknowledgeSimulation}
      />
      {wizard && (
        <SetupWizard
          mode={wizard.mode}
          initialName={wizard.defaultName}
          initialInputs={blankInputs}
          onFinish={handleWizardFinish}
          onCancel={wizard.mode === "new-profile" ? () => setWizard(null) : undefined}
        />
      )}
      {graduationDialogOpen && (
        <GraduationBuildDialog
          inputs={configuredInputs}
          theoreticalDps={graduation.theoreticalDps}
          relayedTheoreticalDps={graduation.relayedTheoreticalDps}
          onClose={() => setGraduationDialogOpen(false)}
        />
      )}
      <div className={styles.appHeader}>
        <header className={styles.appTitlebar}>
          <div className={styles.appTitle}>
            <h1>{t("Where Winds Meet DPS")}</h1>
            <ChangelogButton />
          </div>
          <div className={styles.appTitlebarActions}>
            <GithubLink />
            <button
              type="button"
              className={"save-btn" + (isDirty ? " dirty" : "")}
              onClick={handleSave}
              disabled={!isDirty}
              aria-label={t("Save")}
            >
              {savedAt && !isDirty ? t("Saved ✓") : isDirty ? t("Save") : t("Saved")}
            </button>
            <button
              type="button"
              className="reset-btn"
              onClick={handleReset}
              disabled={!isDirty || isSimulationRunning}
              aria-label={t("Discard changes")}
              title={t("Discard edits since the last save")}
            >
              {t("Discard changes")}
            </button>
          </div>
        </header>

        <MetricsCard
          result={headerResult}
          className={styles.headerMetrics}
          graduationPending={graduation.isPending}
          theoreticalDps={graduation.theoreticalDps}
          onGraduationClick={() => setGraduationDialogOpen(true)}
          graduationDisabled={isSimulationRunning}
        />

        <nav className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              role="tab"
              className={({ isActive }) =>
                styles.tab +
                (isActive ? ` ${styles.active}` : "") +
                (tab.align === "right" ? ` ${styles.tabRight}` : "")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={styles.tabPanel}>
        <WarningsList result={result} />
        <fieldset className={styles.routeFields} disabled={areInputsLocked}>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route
              path="/overview"
              element={
                <OverviewTab
                  inputs={inputs}
                  engineInputs={engineInputs}
                  onChange={setInputs}
                  result={result}
                />
              }
            />
            <Route
              path="/gear"
              element={
                <GearTab
                  inputs={inputs}
                  engineInputs={engineInputs}
                  onChange={setInputs}
                  currentDps={result.dps}
                />
              }
            />
            <Route
              path="/rotation"
              element={
                <RotationTab
                  inputs={inputs}
                  engineInputs={engineInputs}
                  onChange={setInputs}
                  result={result}
                />
              }
            />
            <Route
              path="/simulation"
              element={
                <SimulationTab
                  inputs={inputs}
                  engineInputs={engineInputs}
                  expectedDps={result.dps}
                  simulation={{ ...simulation, start: startSimulation }}
                />
              }
            />
            <Route
              path="/skills"
              element={
                <SkillsTab
                  inputs={inputs}
                  engineInputs={engineInputs}
                  customSkills={customSkills}
                  onCustomSkillsChange={changeCustomSkills}
                  customBuffs={customBuffs}
                  customDebuffs={customDebuffs}
                />
              }
            />
            <Route path="/buffs" element={<Navigate to="/skills" replace />} />
            <Route path="/debuffs" element={<Navigate to="/skills" replace />} />
            <Route
              path="/talents"
              element={<TalentsOdditiesTab inputs={inputs} onChange={setInputs} />}
            />
            <Route path="/oddities" element={<Navigate to="/talents" replace />} />
            <Route
              path="/profile"
              element={
                <div className="panel">
                  <ProfilePanel
                    profiles={committed.profiles}
                    activeId={committed.activeId}
                    onCreate={createProfile}
                    onSelect={selectProfile}
                    onRename={renameProfile}
                    onDuplicate={duplicateProfile}
                    onDelete={deleteProfile}
                    onImport={handleImportProfile}
                  />
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </fieldset>
      </div>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <I18nProvider>
        <ConfirmProvider>
          <AppInner />
        </ConfirmProvider>
      </I18nProvider>
    </HashRouter>
  )
}
