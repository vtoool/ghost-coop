# Testing Limitations & Self-Upgrade Plan

## Current Testing Limitations

### 1. PlayroomKit Session Restoration Interference
- **Issue:** PlayroomKit automatically restores previous sessions from IndexedDB
- **Impact:** Makes "first-time" user testing difficult in automation
- **Evidence:** Test screenshots show "Cornflakes47" auto-loaded from previous session
- **Workaround:** Requires incognito mode or manual storage clearing between tests
- **Severity:** HIGH for automated testing, NONE for production users

### 2. Initialization Timing Inconsistencies
- **Issue:** PlayroomKit initialization takes 8-15 seconds in production
- **Impact:** Tests timeout or capture wrong states ("Joining existing game..." stuck)
- **Evidence:** Screenshots show lobby never loads within default 5s timeout
- **Workaround:** Extended waits (10s+) needed, but makes tests slow
- **Severity:** MEDIUM - impacts test reliability

### 3. Room Code Format Discovery
- **Issue:** Room code format is `#r=XXXXX` not `#XXXXX` as documented
- **Impact:** Tests fail to extract room codes correctly
- **Evidence:** Regex `window.location.hash.slice(1)` returns "r=EU6XD" not "EU6XD"
- **Fix:** Update extraction logic to handle PlayroomKit format
- **Severity:** LOW - easily fixable

### 4. Button Text Mismatches
- **Issue:** Button text is "READY FOR HAUNT" not "READY"
- **Impact:** Test selectors fail to find elements
- **Evidence:** `locator('button:has-text("READY")')` fails, "READY FOR HAUNT" succeeds
- **Fix:** Update all button selectors in test files
- **Severity:** LOW - easily fixable

### 5. Visual State Confusion
- **Issue:** "Joining existing game..." status persists while buttons remain active
- **Impact:** Unclear if app is connecting or stuck
- **Evidence:** Screenshot shows both "Joining..." text AND "ENTER THE HAUNTED HOUSE" button
- **Severity:** MEDIUM - UI/UX issue, not functional

### 6. Multi-Context Browser Isolation
- **Issue:** Playwright contexts share some state unexpectedly
- **Impact:** Test isolation compromised, race conditions possible
- **Evidence:** Host and joiner sessions occasionally interfere
- **Workaround:** Use `launchPersistentContext` with unique userDataDirs
- **Severity:** MEDIUM - impacts test reliability

### 7. Screenshot Analysis Feedback Loop
- **Issue:** Cannot easily implement automated visual verification loop
- **Impact:** Manual review needed for every screenshot
- **Evidence:** analyze-screenshot.js script is a placeholder
- **Workaround:** Use subagents or manual MiniMax tool calls
- **Severity:** MEDIUM - slows testing workflow

### 8. Network Throttling Limitations
- **Issue:** Playwright route interception affects all requests globally
- **Impact:** Cannot selectively throttle only PlayroomKit WebSocket connections
- **Evidence:** All network requests slowed, not just multiplayer sync
- **Workaround:** Use browser DevTools protocol for targeted throttling
- **Severity:** LOW - limited impact on test validity

### 9. Mobile Touch Event Simulation
- **Issue:** Playwright simulates clicks, not real touch events
- **Impact:** Cannot test touch-specific behaviors (long-press, swipe, pinch)
- **Evidence:** Mobile viewport tests pass but lack touch interaction validation
- **Severity:** LOW - functional testing still valid

### 10. Cross-Browser Compatibility
- **Issue:** Only testing Chromium (Chrome), not Safari/Firefox
- **Impact:** WebRTC behavior differs across browsers
- **Evidence:** PlayroomKit may behave differently on Safari mobile
- **Workaround:** Add WebKit/Firefox projects to playwright.config.js
- **Severity:** MEDIUM - limited browser coverage

---

## Self-Upgrade Plan

### What We DON'T Need (We Already Have These)

❌ **Microsoft Playwright MCP** - We already have Playwright working directly  
❌ **Screenshot MCP Server** - Playwright already has screenshot API  
❌ **Image Viewer MCP** - We have MiniMax image understanding tool  
❌ **Browser Automation MCPs** - Redundant with existing Playwright setup

**We don't need more browser tools - we need better test PATTERNS.**

---

### What We ACTUALLY Need

### Phase 2: Skill Creation ✅ DONE

All skills created in `.opencode/skills/`:

#### ✅ `visual-testing` Skill
**Location:** `.opencode/skills/visual-testing/SKILL.md`  
**Created:** Just now  
**Status:** Ready to use

#### ✅ `multiplayer-sync` Skill  
**Location:** `.opencode/skills/multiplayer-sync/SKILL.md`  
**Created:** Just now  
**Status:** Ready to use

#### ✅ `style-guide-compliance` Skill
**Location:** `.opencode/skills/style-guide-compliance/SKILL.md`  
**Created:** Just now  
**Status:** Ready to use

**Usage:** These skills are automatically discovered by OpenCode. When working on tests, I can reference them for patterns and best practices.

### Phase 3: Process Automation (Medium Priority)

#### Automated Test Data Generation
- **Tool:** Create test fixture generator
- **Purpose:** Generate realistic player names, room codes, test scenarios
- **Implementation:** Faker.js integration for consistent test data

#### Screenshot Comparison Pipeline
- **Tool:** Automated visual diff workflow
- **Purpose:** Compare current screenshots against baselines
- **Implementation:** Playwright + pixelmatch + image understanding

#### CI/CD Test Integration
- **Tool:** GitHub Actions workflow
- **Purpose:** Run tests on every PR with visual regression
- **Implementation:** Playwright GitHub Action with artifact upload

### Phase 4: Advanced Testing (Future)

#### Device Cloud Integration
- **Research:** BrowserStack, Sauce Labs, or AWS Device Farm
- **Purpose:** Real mobile device testing
- **Impact:** Test actual touch behavior and device-specific issues

#### Chaos Engineering
- **Tool:** Network fault injection
- **Purpose:** Test multiplayer resilience
- **Implementation:** Proxy server with configurable latency/packet loss

#### Performance Profiling
- **Tool:** Lighthouse CI + custom metrics
- **Purpose:** Track bundle size, load time, FPS
- **Implementation:** Automated performance budgets

---

## Capability Gaps Identified

### Current Missing Capabilities
1. **Real-time WebSocket monitoring** - Cannot inspect PlayroomKit messages
2. **Session storage management** - No easy way to clear IndexedDB in automation
3. **Visual diff with tolerance** - Exact pixel matching fails with animations
4. **Touch event simulation** - Cannot test gesture-based interactions
5. **Cross-browser WebRTC testing** - Safari mobile behavior unknown

### What We Actually Need (Not MCPs)

**We DON'T need more MCPs - we need better test implementations:**

1. **Better Session Management** - Already have Playwright contexts, just need to use them properly
2. **Direct MiniMax Integration** - Use image understanding tool in test files (not external scripts)
3. **Test Data Generation** - Use `faker` npm package for fake player names
4. **Longer Wait Times** - Already identified: increase from 3s to 8s
5. **Proper IndexedDB Clearing** - Add explicit cleanup code

**The tools exist. The patterns need work.**

---

## Documentation Improvements

### Create New Files
1. `TESTING.md` - Comprehensive testing guide
2. `.opencode/skills/visual-testing/SKILL.md` - Visual testing skill
3. `.opencode/skills/multiplayer-sync/SKILL.md` - Multiplayer testing skill
4. `.opencode/skills/style-guide-compliance/SKILL.md` - Style guide skill
5. `tests/README.md` - Test documentation

### Update Existing Files
1. `AGENTS.md` - Add testing patterns to Non-Negotiables
2. `playwright.config.js` - Add Firefox/Safari projects
3. `package.json` - Add test scripts (already done ✓)

---

## Success Metrics - IMMEDIATE (Today)

### Install MCPs (10 minutes)
- [ ] Install Microsoft Playwright MCP
- [ ] Configure in opencode.json
- [ ] Test basic browser automation

### Use Skills (Already Done)
- [x] 3 skills created and documented
- [x] Test patterns documented
- [ ] Reference skills in future work

### Fix Critical Test Issues (30 minutes)
- [ ] Update button selectors ("READY FOR HAUNT")
- [ ] Fix room code extraction regex
- [ ] Increase initialization wait times
- [ ] Add storage clearing between tests

### Manual Testing (You Do This)
- [ ] Test 2-player flow manually
- [ ] Verify all 7 scenarios work
- [ ] Document any remaining issues

---

## Immediate Action Items (Next 30 Minutes)

1. **Fix Test Issues** (15 min)
   - ✅ Update button selectors: "READY FOR HAUNT" (already done in visual.spec.js)
   - Update room code extraction regex in tests: `/#r=([A-Z0-9]+)/` not just hash slice
   - Increase initialization wait times from 3000ms to 8000ms
   - Add IndexedDB clearing between test runs

2. **Add Session Isolation** (10 min)
   ```javascript
   // Add to test.beforeEach
   await context.clearCookies()
   await page.evaluate(() => {
     indexedDB.deleteDatabase('playroom')
     localStorage.clear()
   })
   ```

3. **Test Manually** (5 min)
   - Open https://ghost-coop.vercel.app in two browsers
   - Test the full 2-player flow
   - Verify all screenshots look good

---

## What We ACTUALLY Need to Build

### Real Tools We Don't Have:

1. **WebSocket Inspector** - See PlayroomKit messages in real-time
   - Could build: Simple proxy that logs WebSocket traffic
   - Use: Debug sync issues

2. **Session Cleaner** - Proper IndexedDB clearing
   - Already have: Playwright context isolation
   - Need: Add explicit cleanup to tests

3. **Visual Diff with Animation Tolerance** 
   - Already have: MiniMax image understanding
   - Use: "Does this look good?" instead of pixel matching

4. **Test Fixture Generator**
   - Could build: Generate fake player names, room codes
   - Use: `faker.js` for consistent test data

### MCPs Are NOT the Answer Here

We have all the tools we need:
- ✅ Playwright for browser automation
- ✅ Screenshot API for captures
- ✅ MiniMax for visual analysis
- ✅ Skills for patterns

**What we need: BETTER TESTS, not more tools.**

---

*Last Updated: 2026-02-02*  
*Status: Skills Complete ✅, Tests Need Fixing, Manual Testing Needed*  
*Next Action: Fix test selectors and add session isolation*
