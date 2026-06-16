# World-Class Application Audit & Competitive Systems Review Prompt

## Purpose

Use this prompt to critically audit an application after:

* adding new features
* redesigning UX/UI
* modifying workflows
* restructuring architecture
* changing backend systems
* scaling infrastructure
* introducing new platforms/devices
* changing engagement mechanics
* altering navigation or interaction models

The goal is to evaluate the app against the operational maturity, UX quality, architectural robustness, and systems-thinking used by world-class consumer platforms.

This audit is NOT intended to encourage cloning other products.

The purpose is to:

* identify overlooked systems
* expose architectural weaknesses
* uncover UX gaps
* reveal scalability risks
* detect missing infrastructure
* improve resilience
* increase maintainability
* identify world-class interaction patterns
* identify missing operational tooling
* improve product maturity
* discover features users subconsciously expect

---

# MASTER PROMPT

You are acting as:

* a principal product designer
* a staff frontend engineer
* a distributed systems architect
* a senior backend engineer
* a platform scalability reviewer
* a mobile UX specialist
* a growth product manager
* a performance engineer
* a QA lead
* a design systems architect
* a product strategist
* an operational tooling reviewer

Critically evaluate my application by comparing it against systems, interaction models, infrastructure patterns, operational maturity, and UX principles used in elite applications such as:

* Instagram
* Strava
* Uber
* Spotify
* Notion
* Duolingo
* Google Maps
* Airbnb
* Discord
* Slack
* TikTok
* Apple Health
* Figma
* Linear
* GitHub

Do NOT focus on copying visual styling.

Instead, analyze:

* platform maturity
* interaction quality
* scalability
* operational robustness
* resilience
* responsiveness
* retention mechanics
* developer experience
* user trust
* long-term maintainability
* ecosystem readiness
* behavioral psychology
* product defensibility

Assume the application may eventually scale to:

* millions of users
* multiple platforms
* international markets
* large engineering teams
* large datasets
* offline usage
* real-time collaboration
* highly personalized experiences

Evaluate the app as if it were preparing to compete at global consumer-platform scale.

Be extremely critical, systems-oriented, and detailed.

Avoid generic recommendations.

For every identified issue:

* explain WHY it matters
* explain how elite apps solve it
* estimate implementation complexity
* estimate expected UX/product impact
* classify the issue as:

  * foundational
  * scalability-related
  * UX-related
  * retention-related
  * operational
  * growth-related
  * architecture-related
  * polish-related

Prioritize:

* hidden risks
* scalability bottlenecks
* operational blind spots
* interaction inconsistencies
* overlooked infrastructure
* user trust failures
* edge-case breakdowns
* maintainability issues
* missing systems elite apps typically implement

---

# 1. Core Product Architecture

Audit:

* information architecture
* navigation hierarchy
* feature separation
* modularity
* scalability
* frontend/backend boundaries
* state management
* caching strategies
* offline handling
* synchronization systems
* data normalization
* API structure
* event-driven systems
* real-time architecture
* background processing
* queue systems
* feature flagging
* observability/logging
* analytics infrastructure
* permissions architecture
* configuration systems
* dependency management
* service boundaries
* monolith vs modular risks

Identify:

* architectural risks
* technical debt indicators
* duplicated responsibilities
* tightly coupled systems
* scalability bottlenecks
* fragile abstractions
* hidden complexity
* infrastructure gaps
* systems missing from mature platforms

---

# 2. UX Systems Audit

Review:

* onboarding
* progressive disclosure
* discoverability
* habit loops
* engagement systems
* cognitive load
* friction points
* empty states
* loading states
* navigation clarity
* visual hierarchy
* gesture systems
* microinteractions
* feedback systems
* session continuity
* interruption recovery
* accessibility
* cross-device consistency
* contextual actions
* personalization
* user guidance
* retention loops
* trust-building patterns
* progressive complexity
* workflow continuity

Identify:

* missing UX safeguards
* unclear interaction flows
* unnecessary friction
* poor user feedback
* weak engagement loops
* missing delight systems
* confusing interactions
* navigation inconsistencies
* missing quality-of-life systems
* workflows users would expect from polished apps

---

# 3. UI Design Principles

Audit:

* spacing systems
* typography hierarchy
* responsive behavior
* adaptive layouts
* design token consistency
* color usage
* contrast/accessibility
* component consistency
* interaction affordances
* motion/animation usage
* visual density
* mobile ergonomics
* desktop ergonomics
* map/data visualization clarity
* chart readability
* touch target sizing
* iconography systems
* card/list patterns
* modal/sheet/dialog usage
* layering systems
* layout responsiveness
* responsive edge cases
* dark mode systems

Identify:

* inconsistencies
* visual clutter
* outdated patterns
* responsiveness issues
* accessibility concerns
* poor information prioritization
* unclear interaction affordances
* UI states that fail to communicate system state

---

# 4. Error Handling & Resilience

Review:

* API failure handling
* retry systems
* optimistic updates
* rollback handling
* validation systems
* form error handling
* connectivity loss
* offline mode
* stale cache handling
* sync conflicts
* auth expiration
* session recovery
* corrupted state handling
* loading fallbacks
* empty datasets
* permissions denial
* timeout handling
* partial failure states
* destructive action safeguards
* degraded service handling
* fallback UX systems

Identify:

* silent failure risks
* poor recovery systems
* brittle workflows
* missing feedback
* destructive edge cases
* user dead ends
* inconsistent state recovery

---

# 5. Product Maturity Features

Identify systems commonly implemented by elite platforms that may not yet exist.

Examples:

* autosave
* drafts
* undo systems
* command palettes
* keyboard shortcuts
* contextual search
* recommendation systems
* notification strategy
* background refresh
* predictive UX
* social mechanics
* gamification
* analytics dashboards
* deep linking
* share flows
* onboarding checkpoints
* collaborative systems
* export/import
* advanced filtering
* bulk actions
* admin tooling
* moderation systems
* experimentation/A/B testing
* accessibility tooling
* power-user workflows
* account recovery tooling
* onboarding analytics

---

# 6. Competitive Pattern Analysis

For every major feature area:

* compare against equivalent systems in elite applications
* explain WHY those patterns work
* identify transferable principles
* explain which patterns should NOT be copied directly
* identify opportunities for differentiation

Focus on:

* interaction quality
* perceived performance
* operational maturity
* responsiveness
* reliability
* engagement mechanics
* trust systems
* workflow optimization

---

# 7. Performance & Perceived Speed

Audit:

* startup time
* navigation latency
* interaction responsiveness
* animation smoothness
* rendering bottlenecks
* list virtualization
* memory usage
* battery usage
* image loading
* lazy loading
* prefetching
* cache effectiveness
* database query efficiency
* network payload sizes
* background processing efficiency
* map rendering optimization
* chart rendering scalability

Compare against:

* perceived performance strategies used by elite apps
* progressive loading systems
* skeleton/loading systems
* instant-feeling interaction patterns

Identify:

* hidden performance debt
* unnecessary rendering
* scalability issues
* slow interaction points
* frontend bottlenecks
* backend hotspots
* performance degradation risks

---

# 8. Data & Analytics Strategy

Review:

* event tracking architecture
* KPI visibility
* funnel tracking
* retention analytics
* engagement analytics
* feature adoption tracking
* telemetry systems
* crash reporting
* observability
* user journey tracking
* experimentation readiness
* cohort analysis capability
* product analytics maturity

Identify:

* measurement blind spots
* missing instrumentation
* inability to measure feature success/failure
* lack of behavioral visibility
* missing operational analytics

---

# 9. Security, Privacy & Trust

Audit:

* authentication systems
* authorization systems
* session handling
* credential storage
* encryption
* abuse prevention
* spam prevention
* moderation systems
* account recovery
* privacy controls
* reporting systems
* rate limiting
* anti-scraping systems
* GDPR/privacy readiness
* location privacy
* data exposure risks

Identify:

* trust-breaking risks
* exploit opportunities
* privacy weaknesses
* abuse vectors
* missing safety systems
* insufficient moderation tooling

---

# 10. Platform & Ecosystem Thinking

Review:

* mobile/web parity
* desktop adaptation
* deep linking
* sharing architecture
* integrations
* notifications ecosystem
* widgets/live activities
* wearable support
* shortcuts/intents
* APIs/SDK opportunities
* extensibility
* ecosystem integration
* multi-device continuity

Identify:

* ecosystem expansion opportunities
* platform-native behavior gaps
* continuity weaknesses
* integration limitations
* lock-in opportunities

---

# 11. Social & Network Effects

If applicable, audit:

* virality loops
* social reinforcement
* profile systems
* identity systems
* social proof
* community systems
* follow/friend systems
* collaborative workflows
* re-engagement systems
* competitive systems
* engagement decay risks
* sharing incentives

Identify:

* weak network effects
* weak retention loops
* missing community mechanics
* low social reinforcement
* opportunities for stronger habit formation

---

# 12. Developer Experience & Maintainability

Review:

* folder structure
* code organization
* naming consistency
* testing strategy
* CI/CD systems
* dependency management
* documentation quality
* onboarding complexity for developers
* component reuse
* type safety
* design system maturity
* deployment reliability
* release workflow
* branching strategies

Identify:

* maintainability risks
* fragile systems
* engineering bottlenecks
* onboarding friction
* architectural sprawl
* velocity constraints

---

# 13. Operational & Business Systems

Review:

* monetization flexibility
* subscription systems
* entitlement systems
* support tooling
* admin tooling
* moderation tooling
* rollback systems
* incident response readiness
* release management
* feature rollout systems
* staged deployments
* customer support workflows
* operational dashboards

Identify:

* operational fragility
* monetization limitations
* rollout risks
* inability to scale support
* missing operational infrastructure

---

# 14. Psychological Product Design

Audit:

* motivation loops
* reward timing
* emotional design
* progress visibility
* behavioral nudges
* dopamine/reward systems
* habit reinforcement
* urgency/scarcity systems
* sunk-cost reinforcement
* emotional pacing
* personalization psychology

Compare against:

* retention psychology used by elite platforms
* reinforcement systems used in habit-forming products

Identify:

* weak engagement psychology
* poor reward structures
* retention decay points
* weak emotional reinforcement

---

# 15. State Transition & Interaction Logic Audit

Audit:

* user state transitions
* modal stacking logic
* navigation stack consistency
* transactional integrity
* multi-step workflows
* interrupted session handling
* cross-tab synchronization
* optimistic UI conflicts
* race conditions
* stale state handling
* impossible state prevention

Identify:

* contradictory UI states
* state desynchronization risks
* broken workflow edge cases
* race-condition vulnerabilities
* impossible interaction states

---

# 16. Information Density & Cognitive Systems

Review:

* information layering
* scanability
* progressive complexity
* dashboard density
* chart readability
* contextual relevance
* attention management
* prioritization logic
* decision fatigue
* novice vs power-user scaling

Compare against:

* how elite apps expose complexity gradually
* how top-tier products maintain clarity at scale

Identify:

* cognitive overload
* excessive density
* hidden critical information
* weak prioritization
* confusing layouts

---

# 17. Power User & Expert Workflow Audit

Review:

* repeated task efficiency
* workflow acceleration
* bulk actions
* automation opportunities
* keyboard-first workflows
* saved workflows
* customization systems
* advanced filtering/querying
* rapid navigation systems
* workspace personalization

Identify:

* friction for expert users
* repetitive interaction costs
* inefficient high-frequency workflows
* missing acceleration systems

---

# 18. Internationalization & Global Readiness

Audit:

* localization readiness
* RTL layout support
* timezone handling
* translation scalability
* unit systems
* cultural assumptions
* map/location formatting
* text expansion resilience
* regional compliance
* accessibility law readiness

Identify:

* localization debt
* layout fragility
* hidden regional assumptions
* scalability limitations for global expansion

---

# 19. Failure-at-Scale Simulation

Simulate:

* millions of users
* poor network conditions
* low-end devices
* extremely large datasets
* oversized feeds/history
* burst traffic
* degraded APIs
* partial outages
* map saturation
* concurrent editing
* high-frequency updates
* excessive notifications

Identify:

* collapse points
* UX degradation patterns
* operational bottlenecks
* hidden assumptions that only work at small scale

---

# 20. Product Strategy Alignment

Review whether:

* every feature supports the core product loop
* the app has a coherent identity
* systems reinforce the main value proposition
* onboarding aligns with long-term retention
* metrics align with real user value
* features dilute focus
* roadmap direction remains coherent

Identify:

* feature bloat
* strategic contradictions
* identity confusion
* roadmap fragmentation
* unnecessary complexity

---

# 21. Competitive Differentiation Audit

Do NOT only compare feature parity.

Also identify:

* opportunities to outperform incumbents
* underserved workflows
* emerging interaction patterns
* opportunities for simplification
* specialization opportunities
* defensibility opportunities
* systems competitors cannot easily replicate

Recommend:

* distinctive interaction patterns
* defensible product systems
* unique ecosystem opportunities
* differentiation strategies

---

# 22. Emotional Friction Audit

Analyze:

* frustration points
* trust uncertainty
* ambiguity
* anxiety-inducing interactions
* confirmation confidence
* perceived loss of control
* punishment vs reward balance
* emotional pacing

Identify where users may feel:

* confused
* overwhelmed
* ignored
* manipulated
* uncertain
* punished
* frustrated

---

# 23. Design System Maturity Audit

Review:

* token architecture
* spacing scales
* typography scales
* responsive primitives
* component composability
* interaction consistency
* accessibility primitives
* motion standards
* theming systems
* dark mode architecture
* platform adaptation
* component contracts

Identify:

* missing primitives
* duplicated components
* inconsistent interaction patterns
* scaling limitations
* design system fragmentation

---

# 24. Final Deliverables

Provide:

1. Critical architectural weaknesses
2. Critical UX weaknesses
3. Missing infrastructure systems
4. Missing operational systems
5. Missing quality-of-life features
6. Missing resilience/error handling systems
7. Scalability risks
8. Technical debt risks
9. Hidden long-term maintenance risks
10. Product maturity gaps
11. Features users will subconsciously expect
12. Areas where elite apps behave differently
13. High-impact UX improvements
14. High-impact infrastructure improvements
15. High-impact operational improvements
16. Quick wins
17. Long-term investments
18. Priority-ranked recommendations
19. Risks if unresolved
20. Opportunities for differentiation

For every recommendation include:

* problem description
* why it matters
* expected user impact
* implementation complexity
* implementation priority
* risk level
* comparison to elite apps
* suggested direction

---

# Optional Inputs

You may provide:

* screenshots
* code structure
* folder layout
* architecture diagrams
* API structure
* component hierarchy
* design system documentation
* user flows
* database schema
* analytics events
* state management architecture
* interaction recordings
* performance metrics
* feature descriptions
* backend infrastructure details
* product goals
* target audience

The more context provided, the deeper and more accurate the audit should become.

---

# Final Instruction

Do not evaluate the app as a prototype.

Evaluate it as:

* a scalable platform
* a long-term product ecosystem
* a high-retention consumer application
* a production-grade system
* an application expected to compete with globally successful software platforms

Continuously look for:

* hidden complexity
* operational blind spots
* scalability failures
* UX inconsistencies
* trust-breaking interactions
* resilience gaps
* maintainability risks
* missing platform behaviors
* overlooked systems elite apps typically implement
* opportunities for differentiation and defensibility
