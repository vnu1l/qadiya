# QADIYA — MASTER EXECUTION PLAN

> هذه الخطة هي المسار المرجعي من الـPre-alpha إلى النسخة الإنتاجية. لا تُعامل كقائمة أمنيات؛ كل مرحلة لها شروط خروج واضحة. أي تغيير جوهري في الهدف يجب أن يسجل في `docs/PROJECT_MEMORY.md` و`docs/DECISIONS.md` قبل تغيير هذه الخطة.

## طريقة استخدام الخطة

- لا تُقفز مرحلة لأنها تبدو مملة إذا كانت أساسًا لمرحلة لاحقة.
- يمكن العمل بالتوازي فقط عندما لا يخلق ذلك عقودًا متضاربة.
- كل Milestone يجب أن يملك Tests/Validation مناسبة قبل اعتباره مكتملًا.
- الـPlaceholders مسموحة للأصول الفنية فقط إذا كانت العقود النهائية صحيحة.
- لا نستخدم حلًا مؤقتًا يصبح فعليًا Permanent Architecture دون توثيق قرار واضح.

---

# PHASE 0 — Governance, Continuity, Repository Safety

## الهدف
جعل المشروع قابلًا للاستمرار حتى لو تغيّر المطور/الذكاء الاصطناعي بالكامل.

### 0.1 ملفات الاستمرارية
- [x] `AGENTS.md` — بروتوكول إلزامي.
- [x] `docs/PROJECT_MEMORY.md` — الذاكرة الكانونية.
- [ ] `docs/DECISIONS.md` — ADR-style decisions.
- [ ] `docs/STATUS.md` — الحالة الحالية فقط، قصيرة وقابلة للمراجعة.
- [ ] `docs/CHANGELOG.md` — تغييرات بشرية مفهومة.
- [ ] README يربط بهذه الملفات بوضوح.

### 0.2 Enforcement
- [ ] CI يفشل إذا تغير source/config معماري دون تحديث `PROJECT_MEMORY.md`.
- [ ] CI build/typecheck.
- [ ] لاحقًا lint/test gates.
- [ ] branch protection موصى بها عند بدء التعاون الفعلي.

### Exit Criteria
- أي AI يدخل repo يستطيع معرفة: ما اللعبة؟ ما القواعد غير القابلة للكسر؟ ما آخر شيء تم؟ ما الخطوة التالية؟
- Source changes لا تمر CI دون Memory update.

---

# PHASE 1 — Production Monorepo Foundation

## 1.1 Workspace
- [x] pnpm monorepo.
- [x] `apps/web`.
- [x] `apps/server`.
- [x] `packages/shared`.
- [x] `packages/case-engine` skeleton.
- [ ] تثبيت aliases والعقود العامة.
- [ ] env validation.
- [ ] versioned shared protocol.

## 1.2 Quality
- [ ] ESLint/format strategy خفيفة وغير مزعجة.
- [ ] Unit test runner.
- [ ] deterministic tests للـCase Engine.
- [ ] integration test harness للـserver rooms.
- [ ] browser smoke test لاحقًا.

## 1.3 Config
- [ ] `.env.example` بدون أسرار.
- [ ] runtime config typed.
- [ ] logging abstraction.
- [ ] error taxonomy.

### Exit Criteria
- `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm test` تعمل من الجذر.
- كل package يملك مسؤولية واضحة.

---

# PHASE 2 — Visual Foundation & Game Shell

## الهدف
تحويل الواجهة التجريبية الحالية إلى Runtime لعبة حقيقي قابل للتوسع.

## 2.1 Design Tokens
- [ ] ألوان أساسية داكنة.
- [ ] surfaces/wood/burgundy/gold/text/status tokens.
- [ ] spacing/radius/shadow/blur budgets.
- [ ] typography Arabic-first.
- [ ] motion durations/easings.
- [ ] z-index/layer policy.

## 2.2 Game Shell
- [ ] Shell واحد لا يعيد تحميل الصفحة.
- [ ] Scene outlet.
- [ ] persistent HUD layer.
- [ ] modal layer.
- [ ] notification layer.
- [ ] audio layer placeholder.
- [ ] fullscreen controller.
- [ ] reduced-motion support.

## 2.3 Scene Manager
- [ ] Menu.
- [ ] Matchmaking/Lobby.
- [ ] Role Reveal.
- [ ] Preparation.
- [ ] Courtroom.
- [ ] Intermission/Break.
- [ ] Results.
- [ ] Suspended Case state.

## 2.4 Camera Director
- [ ] declarative camera presets.
- [ ] Wide Court.
- [ ] Judge Focus.
- [ ] Witness Focus.
- [ ] Defense Focus.
- [ ] Prosecution Focus.
- [ ] Defendant Focus.
- [ ] Over-Shoulder variants.
- [ ] transition queue/cancel policy.
- [ ] parallax multipliers per layer.
- [ ] no-layout-thrash animations.

## 2.5 Court Scene Layers
- [ ] Far background.
- [ ] Mid architecture.
- [ ] player layer.
- [ ] foreground occlusion.
- [ ] lighting/FX.
- [ ] HUD.
- [ ] quality-level behavior.

### Exit Criteria
- التنقل بين المشاهد والكاميرات 60fps على جهاز متوسط بدون reload.
- لا يعتمد المشهد على صورة واحدة جامدة أو Component monolith.

---

# PHASE 3 — Character Visual System

## 3.1 Character DNA contracts
- [ ] demographic/basic identity.
- [ ] age band.
- [ ] face base.
- [ ] skin.
- [ ] hair/color.
- [ ] facial hair.
- [ ] eyebrows.
- [ ] glasses/accessories.
- [ ] makeup/lips where relevant.
- [ ] clothing/job styling.
- [ ] expression/trait states.

## 3.2 Render Assembly
- [ ] layer manifests.
- [ ] deterministic seed.
- [ ] compatibility rules.
- [ ] fallback asset policy.
- [ ] mirror-safe attributes.
- [ ] front/3-quarter/profile/back/over-shoulder contracts.

## 3.3 Motion
- [ ] idle breathing.
- [ ] blink.
- [ ] speaking state.
- [ ] subtle head/hand movement.
- [ ] objection/reaction states.
- [ ] judge action state.
- [ ] performance fallback.

## 3.4 Role Reveal
- [ ] quick reveal.
- [ ] expanded brief.
- [ ] identity + public background.
- [ ] private knowledge.
- [ ] secrets/objectives.
- [ ] preparation handoff.

### Exit Criteria
- يمكن توليد عشرات/مئات الشخصيات المختلفة من Seed بدون رسم Portrait مستقل لكل شخصية.
- الهوية المرئية متسقة بين زوايا الشخصية.

---

# PHASE 4 — Multiplayer Identity, Session, Lobby

## 4.1 Player Session
- [ ] guest/dev identity أولًا.
- [ ] persistent account abstraction.
- [ ] Discord OAuth later behind provider interface.
- [ ] reconnect token/session.

## 4.2 Lobby State
- [ ] players.
- [ ] readiness.
- [ ] voice readiness later.
- [ ] role preferences.
- [ ] accepted roles.
- [ ] party/private settings.
- [ ] host permissions for Private.

## 4.3 Modes
- [ ] Casual.
- [ ] Ranked contract placeholder.
- [ ] Private.
- [ ] 3-player Private support from data model day one.

## 4.4 Role Selection Engine
- [ ] weighted defendant priority.
- [ ] anti-repeat rules.
- [ ] judge candidate filtering.
- [ ] casual judge vote.
- [ ] ranked system assignment contract.
- [ ] defense candidate cards.
- [ ] rookie fairness.
- [ ] court-appointed counsel fallback.
- [ ] prosecution assignment.
- [ ] variable role slots.

## 4.5 Multi-defendant lobby support
- [ ] determine defendant count after mode selection.
- [ ] shared/separate counsel policy.
- [ ] role UI supporting multiple defendants.

### Exit Criteria
- 3 إلى 10 لاعبين يمكن تمثيلهم في lobby contracts دون hack خاص.
- لا يفرض النظام دورًا رفضه اللاعب مسبقًا إلا إذا Private host اختار قواعد مخصصة واضحة.

---

# PHASE 5 — Case Engine Core Primitives

> لا AI generation قبل اكتمال هذه المرحلة.

## 5.1 IDs and Entity Model
- [ ] CaseId.
- [ ] PersonId.
- [ ] FactId.
- [ ] EventId.
- [ ] EvidenceId.
- [ ] StatementId.
- [ ] SecretId.
- [ ] ChargeId.
- [ ] RoleId.
- [ ] RelationshipId.

## 5.2 Ground Truth
- [ ] immutable fact graph.
- [ ] causal links.
- [ ] temporal constraints.
- [ ] actor/object/location links.
- [ ] hidden/public classification.

## 5.3 Master Timeline
- [ ] exact/approximate timestamps.
- [ ] ranges.
- [ ] location transitions.
- [ ] travel feasibility.
- [ ] simultaneous-event validation.

## 5.4 Knowledge Graph
لكل Knowledge item:
- [ ] source type.
- [ ] source entity.
- [ ] accuracy.
- [ ] confidence.
- [ ] precision.
- [ ] whether believed vs objectively true.
- [ ] who can legally/physically know it.

## 5.5 Characters & Relationships
- [ ] personal goals.
- [ ] case role.
- [ ] public background.
- [ ] private secrets.
- [ ] relationships.
- [ ] memory profile.

## 5.6 Evidence
- [ ] evidence type.
- [ ] provenance.
- [ ] truth relation.
- [ ] admissibility metadata.
- [ ] discoverability.
- [ ] examination/follow-up layers.
- [ ] ambiguity.

## 5.7 Charges
- [ ] charge elements.
- [ ] burden model.
- [ ] evidence relations.
- [ ] alternative/lesser outcome support later.

### Exit Criteria
- يمكن تمثيل قضية كاملة يدويًا Structured بدون أي نص سردي.
- Tests تمنع Timeline مستحيل وKnowledge بلا مصدر.

---

# PHASE 6 — Case Families, DNA, Procedural Generation

## 6.1 Case Families
- [ ] Identity case.
- [ ] Innocence case.
- [ ] Intent case.
- [ ] Complicity case.
- [ ] Fraud/financial case.
- [ ] multi-suspect case.
- [ ] shared-defendant case.

## 6.2 Case DNA
- [ ] crime/objective.
- [ ] truth pattern.
- [ ] hidden side offense.
- [ ] primary/secondary evidence patterns.
- [ ] witness pattern.
- [ ] investigator issue.
- [ ] twist/modifier.
- [ ] complexity.

## 6.3 Template Composition
- [ ] curated skeletons.
- [ ] parameter pools.
- [ ] deterministic seeds.
- [ ] variant constraints.
- [ ] locale-aware Arabic naming/background generation without stereotypes.

## 6.4 Variable Role Selection
لكل candidate role:
- [ ] narrative importance.
- [ ] evidence access.
- [ ] interaction potential.
- [ ] decision potential.
- [ ] failure impact.
- [ ] canBeNPC.
- [ ] canBecomeDocument.
- [ ] replaceable.
- [ ] critical.

## 6.5 Missing Role Adaptation
- [ ] NPC conversion.
- [ ] document conversion.
- [ ] reject case if critical interaction missing.

### Exit Criteria
- Seed + player count + mode ينتج Case Draft متماسكًا ومتكررًا deterministically.

---

# PHASE 7 — Case Validation & Balance

## 7.1 Consistency Validator
- [ ] timeline consistency.
- [ ] knowledge provenance.
- [ ] evidence provenance.
- [ ] role references.
- [ ] secret references.

## 7.2 Legal/Gameplay Viability
- [ ] prosecution path exists.
- [ ] defense path exists.
- [ ] no unintended auto-win.
- [ ] no blind-guess-only solution.
- [ ] every human role has meaningful interaction.
- [ ] critical roles present or adapted.

## 7.3 Balance Scores
- [ ] prosecution strength.
- [ ] defense strength.
- [ ] evidence clarity.
- [ ] witness reliability.
- [ ] secret risk.
- [ ] complexity.

## 7.4 Simulation
- [ ] heuristic solver, not human persuasion simulator.
- [ ] reachable truth paths.
- [ ] information bottleneck detection.
- [ ] dead-evidence detection.

### Exit Criteria
- invalid cases are rejected before players see them.
- Validator output explains why, not just true/false.

---

# PHASE 8 — Preparation Gameplay

## 8.1 Defendant Memory
- [ ] full-ish pretrial memory view.
- [ ] precision based on character knowledge.
- [ ] limited retained notes.
- [ ] post-start reduced memory access.

## 8.2 Lawyer–Client Consultation
- [ ] private room state.
- [ ] voice channel later.
- [ ] note exchange.
- [ ] strategy markers private to defense.
- [ ] client can withhold information.
- [ ] privileged information classification.

## 8.3 Prosecution Prep
- [ ] case file.
- [ ] witnesses/evidence ordering.
- [ ] charge element checklist.
- [ ] private strategy notes.

## 8.4 Judge Prep
- [ ] procedural file only.
- [ ] no truth leak.

## 8.5 Witness/Expert Prep
- [ ] identity brief.
- [ ] personal memory.
- [ ] uncertainty.
- [ ] secrets.
- [ ] optional roleplay cues.

### Exit Criteria
- كل دور يدخل المحكمة وهو يملك Gameplay قبل الافتتاح وليس شاشة انتظار.

---

# PHASE 9 — Court Event Engine

## 9.1 Event Store
- [ ] append-only court events.
- [ ] sequence numbers.
- [ ] server timestamps.
- [ ] actor permissions.
- [ ] derived court state.

## 9.2 Soft Phase State
- [ ] phase hints.
- [ ] no hard wizard.
- [ ] reopen support.
- [ ] judge transition actions.

## 9.3 Rights / Waivers / Equivalent Actions
- [ ] right objects.
- [ ] opportunity offered.
- [ ] exercised.
- [ ] waived.
- [ ] satisfied via equivalent action.

## 9.4 Recovery Routes
- [ ] per pending item route registry.
- [ ] judge override logging.
- [ ] procedural warning engine.
- [ ] impossible-state detector.

### Exit Criteria
- Players can take non-scripted valid paths and court state still advances.
- no missing-button dead end.

---

# PHASE 10 — Official Statements, Evidence, Contradictions

## 10.1 Speech vs Official Record
- [ ] voice/free chat remains free.
- [ ] official statement capture UI.
- [ ] subject: place/time/person/action/object/relation/reason.
- [ ] speaker confirms official record when needed.

## 10.2 Court Record
- [ ] charges.
- [ ] admitted/rejected evidence.
- [ ] official statements.
- [ ] rulings.
- [ ] witness history.
- [ ] public timeline.
- [ ] no full transcript dependency.

## 10.3 Contradiction System
- [ ] statement ↔ evidence.
- [ ] statement ↔ statement.
- [ ] defendant ↔ co-defendant optional rule.
- [ ] contradiction semantics from structured graph.
- [ ] system proves conflict, not liar identity.

## 10.4 Knowledge Boundary Protection
- [ ] unsupported official statement detection.
- [ ] ranked restrictions for impossible knowledge.
- [ ] private/casual configurable leniency.

### Exit Criteria
- Scoring can rely on verifiable structured actions rather than AI opinion.

---

# PHASE 11 — Court Actions & Judge Control

## 11.1 Common Lawyer Actions
- [ ] objection.
- [ ] introduce evidence.
- [ ] call witness.
- [ ] confront contradiction.
- [ ] motion/request.
- [ ] private consultation request.
- [ ] rest case.

## 11.2 Judge Console
- [ ] floor control.
- [ ] objections.
- [ ] evidence admission.
- [ ] motions.
- [ ] witness management.
- [ ] recess.
- [ ] reopen.
- [ ] close evidence.
- [ ] readiness review.
- [ ] verdict.

## 11.3 Procedural Review
- [ ] limited system-review request.
- [ ] only objectively verifiable procedural errors.
- [ ] no system second-guessing judge’s human interpretation.

### Exit Criteria
- القاضي قوي لكن لا يستطيع كسر قواعد النظام دون أثر/مراجعة.

---

# PHASE 12 — Role Resources / Cards

## 12.1 Resource Framework
- [ ] per-role resource definitions.
- [ ] charges/uses.
- [ ] private vs public activation.
- [ ] no truth mutation.
- [ ] audit event.

## 12.2 First Resource Set
- [ ] Defendant Recall.
- [ ] Defendant Extra Consultation.
- [ ] Defense Deep Review.
- [ ] Prosecution Additional Examination.
- [ ] Judge Record Review.
- [ ] Witness Focus.

## 12.3 Loadouts Later
- [ ] fair unlock model.
- [ ] ranked equal-access policy.
- [ ] cosmetics separated from power.

### Exit Criteria
- resources create strategic timing decisions without turning game into card battler.

---

# PHASE 13 — Voice Architecture

## 13.1 LiveKit integration
- [ ] room/token service.
- [ ] courtroom channel.
- [ ] defense consultation channel.
- [ ] prosecution/private channels only if design allows.
- [ ] witness isolation rules.

## 13.2 Speaking State
- [ ] audio activity indicator.
- [ ] active speaker camera suggestion, not forced every time.
- [ ] judge mute/floor moderation capabilities limited by rules.

## 13.3 Failure Isolation
- [ ] voice reconnect independent from game reconnect.
- [ ] game continues if voice provider briefly fails.

### Exit Criteria
- 3–10 players can speak with stable SFU architecture without mesh scaling problem.

---

# PHASE 14 — Reconnect, Substitution, Long Sessions

## 14.1 Reconnect
- [ ] session resume.
- [ ] role restore.
- [ ] private knowledge restore securely.
- [ ] event catch-up.

## 14.2 Substitution
- [ ] defense substitute.
- [ ] prosecution substitute.
- [ ] emergency judge substitute.
- [ ] firm continuity rules.
- [ ] no tactical swap exploit.

## 14.3 Witness Unavailability
- [ ] pre-testimony.
- [ ] mid-testimony.
- [ ] post-testimony.
- [ ] prior statement rules per case.

## 14.4 Suspend / Resume Case
- [ ] session snapshot metadata.
- [ ] event persistence.
- [ ] resume schedule model later.

### Exit Criteria
- browser refresh or short disconnect does not destroy a 2-hour case.

---

# PHASE 15 — Verdict, Reveal, Scoring

## 15.1 Verdict
- [ ] per-charge outcome.
- [ ] reasoning voice/text optional.
- [ ] readiness warnings.
- [ ] rare hard blockers only.

## 15.2 Ground Truth Reveal
- [ ] true timeline.
- [ ] key secrets.
- [ ] missed evidence.
- [ ] verdict correctness.
- [ ] legal winner vs truth distinction.

## 15.3 Scoring Events
- [ ] correct contradiction.
- [ ] valid objection.
- [ ] evidence action.
- [ ] charge outcome.
- [ ] judge correctness.
- [ ] role completion.
- [ ] abandonment.
- [ ] misconduct.

### Exit Criteria
- no scoring dependency on opaque LLM judgment.

---

# PHASE 16 — Accounts, Persistence, Career

## 16.1 PostgreSQL
- [ ] users.
- [ ] profiles.
- [ ] role histories.
- [ ] matches/cases/sessions.
- [ ] verdicts.
- [ ] career stats.
- [ ] reputation.
- [ ] conduct.
- [ ] currency.

## 16.2 Career
- [ ] role-specific stats.
- [ ] beginner protection.
- [ ] unlock gates for serious ranked roles where appropriate.
- [ ] separate private history.

## 16.3 Economy
- [ ] Credits.
- [ ] cosmetics only for monetizable progression.
- [ ] no direct legal power purchase.

### Exit Criteria
- player progress survives deployment/restart and is auditable.

---

# PHASE 17 — Firms / Law Offices

- [ ] create/join firm.
- [ ] members/roles.
- [ ] firm stats.
- [ ] office cosmetics.
- [ ] substitution continuity.
- [ ] ranked/anti-boost rules.
- [ ] leaderboards.

### Exit Criteria
- firms add social/career value without creating unfair gameplay power.

---

# PHASE 18 — Matchmaking, Ranked, Anti-Abuse

## 18.1 Matchmaking
- [ ] role preference aware.
- [ ] expected case commitment.
- [ ] latency/region later.
- [ ] party/friend handling.

## 18.2 Ranked
- [ ] role rating.
- [ ] system judge selection.
- [ ] standardized allowed resources.
- [ ] stronger knowledge-boundary enforcement.

## 18.3 Conduct / Anti-Boost
- [ ] repeated opponent detection.
- [ ] suspicious reciprocal wins.
- [ ] disconnect patterns.
- [ ] reduced gain before punitive action.
- [ ] review/audit data.

### Exit Criteria
- public progression cannot be farmed cheaply through private/friend loops.

---

# PHASE 19 — Analytics & Case Quality Feedback

- [ ] case template win rates.
- [ ] role engagement rates.
- [ ] unused witness rate.
- [ ] single-evidence dominance.
- [ ] abandonment points.
- [ ] case duration distribution.
- [ ] quick “fair?” / “role fun?” feedback.
- [ ] automatic template quarantine threshold later.

### Exit Criteria
- Case Engine can improve based on real play data rather than guesses.

---

# PHASE 20 — AI Presentation Layer (Non-Critical)

> AI يأتي بعد أن تعمل القضية Structured بالكامل.

- [ ] Arabic narrative phrasing from structured facts.
- [ ] character brief prose.
- [ ] system-character natural responses constrained by Knowledge Graph.
- [ ] fallback deterministic text templates.
- [ ] timeout/failure does not stop court.
- [ ] never allow AI to invent ground truth mid-session.

### Exit Criteria
- disabling AI still leaves a playable, logically complete game.

---

# PHASE 21 — Art Production Pipeline

## 21.1 Court Assets
- [ ] courtroom architecture packs.
- [ ] lighting variants.
- [ ] foreground pieces.
- [ ] texture atlas strategy.
- [ ] AVIF/WebP export pipeline.

## 21.2 Character Assets
- [ ] modular layer packs.
- [ ] view consistency.
- [ ] expression states.
- [ ] mirror compatibility metadata.

## 21.3 UI Assets
- [ ] icons.
- [ ] stamps/seals.
- [ ] evidence frames.
- [ ] role cards.
- [ ] motion polish.

### Exit Criteria
- no single giant unoptimized scene asset; assets follow budgets and manifests.

---

# PHASE 22 — Accessibility & Settings

- [ ] master/voice/SFX volume.
- [ ] mic input selection.
- [ ] push-to-talk/open mic policy.
- [ ] reduced motion.
- [ ] text scaling.
- [ ] color-safe status design.
- [ ] visual quality Low/Balanced/High.
- [ ] fullscreen behavior.
- [ ] notification controls.

---

# PHASE 23 — Security & Privacy

- [ ] auth hardening.
- [ ] server validation for every gameplay action.
- [ ] rate limits.
- [ ] private case access control.
- [ ] voice/token expiry.
- [ ] no secrets in client bundle.
- [ ] dependency audit.
- [ ] log redaction.

---

# PHASE 24 — Deployment Architecture

## Initial Production
- [ ] web static/frontend deployment.
- [ ] Node realtime service.
- [ ] PostgreSQL managed or dedicated.
- [ ] LiveKit Cloud or self-hosted based on economics/ops.
- [ ] HTTPS/custom domain.
- [ ] health checks.
- [ ] structured logs.
- [ ] backups.

## Scale Later
- [ ] Redis presence/matchmaking if actually needed.
- [ ] room process scaling.
- [ ] region strategy.
- [ ] CDN assets.

### Rule
لا نشتري تعقيد scale قبل وجود حمل حقيقي، لكن العقود لا تمنع التوسع.

---

# PHASE 25 — Testing Matrix

## Unit
- Case Engine.
- validators.
- role weighting.
- contradiction rules.
- scoring.

## Integration
- lobby → case → court.
- reconnect.
- substitution.
- suspend/resume.

## Adversarial
- judge troll attempts.
- lawyer leaks.
- duplicate role assignment.
- client sends illegal action.
- impossible knowledge.
- disconnect during testimony.
- co-defendant contradiction edge cases.

## Performance
- 2+ hour event record.
- 10 players.
- many evidence items.
- slow network.
- low visual quality.

---

# PHASE 26 — Alpha Milestone

Alpha لا تعني كل الـCareer/Firms مكتملة. Alpha المطلوبة:

- [ ] 3-player Private playable end-to-end.
- [ ] 6+ player Private/Casual test playable.
- [ ] one or more generated case families.
- [ ] preparation.
- [ ] court event engine.
- [ ] evidence/statements/contradictions.
- [ ] judge controls.
- [ ] verdict/reveal.
- [ ] reconnect basics.
- [ ] voice.
- [ ] visual scene system functional.

---

# PHASE 27 — Closed Beta

- [ ] persistence/career basics.
- [ ] multiple case families.
- [ ] anti-abuse baseline.
- [ ] analytics.
- [ ] art pass.
- [ ] stability over long cases.
- [ ] player feedback loop.
- [ ] deployment/domain production path.

---

# PHASE 28 — Public Beta / Launch Readiness

- [ ] onboarding.
- [ ] moderation/reporting.
- [ ] robust auth.
- [ ] scalability tested.
- [ ] backups/recovery.
- [ ] terms/privacy as required.
- [ ] content safety/moderation for voice/community.
- [ ] monitoring/alerts.
- [ ] polished art/audio.
- [ ] case quality pool large enough to avoid repetition.

---

# CURRENT NEXT IMPLEMENTATION ORDER

التنفيذ الفوري بعد تثبيت هذه الوثائق:

1. Phase 0 complete: decisions/status/changelog + CI memory gate + README.
2. Phase 1 harden current workspace and test scripts.
3. Phase 2 refactor current `App.svelte` into Game Shell + Scene Manager + Camera Director.
4. Phase 4 shared lobby/role contracts enough to stop UI from inventing data locally.
5. Phase 5 Case Engine IDs/Fact/Timeline/Knowledge primitives with deterministic tests.
6. Then continue by numbered phases, revisiting order only when dependency requires it and documenting why.
