# Graph Report - .  (2026-06-15)

## Corpus Check
- 999 files · ~1,526,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 9641 nodes · 23343 edges · 124 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `js()` - 224 edges
2. `getOwnPropertyDescriptor()` - 113 edges
3. `defineProperty()` - 109 edges
4. `filter()` - 78 edges
5. `get()` - 72 edges
6. `N()` - 68 edges
7. `keys()` - 68 edges
8. `E()` - 57 edges
9. `F()` - 57 edges
10. `o()` - 57 edges

## Surprising Connections (you probably didn't know these)
- `default()` --calls--> `x()`  [EXTRACTED]
  storybook-static\sb-addons\chromatic-com-storybook-1\manager-bundle.js → storybook-static\sb-addons\vitest-2\manager-bundle.js
- `brand()` --calls--> `x()`  [EXTRACTED]
  storybook-static\sb-addons\chromatic-com-storybook-1\manager-bundle.js → storybook-static\sb-addons\vitest-2\manager-bundle.js
- `je()` --calls--> `ln()`  [EXTRACTED]
  storybook-static\sb-addons\docs-4\manager-bundle.js → storybook-static\sb-addons\a11y-3\manager-bundle.js
- `dn()` --calls--> `je()`  [EXTRACTED]
  storybook-static\sb-addons\a11y-3\manager-bundle.js → storybook-static\sb-addons\docs-4\manager-bundle.js
- `Vt()` --calls--> `Pn()`  [EXTRACTED]
  storybook-static\sb-addons\a11y-3\manager-bundle.js → storybook-static\sb-addons\chromatic-com-storybook-1\manager-bundle.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (847): A(), a1(), aa(), ac(), ad(), add(), addChainableMethod(), addCleanupCallbacks() (+839 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (144): $148a7a147e38ea7f$export$702d680b21cbd764(), $1e5a04cdaf7d1af8$export$f09106e7c6677ec5(), $1e5a04cdaf7d1af8$var$updateLocale(), $507fabe10e71c6fb$var$handleClickEvent(), $507fabe10e71c6fb$var$handleFocusEvent(), $507fabe10e71c6fb$var$handleKeyboardEvent(), $507fabe10e71c6fb$var$handlePointerEvent(), $507fabe10e71c6fb$var$isValidKey() (+136 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (169): EventBusImpl, buildDateMap(), toDateKey(), d(), minimalTrack(), run(), downloadJson(), triggerDownload() (+161 more)

### Community 3 - "Community 3"
Cohesion: 0.01
Nodes (594): A(), aa(), Ab(), aC(), ad(), add(), addAngleAxis(), addRadiusAxis() (+586 more)

### Community 4 - "Community 4"
Cohesion: 0.01
Nodes (528): $03deb23ff14920c4$export$4eaf04e54aa8eed6(), $148a7a147e38ea7f$export$702d680b21cbd764(), $18f2051aff69b9bf$export$43bb16f9c6d9e3f7(), $1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a(), $1e5a04cdaf7d1af8$export$f09106e7c6677ec5(), $1e5a04cdaf7d1af8$var$updateLocale(), $2a41e45df1593e64$export$d39e1813b3bdd0e1(), $2a41e45df1593e64$var$useResize() (+520 more)

### Community 5 - "Community 5"
Cohesion: 0.01
Nodes (462): $a(), ab(), ac(), add(), addChild(), addDescendants(), addEventListener(), addNode() (+454 more)

### Community 6 - "Community 6"
Cohesion: 0.01
Nodes (439): _0(), _1(), _3(), _5(), _6(), _a(), A0(), a3() (+431 more)

### Community 7 - "Community 7"
Cohesion: 0.01
Nodes (493): a(), Aa(), ab(), ac(), Ad(), ae(), af(), ag() (+485 more)

### Community 8 - "Community 8"
Cohesion: 0.01
Nodes (20): c(), d(), f(), h(), l(), m(), p(), T() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.01
Nodes (310): _0(), A(), ab(), ac(), ag(), Ah(), Ai(), align() (+302 more)

### Community 10 - "Community 10"
Cohesion: 0.01
Nodes (17): Avatar(), initials(), handlePointer(), round(), emitFiles(), handleChange(), focusTab(), handleKeyDown() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (308): A(), aa(), ac(), ad(), ae(), af(), Ai(), Al() (+300 more)

### Community 12 - "Community 12"
Cohesion: 0.02
Nodes (210): $319e236875307eab$export$d10ae4f68404609a(), addPressed(), assertPointerEvents(), assignProps(), blurElement(), build2(), buildTimeValue(), calculateNewValue() (+202 more)

### Community 13 - "Community 13"
Cohesion: 0.02
Nodes (104): An(), ar(), at(), Be(), bn(), br(), bt(), c() (+96 more)

### Community 14 - "Community 14"
Cohesion: 0.02
Nodes (154): $14c0b72509d70225$export$b0d6fa1ab32e3295(), $23b9f4fcf0fe224b$var$filterChildren(), $453cc9f0df89c0a5$export$77d5aafae4e095b2(), $9bf71ea28793e738$export$1258395f99bf9cbf(), $9bf71ea28793e738$var$isAncestorScope(), $9bf71ea28793e738$var$isElementInAnyScope(), $9bf71ea28793e738$var$isElementInChildScope(), $9bf71ea28793e738$var$isElementInScope() (+146 more)

### Community 15 - "Community 15"
Cohesion: 0.02
Nodes (152): $2a41e45df1593e64$var$translateRTL(), alloc(), _arrayLikeToArray(), _arrayWithoutHoles(), assembleLineNumberStyles(), assertDescriptor(), build(), caret() (+144 more)

### Community 16 - "Community 16"
Cohesion: 0.02
Nodes (129): allowsNameFromContent(), arrayFrom(), asFlatString(), canElementBeDisabled(), checkHasWindow(), checkHtmlElement(), checkNode(), checkToAppear() (+121 more)

### Community 17 - "Community 17"
Cohesion: 0.04
Nodes (107): $0065b146e7192841$export$7138b0d059a6e743(), $0175d55c2a017ebc$export$fdf4756d5b8ef90a(), $03deb23ff14920c4$export$4eaf04e54aa8eed6(), $07b14b47974efb58$var$PopoverInner(), $18f2051aff69b9bf$export$43bb16f9c6d9e3f7(), $1dbecbe27a04f9af$export$14d238f342723f25(), $204d9ebcedfb8806$export$ed5abd763a836edc(), $2680b1829e803644$export$fa142eb1681c5202() (+99 more)

### Community 18 - "Community 18"
Cohesion: 0.03
Nodes (104): $1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a(), $337b884510726a0d$export$c6fdb837b070b4ff(), $64fa3d84918910a7$export$2881499e37b75b9a(), $7135fc7d473fd974$var$useCollectionRender(), $96b38030c423d352$export$78efe591171d7d45(), $96b38030c423d352$export$9fc1347d4195ccb3(), $9bf71ea28793e738$export$20e40289641fbbb6(), $9bf71ea28793e738$var$last() (+96 more)

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (97): $488c6ddbf4ef74c2$var$getCachedNumberFormatter(), addFilters(), addListener(), appendErrorRef(), assertTypes(), canSuggest(), _check_private_redeclaration(), _class_private_field_init() (+89 more)

### Community 20 - "Community 20"
Cohesion: 0.03
Nodes (90): $9bf71ea28793e738$var$isTabbableRadio(), arrayFromSet(), assertNotNullOrUndefined(), asymmetricMatch(), deepEqual(), entriesEqual(), eq3(), escape() (+82 more)

### Community 21 - "Community 21"
Cohesion: 0.03
Nodes (89): a(), addChainableMethod(), addLengthGuard(), addMethod(), addProperty(), an(), assemble(), assert() (+81 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (88): $2f04cbc44ee30ce0$export$53a0910f038337bd(), $2f04cbc44ee30ce0$export$c826860796309d1b(), $2f04cbc44ee30ce0$var$relativeOffset(), $a40c673dc9f6d9c7$export$94ed1c92c7beeb22(), append(), applyStyles(), areValidElements(), arrow() (+80 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (49): A(), ae(), b(), ce(), D(), de(), E(), F() (+41 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (75): $488c6ddbf4ef74c2$export$711b50b3c525e0f2(), $5b160d28a433310d$var$getLanguage(), $5b160d28a433310d$var$getStringsForLocale(), clone2(), collectOwnProperties(), compareObjects(), comparePrimitive(), countChanges() (+67 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (66): A(), ae(), At(), b(), be(), bt(), C(), ce() (+58 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (72): $5e3802645cc19319$export$1020fa7f77e17884(), $7135fc7d473fd974$export$2dbbd341daed716d(), $76f919a04c5a7d14$var$findDefaultSelectedKey(), $875d6693e12af071$var$toggleKey(), add(), assert2(), assertIsMock(), $c5a24bc478652b5f$export$8c434b3a7a4dad6() (+64 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (50): A(), ae(), b(), be(), C(), ce(), D(), de() (+42 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (40): a(), add(), c(), clear(), d(), delete(), E(), f() (+32 more)

### Community 29 - "Community 29"
Cohesion: 0.06
Nodes (21): CollapsedRail(), DesktopShell(), distanceMarkerPoints(), distToSegmentSq(), ExpandedSidebar(), fmtDuration(), fmtPace(), haversineKm() (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (38): BrowserRouter(), createBrowserHistory(), createKey(), createLocation(), createPath(), DefaultErrorComponent(), _extends2(), _extends3() (+30 more)

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (37): allowsNameFromContent2(), arrayFrom2(), asFlatString2(), computeAccessibleName2(), computeTextAlternative2(), findLabelableElement2(), getControlOfLabel2(), getLabels2() (+29 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (35): adjustHue(), colorToHex(), colorToInt(), convertToHex(), convertToInt(), darken(), desaturate(), drawBorder() (+27 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (24): announce(), b(), c(), clear(), constructor(), createLog(), d(), E() (+16 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (34): atcontainer(), atcustommedia(), atdocument(), atfontface(), athost(), atkeyframes(), atlayer(), atmedia() (+26 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (16): a(), c(), get(), i(), l(), n(), "node_modules/pretty-format/build/index.js"(), "node_modules/pretty-format/build/plugins/ConvertAnsi.js"() (+8 more)

### Community 36 - "Community 36"
Cohesion: 0.09
Nodes (28): $21f1aa98acb08317$export$c57958e35f31ed73(), $49c51c25361d4cd2$var$addEvent(), $49c51c25361d4cd2$var$preventScrollMobileSafari(), $49c51c25361d4cd2$var$scrollIntoView(), $49c51c25361d4cd2$var$scrollIntoViewWhenReady(), $507fabe10e71c6fb$export$2f1888112f558a7d(), $507fabe10e71c6fb$export$98e20ec92f614cfe(), $507fabe10e71c6fb$export$ec71b4b83ac08ec3() (+20 more)

### Community 37 - "Community 37"
Cohesion: 0.08
Nodes (28): $3ad3f6e1647bc98d$export$80f3e147d781571c(), $431fbd86ca7dc216$export$af51f0f06c0f328a(), $431fbd86ca7dc216$var$isNode(), $507fabe10e71c6fb$export$630ff653c5ada6a9(), $55f9b1ae81f22853$export$2b35b76d2e30e129(), $55f9b1ae81f22853$export$6c5dc7e81d2cc29a(), $55f9b1ae81f22853$export$759df0d867455a91(), $55f9b1ae81f22853$export$76e4e37e5339496d() (+20 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (23): createDefaultFormatters(), createFastMemoizeCache(), formatRangeToParts(), formatToParts(), IntlMessageFormat2(), isArgumentElement(), isDateElement(), isDateTimeSkeleton() (+15 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (22): buildQueries(), createDOMElementFilter(), filterCommentsAndDefaultIgnoreTagsTags(), fireEvent(), getConfig2(), getDefaultNormalizer(), getDocument(), getElementError() (+14 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (16): $9446cca9a3875146$export$7d15b64cf5a3a4c4(), $edcf132a9284368a$export$4b834cebd9e5cebe(), $edcf132a9284368a$export$6839422d1f33cee9(), $edcf132a9284368a$export$b3ceb0cbf1056d98(), $edcf132a9284368a$var$computePosition(), $edcf132a9284368a$var$getAvailableSpace(), $edcf132a9284368a$var$getContainerDimensions(), $edcf132a9284368a$var$getContainingBlock() (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (2): ErrorBoundaryRoot, TelemetryLogger

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (2): ExploreTrailsPage(), rotate()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (2): formatDuration(), formatDurationMs()

### Community 47 - "Community 47"
Cohesion: 0.4
Nodes (1): ConsoleLogger

### Community 48 - "Community 48"
Cohesion: 0.4
Nodes (1): NotificationCenter

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (1): NotificationRulesEngine

### Community 50 - "Community 50"
Cohesion: 0.4
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 0.5
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 0.5
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 0.5
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 0.5
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 0.67
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 0.67
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 0.67
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 0.67
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 0.67
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 0.67
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (0): 

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (0): 

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (0): 

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (0): 

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (0): 

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (0): 

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (0): 

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (0): 

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (0): 

### Community 93 - "Community 93"
Cohesion: 1.0
Nodes (0): 

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (0): 

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (0): 

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (0): 

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (0): 

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (0): 

### Community 99 - "Community 99"
Cohesion: 1.0
Nodes (0): 

### Community 100 - "Community 100"
Cohesion: 1.0
Nodes (0): 

### Community 101 - "Community 101"
Cohesion: 1.0
Nodes (0): 

### Community 102 - "Community 102"
Cohesion: 1.0
Nodes (0): 

### Community 103 - "Community 103"
Cohesion: 1.0
Nodes (0): 

### Community 104 - "Community 104"
Cohesion: 1.0
Nodes (0): 

### Community 105 - "Community 105"
Cohesion: 1.0
Nodes (0): 

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (0): 

### Community 107 - "Community 107"
Cohesion: 1.0
Nodes (0): 

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (0): 

### Community 109 - "Community 109"
Cohesion: 1.0
Nodes (0): 

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (0): 

### Community 111 - "Community 111"
Cohesion: 1.0
Nodes (0): 

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (0): 

### Community 113 - "Community 113"
Cohesion: 1.0
Nodes (0): 

### Community 114 - "Community 114"
Cohesion: 1.0
Nodes (0): 

### Community 115 - "Community 115"
Cohesion: 1.0
Nodes (0): 

### Community 116 - "Community 116"
Cohesion: 1.0
Nodes (0): 

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (0): 

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (0): 

### Community 119 - "Community 119"
Cohesion: 1.0
Nodes (0): 

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (0): 

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (0): 

### Community 122 - "Community 122"
Cohesion: 1.0
Nodes (0): 

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 72`** (2 nodes): `eslint.config.js`, `el()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `staticTile.ts`, `staticTileForBounds()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `chunk-242VQQM5-D_TF1fLq.js`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `_classes-BBkevTs7.js`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `useConfirmPress.ts`, `useConfirmPress()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `useSessionTimer.ts`, `useSessionTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `ExportDataWidget.tsx`, `ExportDataWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `ImportDataWidget.tsx`, `ImportDataWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `PlanRouteWidget.tsx`, `PlanRouteWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `Breadcrumb.tsx`, `Breadcrumb.stories.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `stylelint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `vitest.shims.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `garmin.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `NotificationPreferences.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `BodyMetrics.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `InjuryTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `NutritionTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `SleepTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `provenance.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `strength.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `AppNav.stories-BtciC5ZU.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `atoms-BMBaJV9w.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `Badge.stories-uQ-YGxer.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `Breadcrumb.stories-D_cHZbt_.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `Checkbox.stories-CKmf5ery.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `chunk-S2IHWCOG-tZqbQ3Kv.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `CommandPalette-C9edLu1a.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (1 nodes): `DataValue.stories-Ddhk6oey.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (1 nodes): `DropdownMenu-CkPC2nNH.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `EditableTitle.stories-CMkLSYSk.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `Metric.stories-qx7UASQi.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (1 nodes): `molecules-ChvnF0T6.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `MultiSegmentBar.stories-BbSCGzqo.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `NavItem.stories-Cc-ypA8G.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `react-OQR1K8NM.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `ScreenHeader-m0Ae7MFB.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `SegmentBar.stories-BQMS5qUO.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `Select.stories-Co27kGHj.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `StatDisplay-Ct6Eq1Ci.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `Surface.stories-DBhExX1G.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `TabNavigation.stories-CMm0fR6P.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `Text.stories-Bjc88PN2.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `Textarea.stories-cnXjQndv.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `TimePicker.stories-DM7WdC7b.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `WidgetCard-CGaRllDn.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `globals.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `manager-stores.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `ExtendedPatterns.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `dashboardUtils.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `useRouteBuilder.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `js()` connect `Community 8` to `Community 0`, `Community 33`, `Community 3`, `Community 5`, `Community 11`, `Community 13`, `Community 23`, `Community 25`, `Community 27`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `js()` connect `Community 5` to `Community 8`, `Community 13`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `js()` connect `Community 11` to `Community 13`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._