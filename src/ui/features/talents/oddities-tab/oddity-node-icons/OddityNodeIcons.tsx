const BLADE =
  "M12 1.9 C12.8 7.4 13.4 12.4 13.6 16.8 L12 18.3 L10.4 16.8 C10.6 12.4 11.2 7.4 12 1.9 Z"
const SHIELD = "M12 2.6 L19 5.6 V11.6 C19 15.6 16.1 18.8 12 20 C7.9 18.8 5 15.6 5 11.6 V5.6 Z"
const GEAR = "M12 3.4 L18.6 6.2 V12 C18.6 15.4 15.8 18.2 12 19.4 C8.2 18.2 5.4 15.4 5.4 12 V6.2 Z"
const GEAR_LINES = "M8.6 10.4 H15.4 M8.6 13.4 H15.4"
const SPIRAL = "M13.4 12 A1.4 1.4 0 1 1 12 10.6 A3.4 3.4 0 1 0 15.4 14 A5.4 5.4 0 1 1 10 19.4"
const OUTPOST_TAG = "M19.2 3.4 V9.4 M19.2 3.8 L22.6 4.9 L19.2 6 Z"
const CAMPAIGN_TAG = "M17.4 3 H22.2 V9.6 L19.8 8 L17.4 9.6 Z"
const TRIAL_TAG = "M19.8 2.6 L20.8 7.4 L19.8 8.4 L18.8 7.4 Z M17.8 9 H21.8"

function Coin() {
  return (
    <>
      <circle cx="12" cy="11.4" r="6.4" />
      <rect x="9.4" y="8.8" width="5.2" height="5.2" transform="rotate(45 12 11.4)" />
    </>
  )
}

function Gear() {
  return (
    <>
      <path d={GEAR} />
      <path d={GEAR_LINES} opacity="0.7" />
    </>
  )
}

export function OddityNodeIcons() {
  return (
    <defs>
      <symbol id="oddityIconHp" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path
          d="M12 17.6 C12 17.6 6.8 14 6.8 10.7 A2.9 2.9 0 0 1 12 9 A2.9 2.9 0 0 1 17.2 10.7 C17.2 14 12 17.6 12 17.6 Z"
          fill="currentColor"
          stroke="none"
        />
      </symbol>

      <symbol id="oddityIconAtkMax" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          stroke="none"
          transform="rotate(-34 12 12)"
          d="M12 2.4 C12.6 7 13 10.8 13 12 C13 13.2 12.6 17 12 21.6 C11.4 17 11 13.2 11 12 C11 10.8 11.4 7 12 2.4 Z"
        />
        <path
          fill="currentColor"
          stroke="none"
          transform="rotate(34 12 12)"
          d="M12 2.4 C12.6 7 13 10.8 13 12 C13 13.2 12.6 17 12 21.6 C11.4 17 11 13.2 11 12 C11 10.8 11.4 7 12 2.4 Z"
        />
      </symbol>

      <symbol id="oddityIconAtkMin" viewBox="0 0 24 24">
        <path d={BLADE} fill="currentColor" stroke="none" />
        <circle cx="12" cy="20.4" r="1.2" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconDef" viewBox="0 0 24 24">
        <path d={SHIELD} />
        <path d="M8.6 11.3 H15.4 M12 8 V14.6" opacity="0.75" />
      </symbol>

      <symbol id="oddityIconEndurance" viewBox="0 0 24 24">
        <path
          d="M3.2 9 C5.4 6.6 7.6 6.6 9.8 9 C12 11.4 14.2 11.4 16.4 9 C18.6 6.6 20.8 6.6 21.4 7.6"
          strokeLinecap="round"
        />
        <path
          d="M3.2 15.4 C5.4 13 7.6 13 9.8 15.4 C12 17.8 14.2 17.8 16.4 15.4 C18.6 13 20.8 13 21.4 14"
          strokeLinecap="round"
          opacity="0.6"
        />
      </symbol>

      <symbol id="oddityIconVitality" viewBox="0 0 24 24">
        <path d="M12 3.2 C12 3.2 5.8 10.2 5.8 14.2 A6.2 6.2 0 0 0 18.2 14.2 C18.2 10.2 12 3.2 12 3.2 Z" />
        <path
          d="M9.2 14 C10.4 12.6 11.4 14.8 12.6 14.8 C13.8 14.8 14.6 13.2 15.2 13.8"
          opacity="0.8"
        />
      </symbol>

      <symbol id="oddityIconInnerWay" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 3.6 A4.2 4.2 0 0 1 12 12 A4.2 4.2 0 0 0 12 20.4" />
        <circle cx="12" cy="7.8" r="1.2" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconMystic" viewBox="0 0 24 24">
        <path d={SPIRAL} />
        <path d="M3.8 6.6 C6.2 4.8 8.6 4.8 11 6.6" opacity="0.55" />
      </symbol>

      <symbol id="oddityIconMysticMat" viewBox="0 0 24 24">
        <path d={SPIRAL} />
        <path
          d="M18.8 3.2 L19.6 5.4 L21.8 6.2 L19.6 7 L18.8 9.2 L18 7 L15.8 6.2 L18 5.4 Z"
          fill="currentColor"
          stroke="none"
          opacity="0.85"
        />
      </symbol>

      <symbol id="oddityIconOutfit" viewBox="0 0 24 24">
        <path d="M9 3.4 L12 6 L15 3.4 L19.4 6 L17.6 10 L16.2 9.2 V20.4 H7.8 V9.2 L6.4 10 L4.6 6 Z" />
      </symbol>

      <symbol id="oddityIconBell" viewBox="0 0 24 24">
        <path d="M7.4 17.4 C7.4 12.6 8.2 9.4 8.2 6.6 H15.8 C15.8 9.4 16.6 12.6 16.6 17.4 Z" />
        <path d="M6.2 17.4 H17.8" />
        <path d="M9.8 6.6 C9.8 5 10.8 4 12 4 C13.2 4 14.2 5 14.2 6.6" opacity="0.8" />
        <circle cx="12" cy="13.4" r="1.2" fill="currentColor" stroke="none" opacity="0.7" />
      </symbol>

      <symbol id="oddityIconDmgNormal" viewBox="0 0 24 24">
        <path d={BLADE} fill="currentColor" stroke="none" />
        <circle cx="6.2" cy="19.4" r="1.2" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconDmgElite" viewBox="0 0 24 24">
        <path d={BLADE} fill="currentColor" stroke="none" />
        <circle cx="5" cy="19.4" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="8.6" cy="19.4" r="1.2" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconDmgBoss" viewBox="0 0 24 24">
        <path d={BLADE} fill="currentColor" stroke="none" />
        <path d="M4 21 L5.6 17.2 L7.2 19 L8.8 17.2 L10.4 21 Z" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconRdcNormal" viewBox="0 0 24 24">
        <path d={SHIELD} />
        <circle cx="12" cy="11.6" r="1.3" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconRdcElite" viewBox="0 0 24 24">
        <path d={SHIELD} />
        <circle cx="10" cy="11.6" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="14" cy="11.6" r="1.3" fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconRdcBoss" viewBox="0 0 24 24">
        <path d={SHIELD} />
        <path
          d="M8.4 14 L9.8 10.2 L12 12.4 L14.2 10.2 L15.6 14 Z"
          fill="currentColor"
          stroke="none"
        />
      </symbol>

      <symbol id="oddityIconGearDrop" viewBox="0 0 24 24">
        <Gear />
      </symbol>

      <symbol id="oddityIconGearOutpost" viewBox="0 0 24 24">
        <Gear />
        <path d={OUTPOST_TAG} fill="currentColor" />
      </symbol>

      <symbol id="oddityIconGearCampaign" viewBox="0 0 24 24">
        <Gear />
        <path d={CAMPAIGN_TAG} fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconGearTrial" viewBox="0 0 24 24">
        <Gear />
        <path d={TRIAL_TAG} fill="currentColor" />
      </symbol>

      <symbol id="oddityIconCoinDrop" viewBox="0 0 24 24">
        <Coin />
      </symbol>

      <symbol id="oddityIconCoinOutpost" viewBox="0 0 24 24">
        <Coin />
        <path d={OUTPOST_TAG} fill="currentColor" />
      </symbol>

      <symbol id="oddityIconCoinCampaign" viewBox="0 0 24 24">
        <Coin />
        <path d={CAMPAIGN_TAG} fill="currentColor" stroke="none" />
      </symbol>

      <symbol id="oddityIconCoinTrial" viewBox="0 0 24 24">
        <Coin />
        <path d={TRIAL_TAG} fill="currentColor" />
      </symbol>
    </defs>
  )
}
