# QADIYA — APPEND-ONLY WORKLOG

> **MANDATORY FOR EVERY SOURCE / GAMEPLAY CHANGE**
>
> هذا سجل استمرارية تراكمي لأي ذكاء اصطناعي أو مطور يعمل على المشروع. يُقرأ قبل كل تعديل مع `PROJECT_MEMORY.md`، ولا تُحذف الإدخالات السابقة ولا يُعاد كتابة التاريخ لتجميله. أضف إدخالًا جديدًا في الأسفل مع كل تغيير برمجي/Gameplay/معماري.

كل إدخال يجب أن يذكر بإيجاز:
- ما الذي تغيّر فعليًا.
- لماذا تم بهذه الطريقة.
- ما الذي اكتمل من الخطة.
- أي ثغرة/دين/ملاحظة باقية.
- الخطوة التالية الدقيقة.
- إذا تغير هدف: اذكره هنا **وفوق ذلك** حدّث `PROJECT_MEMORY.md` و`DECISIONS.md`.

---

## 2026-08-24 — Continuity foundation

**Changed**
- أنشئت ملفات الاستمرارية: `AGENTS.md`, `PROJECT_MEMORY.md`, `MASTER_PLAN.md`, `DECISIONS.md`, `STATUS.md`, `CHANGELOG.md`.
- أضيف CI gate لمنع source changes بلا ذاكرة تنفيذية.

**Reason**
- المشروع طويل المدى ويجب ألا يعتمد على ذاكرة نموذج أو محادثة بعينها.

**Next**
- تفكيك واجهة pre-alpha إلى Game Shell ومشاهد مستقلة.

---

## 2026-08-24 — Modular Game Shell

**Changed**
- فُكك `App.svelte` إلى `GameShell`, `MenuScene`, `LobbyScene`, `CourtScene`.
- أضيف Camera registry وعقود typed للمشهد.

**Reason**
- منع monolithic UI وبناء أساس لحركة 2.5D بدون page reloads.

**Remaining**
- الرسم الحالي Placeholder CSS وليس Art pipeline نهائيًا.

**Next**
- Shared lobby/role contracts وCase Engine primitives.

---

## 2026-08-24 — Structured case foundation

**Changed**
- أضيفت عقود الأدوار واللوبي والـCourt Events في `packages/shared`.
- أُعيد بناء Case Engine حول Facts/Timeline/Knowledge/Evidence/Roles/Charges.
- أضيف Validator + unit tests.

**Reason**
- منع تحويل القضايا لاحقًا إلى prompt حر أو بيانات غير قابلة للتحقق.

**Remaining**
- لا يوجد بعد Case DNA أو temporal travel feasibility.

**Next**
- Role fairness ثم Timeline/Knowledge precision.

---

## 2026-08-24 — Fair role allocation and court floor security

**Changed**
- أضيف server-side weighted role allocator مع anti-repeat للمتهمين.
- رفض الدور يعطي وزن صفر ولا يسمح بتعيين قسري.
- القاضي الجديد يبقى مؤهلًا في Casual.
- المحامي المبتدئ يبقى ظاهرًا، وCourt-appointed يحترم opt-in.
- `speaker:request` لم يعد يمنح اللاعب الكلمة مباشرة؛ القاضي وحده يمنح Official Floor.

**Reason**
- النزاهة لا يجب أن تعتمد على العميل أو Random خام، ومنح أي لاعب نفسه الكلمة كان ثغرة مباشرة.

**Remaining**
- `recentAssignments` سيأتي من persistence لاحقًا، لا من العميل.
- Conduct لم يدخل بعد في أهلية القاضي.

**Next**
- Master Timeline travel feasibility + Knowledge precision provenance.

---

## 2026-08-24 — Timeline feasibility and source-bounded knowledge precision

**Changed**
- أضيفت `LocationDefinition` و`TravelLink` إلى Case Blueprint.
- Validator يحسب أقصر زمن انتقال عبر شبكة المواقع ويرفض الوجود المتداخل في موقعين أو انتقالًا أسرع من الحد الأدنى أو موقعًا بلا مسار معرف.
- كل `KnowledgeSource` يعلن `precisionLimit`، ولا يمكن لـKnowledgeItem أن يدعي دقة أعلى من مصدره.
- أضيفت اختبارات للانتقال المستحيل، المواقع المتداخلة، ودقة المعرفة.

**Reason**
- منع القضايا التي تظلم طرفًا بسبب Timeline مستحيل أو شاهد مُنح توقيتًا دقيقًا بلا أساس معرفي.

**Remaining**
- travel graph حاليًا ثابت بالدقائق ولا يملك وسيلة نقل/ظروف حركة؛ تضاف فقط إذا احتاج Case DNA لذلك.
- `precisionLimit` يثبت سقف الدقة لكنه لا يفسر وحده *لماذا* المصدر دقيق؛ لاحقًا يمكن ربطه بأداة/سجل/anchor structured عند الحاجة.

**Next**
- Case DNA + variable-role scoring/adaptation، ثم typed server lobby state.

---

## 2026-08-24 — Case DNA and variable-role adaptation

**Changed**
- أضيف `CaseDNA` يحدد family/mode/truth pattern/evidence pattern/witness pattern/modifiers/defendant range/variable-role budget قبل بناء التفاصيل.
- أضيف validator يمنع DNA متناقضًا، مثل cross-defendant modifier بدون تعدد متهمين.
- `RoleDefinition` أصبح يملك `roleKind` صريحًا.
- أضيف `humanRoleValue` و`adaptVariableRoles`: المقاعد البشرية تذهب للأدوار الأعلى قيمة تفاعلية، والبقية تتحول إلى System Character أو Document فقط إذا كان ذلك مسموحًا وآمنًا.
- الدور Critical لا يتحول بصمت إلى مستند.
- أضيفت اختبارات تثبت أن جلسة 3 لاعبين يمكن أن تشغّل أدوار القضية كـSystem Characters بدل كسر القضية.

**Reason**
- العدد يجب أن يغيّر طريقة تمثيل أدوار القضية لا منطق الحقيقة، وأن يكون 3-player mode مسارًا أصليًا من نفس Case Engine.

**Remaining**
- Case DNA لا يولد Blueprint بعد؛ composition/generator يأتي بعد اكتمال selection/validation primitives.
- role value weights أولية ويجب معايرتها من analytics لاحقًا.

**Next**
- Typed Colyseus lobby state ورسائل آمنة للـpreferences/settings، ثم Preparation/privilege contracts.

---

## 2026-08-24 — Authoritative lobby inputs and Private room rules

**Changed**
- أضيفت constants/type guards مشتركة للأدوار وأنواع الجلسة.
- Player/Court/Lobby rules أصبحت Colyseus Schema مستقلة.
- `roles:preferences` يُعقم على السيرفر، و`private:rules` Host-only.
- Private min=3/max=12 invariants server-side، وتعطيل تعدد المتهمين يعطل cross-defendant contradictions.
- readiness وhost transfer أصبحت authoritative room state.

**Reason**
- منع المتصفح من تقرير قواعد الجلسة أو إرسال values خارج العقود.

**Remaining**
- Role assignment transaction نفسها لم تُطبق بعد.

**Next**
- Server-only role assignment transaction + Preparation/private knowledge boundaries.

---

## 2026-08-24 — Atomic core roles and private preparation vault

**Changed**
- أضيف `CoreRoleAllocationPlan` و`DefenseRepresentationPlan` لدعم الدفاع المشترك وSelf-representation.
- أضيف `applyCoreRolePlan` كمعاملة server-only تتحقق من الخطة كاملة قبل تعديل State.
- 3-player Private self-representation أصبح مسارًا ممثلًا ومختبرًا.
- أضيف `PrivateCaseVault` خارج Colyseus Schema لأسرار الشخصية والذاكرة والاستشارة المحمية.
- العميل لا يستطيع طلب Brief لاعب آخر.

**Reason**
- منع نصف توزيع أدوار فاسد ومنع تسريب أسرار القضية إلى synchronized state.

**Remaining**
- لا يوجد بعد coordinator يبني CoreRoleAllocationPlan من التصويت/الاختيارات تلقائيًا.

**Next**
- RoleAllocationCoordinator ثم Preparation coordinator.

---

## 2026-08-24 — Mode → defendant count → Case DNA selection pipeline

**Changed**
- نُظف `CaseMode` حتى لا يخلط بين الطور والحقيقة: `wrongly-accused` بقي TruthPattern بدل أن يكون Mode أيضًا.
- أضيفت `selectCaseMode`, `selectDefendantCount`, `selectCaseDNA` بهذا الترتيب الصريح.
- كل خطوة ترشح فقط الخيارات التي يمكن أن تنتج قضية صالحة للعدد وقواعد اللوبي وحجم الالتزام.
- أضيف حساب نطاق مقاعد Core الممكن (دفاع مشترك/منفصل/Self-representation) حتى لا يختار النظام DNA يترك لاعبين بلا دور.
- Small/Standard/Large/Long تؤثر على Complexity المقبولة دون فرض مدة زمنية.

**Reason**
- تطبيق تدفق البداية المتفق عليه: طور عشوائي أولًا، ثم عدد المتهمين، ثم القضية؛ ومنع اختيار قضية ثم ترقيعها لتناسب اللوبي.

**Remaining**
- الاختيار الحالي uniform بين الخيارات الصالحة؛ anti-repetition/analytics weighting سيأتي مع history.
- ما زال يلزم التأكد من توفر لاعبين *موافقين فعليًا* لكل Core role في RoleAllocationCoordinator.

**Next**
- RoleAllocationCoordinator الذي يحول الاختيارات إلى لاعبين فعليين، ثم أول DNA→Blueprint composer.

---

## 2026-08-24 — Interactive core role allocation coordinator

**Changed**
- أضيف `RoleAllocationCoordinator` كطبقة orchestration مستقلة لا تعدل Colyseus state مباشرة.
- يدعم Weighted/Random/Private defendant selection مع احترام قبول الدور والجاهزية.
- Casual judge vote يرشح candidates مؤهلين، يمنع self-vote، ويملك zero-vote/tie recovery عبر fairness weights بدل deadlock.
- Defendant-choice defense أصبح تفاعليًا: المتهم يطلب محاميًا، والمحامي يقبل أو يرفض قبل اعتبار التمثيل مكتملًا.
- رفض المحامي يُحفظ لذلك المتهم حتى لا يعيده Court-appointed fallback لنفس العلاقة بشكل صامت.
- Court-appointed fallback يحترم `allowAutomaticAssignment` ولا يفرض الدور على من لم يسمح به.
- Multi-defendant defense يدعم shared counsel وself representation، لكنه لا يكتمل إلا إذا طابق العدد الفعلي لمحامي الدفاع البشري المقاعد المطلوبة للقضية.
- Private host hooks موجودة لاختيار المتهم/القاضي/خطة الدفاع مع نفس فحوص النزاهة.
- الادعاء يُعين في النهاية من لاعب متبقٍ وافق على الدور، لمنع core-role collision.
- أضيفت اختبارات لتدفق Casual، رفض المحامي، 3-player Private self-representation، عدد مقاعد الدفاع، self-vote، وعدم فرض الادعاء.

**Reason**
- تحويل تصميم توزيع الأدوار من دوال منفصلة إلى مسار واحد يمكن للغرفة تشغيله دون اختصار تفاعل اللاعبين أو خلق نصف حالة غير صالحة.

**Remaining**
- الـCoordinator يعمل حاليًا على snapshot للاعبين؛ CourtRoom integration يجب أن يعيد التحقق من الاتصال/القبول قبل `applyCoreRolePlan`، وهو أصلًا يملك validation ذرّيًا لهذا الغرض.
- timeouts لم تُربط بعد، لكن fallback paths موجودة كي لا نحتاج اختراع سلوك جديد لاحقًا.
- تحديد العدد المطلوب لمحامي الدفاع سيأتي من Case Composer/role adaptation بدل قيمة خارجية عند اكتمال الربط.

**Next**
- ربط coordinator بالـCourtRoom ورسائل التصويت/اختيار المحامي، ثم Preparation coordinator.

---

## 2026-08-24 — Authoritative room integration for role allocation

**Changed**
- نقل public role-allocation snapshot contracts إلى `packages/shared` حتى يرى العميل فقط الحالة العامة الضرورية، بدون weights أو history أو أسرار.
- أضيف `RoleAllocationState` إلى Colyseus state لعرض المتهمين، مرشحي القاضي، القاضي المحسوم، عدد مقاعد الدفاع، وطلبات المحامي المعلقة.
- `CourtRoom` أصبح يملك Coordinator server-only ويقبل فقط أفعالًا محددة: تصويت القاضي، طلب محامٍ، قبول/رفض، self-representation، وPrivate host selections.
- بداية التوزيع نفسها بقيت server-owned عبر `beginCoreRoleAllocation`; لا يوجد client message يمرر `defendantCount` أو `requiredDefenseLawyerCount`.
- إغلاق تصويت Casual/Ranked وcourt-appointed timeout يملكان hooks سيرفر مستقلة؛ Private host فقط يستطيع طلب الإغلاق/fallback يدويًا.
- عند اكتمال الـCoordinator تمر الخطة مجددًا عبر `applyCoreRolePlan` الذرية قبل تطبيق أي دور.
- إذا خرج لاعب أثناء role allocation تلغى الدفعة بأمان وتعود الغرفة للـLobby مع Ready reset بدل الاستمرار على snapshot قديم.
- role preferences أصبحت مجمدة بعد بدء التوزيع لمنع تغيير الأهلية أثناء التصويت/الاختيار.
- أضيف اختبار لإسقاط public allocation snapshot وإعادة ضبطه.

**Reason**
- جعل التفاعل حقيقيًا على الشبكة دون إعطاء العميل سلطة على منطق التوزيع أو السماح بتسابق بين تغييرات preferences والاختيارات الجارية.

**Remaining**
- late join أثناء role allocation لم يُقفل بعد على مستوى matchmaking/room lock؛ يجب ربط lock/unlock مع pre-game lifecycle.
- لا توجد timers فعلية للتصويت/عدم رد المحامي بعد؛ توجد hooks/fallback server-side فقط.
- role history ما زال placeholder server-side فارغًا حتى تأتي persistence.

**Next**
- Preparation coordinator + retained notes/consultation lifecycle، ثم أول deterministic DNA→Blueprint composer.
