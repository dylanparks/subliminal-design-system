/**
 * icons.tsx — Subliminal Design System
 *
 * All icons are Material Symbols Rounded (weight 400, optical size 24dp).
 * Source: @material-symbols/svg-400/rounded
 *
 * Usage:
 *   import { CloseIcon, SearchIcon } from '../../icons';
 *   <CloseIcon size={20} className="my-class" />
 *
 * Every icon accepts the full set of SVG element props so consumers can pass
 * aria-label, style, data-*, etc. The `size` shorthand sets both width and
 * height in one prop. `aria-hidden` defaults to "true" since icons are always
 * paired with a visible or screen-reader label at the component level.
 */

import type { SVGProps } from 'react';

// ─── Base ─────────────────────────────────────────────────────────────────────

interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Sets both width and height of the icon in pixels.
   * @default 24
   */
  size?: number;
}

function Icon({
  size = 24,
  'aria-hidden': ariaHidden = 'true',
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden={ariaHidden}
      {...rest}
    >
      {children}
    </svg>
  );
}

// ─── Action icons ─────────────────────────────────────────────────────────────

/** close — dismiss, clear, or remove */
export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z" />
    </Icon>
  );
}

/** add — increment, add item */
export function AddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M450-450H230q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h220v-220q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v220h220q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H510v220q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-220Z" />
    </Icon>
  );
}

/** remove — decrement, subtract */
export function RemoveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M230-450q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h500q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H230Z" />
    </Icon>
  );
}

// ─── Navigation / selection icons ─────────────────────────────────────────────

/** check — selected state indicator (single-select, checkbox) */
export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m378-332 363-363q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L399-267q-9 9-21 9t-21-9L175-449q-9-9-8.5-21.5T176-492q9-9 21.5-9t21.5 9l159 160Z" />
    </Icon>
  );
}

/** keyboard_arrow_down — select/combobox open indicator */
export function KeyboardArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M469-358q-5-2-10-7L261-563q-9-9-8.5-21.5T262-606q9-9 21.5-9t21.5 9l175 176 176-176q9-9 21-8.5t21 9.5q9 9 9 21.5t-9 21.5L501-365q-5 5-10 7t-11 2q-6 0-11-2Z" />
    </Icon>
  );
}

/** keyboard_arrow_up — select/combobox close indicator */
export function KeyboardArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M480-554 304-378q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l197-197q9-9 21-9t21 9l198 198q9 9 9 21t-9 21q-9 9-21.5 9t-21.5-9L480-554Z" />
    </Icon>
  );
}

/** chevron_right — submenu indicator, suffix icon */
export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M530-481 353-658q-9-9-8.5-21t9.5-21q9-9 21.5-9t21.5 9l198 198q5 5 7 10t2 11q0 6-2 11t-7 10L396-261q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l176-176Z" />
    </Icon>
  );
}

/** chevron_left — datepicker previous-month nav */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M431-481 607-658q9-9 8.5-21t-9.5-21q-9-9-21.5-9t-21.5 9L365-502q-5 5-7 10t-2 11q0 6 2 11t7 10l198 198q9 9 21 8.5t21-9.5q9-9 9-21.5t-9-21.5L431-481Z" />
    </Icon>
  );
}

/** schedule — timepicker trigger icon */
export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M513-492v-171q0-13-8.5-21.5T483-693q-13 0-21.5 8.5T453-663v183q0 6 2 11t6 10l144 149q9 10 22.5 9.5T650-310q9-9 9-22t-9-22L513-492ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-82 31.5-155t86-127.5Q252-817 325-848.5T480-880q82 0 155 31.5t127.5 86Q817-708 848.5-635T880-480q0 82-31.5 155t-86 127.5Q708-143 635-111.5T480-80Zm0-400Zm0 340q140 0 240-100t100-240q0-140-100-240T480-820q-140 0-240 100T140-480q0 140 100 240t240 100Z" />
    </Icon>
  );
}

/** calendar_month — datepicker trigger icon */
export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
    </Icon>
  );
}

/** arrow_forward — date-range separator */
export function ArrowForwardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M647-440H160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h487L423-744q-12-12-11.5-28.5T424-801q12-12 28.5-12t28.5 12l264 264q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L481-217q-12 12-28.5 11.5T424-218q-12-12-12-28.5t12-28.5l223-225Z" />
    </Icon>
  );
}

/** drag_handle — configure menu reorder handle */
export function DragHandleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M190-390q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm0-120q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Z" />
    </Icon>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** search — search field leading icon */
export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" />
    </Icon>
  );
}

// ─── Visibility ───────────────────────────────────────────────────────────────

/** visibility — show password */
export function VisibilityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M600.5-379.62q49.5-49.62 49.5-120.5T600.38-620.5Q550.76-670 479.88-670T359.5-620.38Q310-570.76 310-499.88t49.62 120.38q49.62 49.5 120.5 49.5t120.38-49.62Zm-200-41.12q-32.5-32.73-32.5-79.5 0-46.76 32.74-79.26 32.73-32.5 79.5-32.5 46.76 0 79.26 32.74 32.5 32.73 32.5 79.5 0 46.76-32.74 79.26-32.73 32.5-79.5 32.5-46.76 0-79.26-32.74ZM234.5-276Q124-352 57-470q-4-7.13-6-14.65-2-7.52-2-15.43 0-7.92 2-15.38 2-7.47 6-14.54 67-118 177.5-194T480-800q135 0 245.5 76T903-530q4 7.12 6 14.65 2 7.52 2 15.43 0 7.92-2 15.38-2 7.47-6 14.54-67 118-177.5 194T480-200q-135 0-245.5-76ZM480-500Zm222.5 174.5Q804-391 857-500q-53-109-154.33-174.5Q601.34-740 480.17-740T257.5-674.5Q156-609 102-500q54 109 155.33 174.5Q358.66-260 479.83-260t222.67-65.5Z" />
    </Icon>
  );
}

/** visibility_off — hide password */
export function VisibilityOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M600-620q29 29 42.5 71.5T647-464q0 13-8.5 21.5T617-434q-13 0-21.5-8.5T587-464q11-34 2.5-64.5T559-580q-21-22-52-30t-64 3q-13 0-21.5-8.5T413-637q0-13 8.5-21.5T443-667q42-9 85 4.5t72 42.5ZM490-740q-32 0-64 3t-63 13q-12 4-24-1t-17-16q-5-11 0-22.5t16-15.5q35-11 72-16t75-5q137 0 249.5 75.5T907-526q3 6 5 12.5t2 13.5q0 7-1.5 13.5T908-474q-23 49-55 90.5T779-307q-9 8-20 5.5T741-313q-7-9-5.5-20t10.5-19q36-30 65-66.5t46-81.5q-49-109-148-174.5T490-740Zm-10 540q-136 0-247.5-76T55-472q-4-7-5.5-13.5T48-500q0-8 2-14.5t5-13.5q24-48 55.5-90.5T182-696L77-801q-9-9-8.5-21t8.5-21q9-9 21.5-9t21.5 9l716 716q8 8 8 19.5T836-87q-8 10-20.5 10T794-86L648-229q-41 15-83 22t-85 7ZM223-654q-41 29-72 68t-49 86q52 112 156.5 176T488-260q29 0 58-1.5t55-14.5l-64-64q-14 6-28.5 8t-28.5 2q-71 0-120.5-49.5T310-500q0-14 2.5-28.5T320-557l-97-97Zm305 142Zm-116 58Z" />
    </Icon>
  );
}

// ─── Status icons (filled, rounded) ──────────────────────────────────────────

/** check_circle fill — success state */
export function SuccessIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m421-389-98-98q-9-9-22-9t-23 10q-9 9-9 22t9 22l122 123q9 9 21 9t21-9l239-239q10-10 10-23t-10-23q-10-9-23.5-8.5T635-603L421-389Zm59 309q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z" />
    </Icon>
  );
}

/** dangerous fill — error state */
export function ErrorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M355-120q-12 0-23.5-5T312-138L138-312q-8-8-13-19.5t-5-23.5v-250q0-12 5-23.5t13-19.5l174-174q8-8 19.5-13t23.5-5h250q12 0 23.5 5t19.5 13l174 174q8 8 13 19.5t5 23.5v250q0 12-5 23.5T822-312L648-138q-8 8-19.5 13t-23.5 5H355Zm125-318 102 102q9 9 21 9t21-9q9-9 9-21t-9-21L522-480l102-102q9-9 9-21t-9-21q-9-9-21-9t-21 9L480-522 378-624q-9-9-21-9t-21 9q-9 9-9 21t9 21l102 102-102 102q-9 9-9 21t9 21q9 9 21 9t21-9l102-102Z" />
    </Icon>
  );
}

/** warning fill — warning state */
export function WarningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M92-120q-9 0-15.5-4T66-135q-4-7-4.5-14.5T66-165l388-670q5-8 11.5-11.5T480-850q8 0 14.5 3.5T506-835l388 670q5 8 4.5 15.5T894-135q-4 7-10.5 11t-15.5 4H92Zm413.5-125.5Q514-254 514-267t-8.5-21.5Q497-297 484-297t-21.5 8.5Q454-280 454-267t8.5 21.5Q471-237 484-237t21.5-8.5Zm0-111Q514-365 514-378v-164q0-13-8.5-21.5T484-572q-13 0-21.5 8.5T454-542v164q0 13 8.5 21.5T484-348q13 0 21.5-8.5Z" />
    </Icon>
  );
}

/** info fill — informative state */
export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M504.5-288.63q8.5-8.62 8.5-21.37v-180q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v180q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm-1-314.57q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Z" />
    </Icon>
  );
}

// ─── Rating icons ─────────────────────────────────────────────────────────────

/** star (filled) — selected rating star */
export function StarFilledIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M480-269 294-157q-8 5-17 4.5t-16-5.5q-7-5-10.5-13t-1.5-18l49-212-164-143q-8-7-9.5-15.5t.5-16.5q2-8 9-13.5t17-6.5l217-19 84-200q4-9 12-13.5t16-4.5q8 0 16 4.5t12 13.5l84 200 217 19q10 1 17 6.5t9 13.5q2 8 .5 16.5T826-544L662-401l49 212q2 10-1.5 18T699-158q-7 5-16 5.5t-17-4.5L480-269Z" />
    </Icon>
  );
}

// ─── Story / placeholder icons ────────────────────────────────────────────────
// Used in Storybook stories only — not part of production component API.

/** diamond — story placeholder icon */
export function DiamondIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M455-159q-12-5-21-16L105-570q-7-8-10.5-17.5T91-608q0-7 2-13.5t5-13.5l85-172q8-15 22.5-24t31.5-9h486q17 0 31.5 9t22.5 24l85 172q3 7 5 13.5t2 13.5q0 11-3.5 20.5T855-570L526-175q-9 11-21 16t-25 5q-13 0-25-5Zm-87-471h224l-75-150h-74l-75 150Zm82 381v-321H183l267 321Zm60 0 267-321H510v321Zm149-381h136l-75-150H584l75 150Zm-494 0h136l75-150H240l-75 150Z" />
    </Icon>
  );
}

/** star — story placeholder icon */
export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m323-245 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm157-24L294-157q-8 5-17 4.5t-16-5.5q-7-5-10.5-13t-1.5-18l49-212-164-143q-8-7-9.5-15.5t.5-16.5q2-8 9-13.5t17-6.5l217-19 84-200q4-9 12-13.5t16-4.5q8 0 16 4.5t12 13.5l84 200 217 19q10 1 17 6.5t9 13.5q2 8 .5 16.5T826-544L662-401l49 212q2 10-1.5 18T699-158q-7 5-16 5.5t-17-4.5L480-269Zm0-206Z" />
    </Icon>
  );
}

/** upload — file upload prompt */
export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
    </Icon>
  );
}

/** settings — story placeholder icon */
export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M421-80q-14 0-25-9t-13-23l-15-94q-19-7-40-19t-37-25l-86 40q-14 6-28 1.5T155-226L97-330q-8-13-4.5-27t15.5-23l80-59q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-80-59q-12-9-15.5-23t4.5-27l58-104q8-13 22-17.5t28 1.5l86 40q16-13 37-25t40-18l15-95q2-14 13-23t25-9h118q14 0 25 9t13 23l15 94q19 7 40.5 18.5T669-710l86-40q14-6 27.5-1.5T804-734l59 104q8 13 4.5 27.5T852-580l-80 57q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l80 58q12 8 15.5 22.5T863-330l-58 104q-8 13-22 17.5t-28-1.5l-86-40q-16 13-36.5 25.5T592-206l-15 94q-2 14-13 23t-25 9H421Zm15-60h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Zm44-210q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-130Z" />
    </Icon>
  );
}
