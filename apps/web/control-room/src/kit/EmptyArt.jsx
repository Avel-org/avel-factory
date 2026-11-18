/*
 * Empty-state illustrations, vendored from ricoui-blocks (registry/empty-states.tsx,
 * https://github.com/ricocc/ricoui-blocks), MIT License, Copyright (c) 2026 Ricocc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions: The above copyright notice and this
 * permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
 *
 * AVEL changes: TypeScript types removed for the prototype's JSX; colours tinted to Enclosure Grid
 * (cobalt accent, graphite night). Geometry and motion are unchanged. Reviewed Nov 14: pure SVG and
 * CSS, no network, no scripts, motion off under prefers-reduced-motion.
 */
﻿import { useId } from 'react'

export const emptyStateLabels = {
  blockedPage: 'Page unavailable', noResults: 'No results', noCommands: 'No commands',
  noTabs: 'No open tabs', emptyFolder: 'Empty folder', emptyList: 'Empty list',
  loadFailed: 'Unable to load', nothing: 'Nothing here yet', offline: 'You are offline',
  accessDenied: 'Access denied', sessionExpired: 'Session expired', noNotifications: 'No notifications',
}
// Original SVG geometry: porcelain instrument panels, engraved symbols and local mechanical motion.
// Each state shares the same illustration and motion API.
export function EmptyStates({ state = 'emptyFolder', theme = 'auto', title = emptyStateLabels[state], animated = true, width = 240, height = 180, ...props }) {
  const id = 'empty-instrument-' + Array.from(useId(), c => c.codePointAt(0).toString(16)).join('-')
  const url = (name) => `url(#${id}-${name})`
  const dark = '--ei-bg:#1f2026;--ei-well:#18191e;--ei-top:#34363e;--ei-bottom:#26272e;--ei-edge:#474a55;--ei-faint:#33353d;--ei-ink:#a3a7b4;--ei-light:#5f6370;--ei-shadow:#000000;--ei-shadow-alpha:.5;--ei-accent:#7ba1fc;'
  const raised = (children, motion) => <g className={motion ? `ei-motion ${motion}` : undefined} filter={url('shadow')}>{children}</g>
  const plate = (x, y, w, h, radius = 5) => <rect x={x} y={y} width={w} height={h} rx={radius} fill={url('face')} stroke="var(--ei-edge)" />
  const screw = (x, y) => <g key={`${x}-${y}`}><circle cx={x} cy={y + .7} r="1.7" fill="var(--ei-edge)" opacity=".45" /><circle cx={x} cy={y} r="1.5" fill="var(--ei-light)" stroke="none" /></g>
  const ticks = (x, y, count = 8) => <g stroke="var(--ei-edge)" strokeWidth=".7">{Array.from({ length: count }, (_, i) => <path key={i} d={`M${x + i * 4} ${y}v${i % 4 === 0 ? 5 : 2.5}`} />)}</g>
  const cross = (x, y, r = 3) => <path d={`M${x - r} ${y}h${r * 2}m-${r} -${r}v${r * 2}`} />
  let scene
  switch (state) {
    case 'blockedPage': scene = <>
      <path d="M48 73h16m96 32h30" className="ei-wire" />
      {raised(<>{plate(69, 48, 89, 84)}<path d="M75 54h57l19 19v53H75Z" fill="none" stroke="var(--ei-faint)" /><path d="M132 54v19h19" fill="none" /><path d="M84 117h25m5 0h12" stroke="var(--ei-edge)" />
        <circle cx="112" cy="87" r="16" fill={url('well')} /><circle cx="112" cy="87" r="12.5" fill="none" stroke="var(--ei-ink)" />
        <path className="ei-motion ei-barrier" d="m104 79 16 16" stroke="var(--ei-ink)" strokeWidth="1.25" />
      </>, 'ei-recoil')}
      {raised(<g>{plate(170, 73, 22, 22, 3)}<g className="ei-motion ei-open" stroke="var(--ei-ink)" fill="none"><path d="M176 81v8h8m-5-10h7v7m0-7-8 8" /></g></g>)}
      {ticks(79, 140, 17)}
    </>; break
    case 'noResults': scene = <>
      <rect x="63" y="52" width="110" height="77" rx="5" fill={url('well')} stroke="var(--ei-faint)" />
      <path d="M70 62h24m-24 4h14m64 50h17" stroke="var(--ei-edge)" />
      <g transform="translate(118 89)"><circle r="32" fill="none" stroke="var(--ei-faint)" strokeDasharray="1 3" /><circle className="ei-motion ei-radar" r="25" fill="none" strokeDasharray="2 3" />
        <g className="ei-motion ei-sweep"><path d="M0-32A32 32 0 0 1 32 0" fill="none" stroke="var(--ei-ink)" opacity=".45" /><circle cx="0" cy="-32" r="1.5" fill="var(--ei-light)" stroke="none" /></g>
        {raised(<><circle r="15" fill={url('face')} stroke="var(--ei-ink)" /><path d="m11 11 13 13" stroke="var(--ei-ink)" strokeWidth="2.5" /><path d="M-5-6h10" stroke="var(--ei-edge)" /></>, 'ei-search')}
      </g>
      <path d="M90 141h60" stroke="var(--ei-faint)" />{ticks(104, 139, 9)}
    </>; break
    case 'noCommands': scene = <>
      {raised(<>{plate(56, 53, 128, 69)}<rect x="62" y="59" width="116" height="55" rx="2" fill={url('well')} stroke="var(--ei-faint)" />
        <path className="ei-motion ei-prompt" d="m83 76 10 10-10 10" fill="none" stroke="var(--ei-ink)" strokeWidth="1.5" />
        <path d="M107 96h20" stroke="var(--ei-ink)" className="ei-motion ei-cursor" /><path className="ei-motion ei-lines" d="M135 79h27m-27 7h16" stroke="var(--ei-faint)" />
      </>)}
      {[0, 1, 2, 3, 4].map(i => <g key={i} className={`ei-motion ei-key ei-step-${i}`}>{plate(78 + i * 18, 132, 13, 7, 2)}<path d={`M${82 + i * 18} 135h5`} stroke="var(--ei-edge)" /></g>)}
      <path d="M120 123v7" stroke="var(--ei-edge)" />
    </>; break
    case 'noTabs': scene = <>
      <path className="ei-motion ei-stack-back" d="M73 47h98v70" fill="none" stroke="var(--ei-faint)" /><path className="ei-motion ei-stack-front" d="M66 53h98v70" fill="none" />
      {raised(<>{plate(58, 60, 102, 71)}<path d="M59 78h100" stroke="var(--ei-edge)" /><path d="M65 78V66h34v12" fill={url('well')} strokeDasharray="2 2" className="ei-motion ei-tab" />
        <rect className="ei-motion ei-slot" x="68" y="87" width="82" height="34" rx="3" fill={url('well')} strokeDasharray="1 3" />
      </>)}
      {raised(<g className="ei-motion ei-key">{plate(174, 92, 22, 22, 3)}<g stroke="var(--ei-ink)">{cross(185, 103, 4)}</g></g>)}
      {ticks(93, 142, 13)}
    </>; break
    case 'emptyFolder': scene = <>
      <g mask={url('fade')}>
        <path className="ei-motion ei-folder-back" d="M62 70V52q0-6 6-6h25l12 9h61q7 0 7 7v59" fill={url('face')} stroke="var(--ei-edge)" />
        {raised(<><path d="M57 66h113q7 0 7 7v65H50V73q0-7 7-7Z" fill={url('face')} stroke="var(--ei-ink)" strokeOpacity=".65" />
          <path d="M59 70h109q5 0 5 5v60H54V75q0-5 5-5Z" fill={url('well')} stroke="var(--ei-light)" />
        </>, 'ei-folder-frame')}
        <g className="ei-motion ei-folder-leaf"><rect x="89" y="89" width="27" height="31" rx="4" fill={url('face')} stroke="var(--ei-edge)" /><path d="M96 96h13m-13 5h9" stroke="var(--ei-faint)" /></g>
        <rect className="ei-motion ei-leaf-front" x="108" y="102" width="27" height="31" rx="4" fill={url('face')} stroke="var(--ei-ink)" strokeOpacity=".5" />
      </g>
      <rect className="ei-motion ei-drift-left" x="36" y="89" width="12" height="22" rx="3" fill="none" stroke="var(--ei-edge)" strokeDasharray="1 2" opacity=".55" />
      <rect className="ei-motion ei-drift-right" x="182" y="59" width="12" height="18" rx="3" fill="none" stroke="var(--ei-edge)" strokeDasharray="1 2" opacity=".55" />
    </>; break
    case 'emptyList': scene = <>
      {raised(<>{plate(65, 48, 108, 85)}<path d="M74 58h36m-36 4h22" stroke="var(--ei-edge)" />
        {[0, 1, 2].map(i => <g key={i} className={`ei-motion ei-row ei-step-${i}`}><rect x="76" y={73 + i * 17} width="9" height="9" rx="1.5" fill={url('well')} /><path d={`M94 ${77.5 + i * 17}h56`} stroke="var(--ei-faint)" strokeDasharray="2 3" /></g>)}
      </>)}
      <path d="M184 64v64" stroke="var(--ei-edge)" /><g className="ei-motion ei-list-marker">{plate(181, 74, 6, 14, 2)}<path d="M182.5 79h3m-3 3h3" stroke="var(--ei-ink)" /></g>
      {ticks(86, 142, 17)}
    </>; break
    case 'loadFailed': scene = <>
      <path d="M53 94h20m87 0h28" className="ei-wire" />
      {raised(<>{plate(79, 49, 73, 85)}<path d="M85 55h40l21 20v52H85Z" fill={url('well')} stroke="var(--ei-faint)" /><path d="M125 55v20h21" fill="none" />
        <path d="M115 78v15" stroke="var(--ei-ink)" className="ei-motion ei-download" /><path d="m109 90 6 6 6-6" fill="none" stroke="var(--ei-ink)" /><path d="M99 108v8h32v-8" fill="none" />
        <path className="ei-motion ei-error" d="m112 101 6 6m0-6-6 6" stroke="var(--ei-accent)" />
      </>, 'ei-recoil')}
      {raised(<g>{plate(165, 111, 25, 25, 4)}<g transform="translate(177.5 123.5)"><g className="ei-motion ei-retry" fill="none" stroke="var(--ei-ink)"><path d="M6-1a6 6 0 1 0-2 6M6-6v5H1" /></g></g></g>)}
    </>; break
    case 'nothing': scene = <>
      <ellipse className="ei-motion ei-shadow" cx="120" cy="130" rx="45" ry="5" fill="var(--ei-shadow)" opacity=".045" stroke="none" />
      <g className="ei-motion ei-object" mask={url('fade')}>
        <rect x="95" y="55" width="38" height="36" rx="5" fill={url('face')} stroke="var(--ei-edge)" /><rect x="102" y="62" width="38" height="36" rx="5" fill={url('well')} stroke="var(--ei-ink)" strokeOpacity=".5" />
      </g>
      {raised(<><path d="M76 100h88l10 25H66Z" fill={url('face')} /><path d="M66 125h32l5 6h34l5-6h32v12H66Z" fill={url('face')} /><path d="M76 100v17h88v-17" fill={url('well')} stroke="var(--ei-faint)" /></>)}
      <path className="ei-motion ei-drift-left" d="M52 86h10m-5-5v10m123-14h6m-3-3v6" stroke="var(--ei-faint)" />
      <g clipPath={url('scan-clip')}>
        <g className="ei-motion ei-scan" opacity="0" stroke="none">
          <rect x="49" y="43" width="4" height="94" rx="2" fill={url('scan-light')} opacity=".6" filter={url('scan-glow')} />
          <rect x="50.6" y="43" width=".8" height="94" rx=".4" fill={url('scan-light')} />
        </g>
      </g>
    </>; break
    case 'offline': scene = <>
      <path d="M43 100h20m114 0h20" className="ei-wire" />
      {raised(<>{plate(62, 79, 31, 42, 4)}{plate(147, 79, 31, 42, 4)}<rect className="ei-motion ei-port-left" x="69" y="86" width="17" height="19" rx="2" fill={url('well')} /><rect className="ei-motion ei-port-right" x="154" y="86" width="17" height="19" rx="2" fill={url('well')} /><path d="M72 114h11m73 0h11" stroke="var(--ei-faint)" /></>)}
      <path className="ei-motion ei-signal" d="M94 99h17m18 0h17" stroke="var(--ei-ink)" strokeDasharray="2 3" />
      <path d="m117 96 6 6m0-6-6 6" stroke="var(--ei-accent)" />
      <g className="ei-motion ei-wave" fill="none"><path className="ei-motion ei-wave-outer" d="M89 63q31-26 62 0" stroke="var(--ei-faint)" /><path className="ei-motion ei-wave-inner" d="M102 70q18-15 36 0" stroke="var(--ei-edge)" /></g>
      {ticks(100, 137, 11)}
    </>; break
    case 'accessDenied': scene = <>
      <path className="ei-motion ei-guards" d="M49 72h21v39H49m142-39h-21v39h21" fill="none" stroke="var(--ei-faint)" />
      <rect x="74" y="49" width="92" height="86" rx="7" fill={url('well')} stroke="var(--ei-faint)" />
      <path className="ei-motion ei-shackle" d="M104 88V72a16 16 0 0 1 32 0v16" fill="none" stroke="var(--ei-ink)" strokeWidth="2" />
      <path className="ei-motion ei-shackle" d="M106 87V72a14 14 0 0 1 28 0v15" fill="none" stroke="var(--ei-light)" strokeWidth=".8" />
      {raised(<>{plate(96, 85, 48, 37, 4)}<path d="M101 89h38" stroke="var(--ei-light)" /><g className="ei-motion ei-keyhole"><circle cx="120" cy="100" r="3" fill={url('well')} stroke="var(--ei-ink)" /><path d="M120 103v6" stroke="var(--ei-ink)" strokeWidth="1.3" /></g></>, 'ei-lock')}
      {screw(81, 56)}{screw(159, 128)}
    </>; break
    case 'sessionExpired': scene = <>
      {raised(<>{plate(70, 51, 91, 80)}<path d="M111 45v14m9-14v14" stroke="var(--ei-edge)" /><rect x="105" y="54" width="21" height="4" rx="2" fill={url('well')} stroke="var(--ei-faint)" />
        <g className="ei-motion ei-identity" fill="none" stroke="var(--ei-ink)"><circle cx="115" cy="81" r="8" /><path d="M101 102c0-16 28-16 28 0" /></g>
        <path className="ei-motion ei-lines" d="M94 112h42m-34 5h26" stroke="var(--ei-edge)" />
      </>)}
      {raised(<>{plate(153, 102, 29, 34, 4)}<path d="M160 109h15m-15 20h15m-13-20c0 10 11 10 11 20m0-20c0 10-11 10-11 20" fill="none" stroke="var(--ei-ink)" /><path className="ei-motion ei-sand" d="M166 116h3m-2 3h1m-2 7h4" stroke="var(--ei-accent)" /></>, 'ei-hourglass')}
    </>; break
    case 'noNotifications': scene = <>
      <g transform="translate(120 89)"><circle className="ei-motion ei-ring" r="39" fill="none" stroke="var(--ei-faint)" strokeDasharray="1 3" /><circle r="31" fill="none" stroke="var(--ei-edge)" strokeDasharray="1 3" className="ei-motion ei-wave" /></g>
      {raised(<g className="ei-motion ei-bell"><path d="M99 108h42l-5-10V83c0-23-32-23-32 0v15Z" fill={url('face')} stroke="var(--ei-ink)" /><path d="M108 83c0-17 24-17 24 0" fill="none" stroke="var(--ei-light)" /><path d="M98 111h44" stroke="var(--ei-edge)" /></g>)}
      <g className="ei-motion ei-clapper"><path d="M115 116q5 6 10 0" fill="none" stroke="var(--ei-ink)" /></g>
      <path d="M104 137h32m-22 4h12" stroke="var(--ei-faint)" />
    </>; break
  }
  return <svg {...props} id={id} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width={width} height={height} data-state={state} data-theme={theme} data-animated={animated} role={title ? 'img' : undefined} aria-labelledby={title ? `${id}-title` : undefined} aria-hidden={title ? undefined : true} focusable="false" fill="none" stroke="var(--ei-edge)" strokeWidth=".85" strokeLinecap="round" strokeLinejoin="round">
    {title && <title id={`${id}-title`}>{title}</title>}
    <style>{`
      #${id}{--ei-bg:#f1f2f6;--ei-well:#e9ebf2;--ei-top:#fff;--ei-bottom:#f1f2f7;--ei-edge:#c0c5d3;--ei-faint:#dcdfe9;--ei-ink:#868ea4;--ei-light:#fff;--ei-shadow:#5b6482;--ei-shadow-alpha:.16;--ei-accent:#3a64e4}
      #${id}[data-theme="dark"]{${dark}}
      @media(prefers-color-scheme:dark){#${id}[data-theme="auto"]{${dark}}}
      #${id} .ei-wire{fill:none;stroke:var(--ei-faint);stroke-width:.7}
      #${id} .ei-motion{transform-box:fill-box;transform-origin:center}
      #${id} .ei-sweep,#${id} .ei-retry{transform-box:view-box;transform-origin:0 0}
      #${id} .ei-bell{transform-origin:50% 0}
      @media(prefers-reduced-motion:no-preference){
        #${id}[data-animated="true"] .ei-motion{animation-duration:5.6s;animation-delay:0s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.4,0,.2,1)}
        #${id}[data-animated="true"] .ei-barrier{animation-name:${id}-barrier}
        #${id}[data-animated="true"] .ei-open{animation-name:${id}-open}
        #${id}[data-animated="true"] .ei-sweep{animation-name:${id}-sweep}
        #${id}[data-animated="true"] .ei-cursor{animation-name:${id}-cursor;animation-timing-function:steps(1)}
        #${id}[data-animated="true"] .ei-key{animation-name:${id}-key}
        #${id}[data-animated="true"] .ei-tab{animation-name:${id}-tab}
        #${id}[data-animated="true"] .ei-folder-leaf{animation-name:${id}-leaf}
        #${id}[data-animated="true"] .ei-list-marker{animation-name:${id}-marker}
        #${id}[data-animated="true"] .ei-download{animation-name:${id}-download}
        #${id}[data-animated="true"] .ei-retry{animation-name:${id}-retry}
        #${id}[data-animated="true"] .ei-object{animation-name:${id}-object}
        #${id}[data-animated="true"] .ei-signal{animation-name:${id}-signal}
        #${id}[data-animated="true"] .ei-wave{animation-name:${id}-wave}
        #${id}[data-animated="true"] .ei-shackle{animation-name:${id}-shackle}
        #${id}[data-animated="true"] .ei-keyhole{animation-name:${id}-keyhole}
        #${id}[data-animated="true"] .ei-identity{animation-name:${id}-identity}
        #${id}[data-animated="true"] .ei-sand{animation-name:${id}-sand}
        #${id}[data-animated="true"] .ei-bell{animation-name:${id}-bell}
        #${id}[data-animated="true"] .ei-clapper{animation-name:${id}-clapper}
        #${id}[data-animated="true"] .ei-recoil{animation-name:${id}-recoil}
        #${id}[data-animated="true"] .ei-radar{animation-name:${id}-radar}
        #${id}[data-animated="true"] .ei-search{animation-name:${id}-search}
        #${id}[data-animated="true"] .ei-prompt{animation-name:${id}-prompt}
        #${id}[data-animated="true"] .ei-lines{animation-name:${id}-lines}
        #${id}[data-animated="true"] .ei-stack-back{animation-name:${id}-stack-back}
        #${id}[data-animated="true"] .ei-stack-front{animation-name:${id}-stack-front}
        #${id}[data-animated="true"] .ei-slot{animation-name:${id}-slot}
        #${id}[data-animated="true"] .ei-leaf-front{animation-name:${id}-leaf-front}
        #${id}[data-animated="true"] .ei-drift-left{animation-name:${id}-drift-left}
        #${id}[data-animated="true"] .ei-drift-right{animation-name:${id}-drift-right}
        #${id}[data-animated="true"] .ei-row{animation-name:${id}-row}
        #${id}[data-animated="true"] .ei-error{animation-name:${id}-error}
        #${id}[data-animated="true"] .ei-shadow{animation-name:${id}-shadow}
        #${id}[data-animated="true"] .ei-port-left{animation-name:${id}-port-left}
        #${id}[data-animated="true"] .ei-port-right{animation-name:${id}-port-right}
        #${id}[data-animated="true"] .ei-wave-outer{animation-name:${id}-wave-outer}
        #${id}[data-animated="true"] .ei-wave-inner{animation-name:${id}-wave-inner}
        #${id}[data-animated="true"] .ei-guards{animation-name:${id}-guards}
        #${id}[data-animated="true"] .ei-lock{animation-name:${id}-lock}
        #${id}[data-animated="true"] .ei-hourglass{animation-name:${id}-hourglass}
        #${id}[data-animated="true"] .ei-folder-back{animation-name:${id}-folder-back}
        #${id}[data-animated="true"] .ei-folder-frame{animation-name:${id}-folder-frame;transform-origin:50% 100%}
        #${id}[data-animated="true"] .ei-scan{animation-name:${id}-scan;animation-timing-function:linear}
        #${id}[data-animated="true"] .ei-ring{animation-name:${id}-ring}
        #${id}[data-animated="true"] .ei-step-0{animation-timing-function:cubic-bezier(0.2,0,0.3,1)}
        #${id}[data-animated="true"] .ei-step-1{animation-timing-function:cubic-bezier(0.3,0,0.4,1)}
        #${id}[data-animated="true"] .ei-step-2{animation-timing-function:cubic-bezier(0.4,0,0.5,1)}
        #${id}[data-animated="true"] .ei-step-3{animation-timing-function:cubic-bezier(0.5,0,0.6,1)}
        #${id}[data-animated="true"] .ei-step-4{animation-timing-function:cubic-bezier(0.6,0,0.7,1)}
      }
      @keyframes ${id}-folder-back{0%,75%,100%{transform:translateY(0) rotate(0)}25%,40%{transform:translateY(-5px) rotate(-2deg)}}
      @keyframes ${id}-folder-frame{0%,75%,100%{transform:translateY(0) scaleY(1)}30%,45%{transform:translateY(2px) scaleY(.96)}}
      @keyframes ${id}-scan{0%,8%{transform:translateX(0);opacity:0}16%{opacity:.95}64%{opacity:.95}72%,100%{transform:translateX(138px);opacity:0}}
      @keyframes ${id}-recoil{0%,18%,52%,100%{transform:translateX(0)}26%{transform:translateX(-3px) rotate(-2deg)}34%{transform:translateX(3px) rotate(2deg)}42%{transform:translateX(-1px)}}
      @keyframes ${id}-radar{0%,100%{transform:scale(.9);opacity:.4}40%{transform:scale(1.16);opacity:1}70%{transform:scale(.9);opacity:.4}}
      @keyframes ${id}-search{0%,78%,100%{transform:translate(0,0)}22%{transform:translate(-8px,3px)}48%{transform:translate(8px,-4px)}}
      @keyframes ${id}-prompt{0%,65%,100%{transform:translateX(0)}25%,40%{transform:translateX(5px)}}
      @keyframes ${id}-lines{0%,80%,100%{stroke-dasharray:32;stroke-dashoffset:0;opacity:.65}30%{stroke-dasharray:32;stroke-dashoffset:24;opacity:.25}55%{stroke-dasharray:32;stroke-dashoffset:0;opacity:1}}
      @keyframes ${id}-stack-back{0%,75%,100%{transform:translate(0,0)}30%,45%{transform:translate(6px,-6px)}}
      @keyframes ${id}-stack-front{0%,75%,100%{transform:translate(0,0)}35%,50%{transform:translate(3px,-3px)}}
      @keyframes ${id}-slot{0%,75%,100%{stroke-dashoffset:0;opacity:.5}35%{stroke-dashoffset:12;opacity:1}}
      @keyframes ${id}-leaf-front{0%,75%,100%{transform:translate(0,0)}35%,48%{transform:translate(4px,-9px) rotate(7deg)}}
      @keyframes ${id}-drift-left{0%,100%{transform:translate(0,0);opacity:.55}40%{transform:translate(-4px,-7px) rotate(-8deg);opacity:1}}
      @keyframes ${id}-drift-right{0%,100%{transform:translate(0,0);opacity:.55}55%{transform:translate(4px,7px) rotate(8deg);opacity:1}}
      @keyframes ${id}-row{0%,75%,100%{transform:translateX(0);opacity:1}30%{transform:translateX(7px);opacity:.35}50%{transform:translateX(0);opacity:1}}
      @keyframes ${id}-error{0%,12%,70%,100%{transform:scale(1);opacity:.6}32%,45%{transform:scale(1.5);opacity:1}}
      @keyframes ${id}-shadow{0%,100%{transform:scaleX(1);opacity:.045}35%{transform:scaleX(.7);opacity:.025}}
      @keyframes ${id}-port-left{0%,80%,100%{opacity:1}25%,40%{opacity:.25;transform:translateY(3px)}}
      @keyframes ${id}-port-right{0%,80%,100%{opacity:1}40%,55%{opacity:.25;transform:translateY(3px)}}
      @keyframes ${id}-wave-outer{0%,80%,100%{transform:translateY(0);opacity:.3}35%{transform:translateY(-7px);opacity:1}}
      @keyframes ${id}-wave-inner{0%,80%,100%{transform:translateY(0);opacity:.4}25%{transform:translateY(-4px);opacity:1}}
      @keyframes ${id}-guards{0%,80%,100%{transform:scaleX(1);opacity:.5}30%,55%{transform:scaleX(.9);opacity:1;stroke:var(--ei-ink)}}
      @keyframes ${id}-lock{0%,28%,65%,100%{transform:translateX(0)}35%{transform:translateX(-3px)}42%{transform:translateX(3px)}49%{transform:translateX(-2px)}56%{transform:translateX(0)}}
      @keyframes ${id}-hourglass{0%,52%{transform:rotate(0)}72%,82%{transform:rotate(180deg)}96%,100%{transform:rotate(360deg)}}
      @keyframes ${id}-ring{0%,100%{transform:scale(.85);opacity:.15}35%{transform:scale(1.12);opacity:.7}65%{transform:scale(1.18);opacity:.15}}
      @keyframes ${id}-barrier{0%,10%,47.5%,100%{stroke:var(--ei-ink)}22.5%,31.25%{stroke:var(--ei-accent)}}
      @keyframes ${id}-open{0%,27.5%,65%,100%{transform:translate(0,0)}42.5%{transform:translate(3px,-3px)}}
      @keyframes ${id}-sweep{0%,8.75%{transform:rotate(-45deg);opacity:.2}42.5%{opacity:.8}65%,100%{transform:rotate(315deg);opacity:.2}}
      @keyframes ${id}-cursor{0%,12.5%,27.5%,45%,100%{opacity:1}6.25%,20%,35%{opacity:.15}}
      @keyframes ${id}-key{0%,15%,50%,100%{transform:translateY(0)}27.5%,33.75%{transform:translateY(2.5px)}}
      @keyframes ${id}-tab{0%,52.5%,100%{stroke-opacity:.45}22.5%,32.5%{stroke-opacity:1}}
      @keyframes ${id}-leaf{0%,56.25%,100%{transform:translateY(0)}22.5%,35%{transform:translateY(-8px)}}
      @keyframes ${id}-marker{0%,10%,87.5%,100%{transform:translateY(0)}31.25%,43.75%{transform:translateY(17px)}60%,68.75%{transform:translateY(34px)}}
      @keyframes ${id}-download{0%,56.25%,100%{transform:translateY(0);opacity:1}22.5%,31.25%{transform:translateY(3px);opacity:.4}}
      @keyframes ${id}-retry{0%,30%{transform:rotate(0)}68.75%,100%{transform:rotate(360deg)}}
      @keyframes ${id}-object{0%,62.5%,100%{transform:translateY(0);opacity:1}27.5%,40%{transform:translateY(-8px);opacity:.7}}
      @keyframes ${id}-signal{0%,10%{stroke-dashoffset:0;opacity:.7}27.5%{opacity:.25}55%,100%{stroke-dashoffset:-5;opacity:.7}}
      @keyframes ${id}-wave{0%,62.5%,100%{opacity:.35}27.5%,37.5%{opacity:.9}}
      @keyframes ${id}-shackle{0%,10%,100%{transform:translateY(-8px)}30%,75%{transform:translateY(0)}}
      @keyframes ${id}-keyhole{0%,15%,100%{opacity:.5}35%,75%{opacity:1}}
      @keyframes ${id}-identity{0%,62.5%,100%{opacity:1}20%,35%{opacity:.45}}
      @keyframes ${id}-sand{0%,68.75%,100%{transform:translateY(0);opacity:1}30%{transform:translateY(2px);opacity:.4}50%{transform:translateY(0);opacity:.4}}
      @keyframes ${id}-bell{0%,52.5%,100%{transform:rotate(0)}17.5%{transform:rotate(-12deg)}30%{transform:rotate(9deg)}40%{transform:rotate(-4deg)}}
      @keyframes ${id}-clapper{0%,56.25%,100%{transform:translateX(0)}21.25%{transform:translateX(4px)}33.75%{transform:translateX(-3px)}}
    `}</style>
    <defs>
      <clipPath id={`${id}-scan-clip`}><rect x="34" y="38" width="172" height="104" rx="6" /></clipPath>
      <linearGradient id={`${id}-scan-light`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff" stopOpacity="0" /><stop offset=".2" stopColor="#ffffff" /><stop offset=".5" stopColor="#ffffff" /><stop offset=".8" stopColor="#ffffff" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
      <filter id={`${id}-scan-glow`} x="-150%" y="-20%" width="400%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
      <linearGradient id={`${id}-face`} x2="0" y2="1"><stop stopColor="var(--ei-top)" /><stop offset="1" stopColor="var(--ei-bottom)" /></linearGradient>
      <linearGradient id={`${id}-well`} x2="0" y2="1"><stop stopColor="var(--ei-well)" /><stop offset="1" stopColor="var(--ei-bg)" /></linearGradient>
      <linearGradient id={`${id}-fade-gradient`} x2="0" y2="1"><stop offset=".45" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
      <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x="30" y="40" width="180" height="110"><rect x="30" y="40" width="180" height="110" fill={url('fade-gradient')} stroke="none" /></mask>
      <pattern id={`${id}-perforation`} width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".55" fill="var(--ei-edge)" stroke="none" opacity=".42" /></pattern>
      <filter id={`${id}-shadow`} x="-40%" y="-50%" width="180%" height="210%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2" /><feOffset dy="2.5" result="offset" /><feFlood floodColor="var(--ei-shadow)" floodOpacity="var(--ei-shadow-alpha)" /><feComposite in2="offset" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <path d="M2 51h15l15 15m176 55 14 14h16M12 144h12l12-12m173-84 15-15h14" className="ei-wire" />
    <path d="M32 23h176l13 13v108l-13 13H32l-13-13V36Z" fill="var(--ei-bg)" stroke="var(--ei-edge)" strokeOpacity=".75" />
    <path d="M34 27h172l11 11v104l-11 11H34l-11-11V38Z" fill={url('perforation')} stroke="var(--ei-light)" strokeOpacity=".65" />
    <path d="M37 32h166l9 9v98l-9 9H37l-9-9V41Z" fill="var(--ei-bg)" stroke="var(--ei-edge)" strokeOpacity=".65" />
    <rect x="34" y="38" width="172" height="104" rx="6" fill={url('well')} stroke="var(--ei-faint)" />
    <path d="m28 39 7-7m-6 12 11-11m172 109-7 7m6-12-11 11" stroke="var(--ei-ink)" opacity=".29" />
    {screw(41, 45)}{screw(199, 45)}{screw(41, 135)}{screw(199, 135)}
    {scene}
  </svg>
}
