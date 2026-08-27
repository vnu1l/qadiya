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

---

## 2026-08-24 — Preparation domain and bounded retained memory

**Changed**
- أضيف `PreparationCoordinator` مستقل عن الشبكة، يبني readiness من حالة الاتصال ووجود الـPrivate Brief بدل Step wizard.
- عدم ضغط Ready أصبح Soft Warning فقط؛ يمكن تجاوز التحذيرات صراحة، بينما غياب لاعب/Brief أساسي يبقى Hard Blocker لا يمكن تجاوزه.
- الدفاع المشترك ينشئ Consultation واحدة خاصة للمحامي وكل المتهمين الذين يمثلهم، ولا يستطيع أي outsider قراءتها أو الكتابة فيها.
- أضيف retained-memory storage داخل `PrivateCaseVault` مع سقف مطلق للعدد، حد لكل ملاحظة، وحد إجمالي للحروف كي لا تتحول الملاحظات إلى نسخة من القصة الكاملة.
- الملاحظات لا تُقص بصمت إذا تجاوزت الحدود؛ يُرفض التحديث بكود واضح.
- عند افتتاح المحكمة تُقفل retained notes ولا يمكن تعديلها بعدها.
- أضيف `ensureConsultation` لدعم استعادة/إعادة دخول preparation بصورة idempotent إذا كانت مجموعة المشاركين نفسها.
- أضيفت عقود Shared لحالة Preparation العامة فقط؛ النصوص الخاصة لا تدخل synchronized state.
- أضيفت اختبارات للـsoft override، hard blockers، shared counsel privacy، optional-role warnings، حدود الملاحظات وقفلها.

**Reason**
- تطبيق فكرة النسيان كمهارة بشرية بدون السماح بنسخ الـBrief كاملًا، ومنع زر جاهزية من صناعة Dead End مع الحفاظ على شروط العدالة الحقيقية.

**Remaining**
- الـCoordinator لم يُربط بعد بـCourtRoom/Colyseus state.
- لا توجد Memory Recall cards بعد؛ ستستخدم نفس Vault ولن تخلق Facts جديدة.
- optional variable-role participants ستأتي من Case Composer، بينما أول ربط بالغرفة سيبدأ بالأدوار الأساسية.

**Next**
- ربط PreparationCoordinator بالـCourtRoom والـpublic preparation state، ثم deterministic DNA→Blueprint composer.

---

## 2026-08-24 — Authoritative Preparation room lifecycle

**Changed**
- أضيف `PreparationState` عام إلى Colyseus: stage، participant ids، ready ids، وعدد hard blockers/warnings فقط؛ لا Memory/Secrets/Consultation text في الحالة المتزامنة.
- بعد نجاح التوزيع الذري يبدأ `PreparationCoordinator` تلقائيًا للأدوار الأساسية، ويُنشئ مجموعات الدفاع الخاصة من خطة التمثيل نفسها.
- أضيفت رسائل آمنة للجاهزية والملاحظات واسترجاع الملاحظات وقراءة Consultations وإضافة الملاحظات الخاصة.
- تعديل retained notes مسموح فقط أثناء Preparation، بينما قراءتها تبقى ممكنة بعد القفل حتى يعتمد HUD المحكمة عليها لاحقًا.
- فتح المحكمة أصبح Judge-only ويستخدم `attemptOpenCourt`: Hard Blocker لا يتجاوز، Soft Warning يحتاج override صريح.
- عند النجاح تقفل الملاحظات ويتحول `CourtState.phase` إلى `opening`.
- `setPrivateBriefForSession` يعيد حساب readiness فورًا ويتحقق من تطابق Role الـBrief مع الدور المعيّن.
- Disconnect أثناء Preparation لا يلغي القضية؛ يعيد حساب readiness ويظهر كـHard Blocker للدور الأساسي بدل خلق حكم أو إلغاء تلقائي.
- أضيف اختبار أن public PreparationState لا يحتوي نصوص الذاكرة/الملاحظات/الأسرار.

**Reason**
- وصل مرحلة التحضير بالشبكة مع الحفاظ على قاعدة: الأسرار server-only، الجاهزية ليست deadlock، لكن غياب عنصر عدالة أساسي لا يمكن تجاوزه بزر.

**Remaining**
- الأدوار المتغيرة ليست بعد ضمن Preparation لأن Case Composer لم يوزعها على البشر.
- أثناء المحكمة ستكون هناك Consultations جديدة/مؤقتة بإذن أو مورد؛ حاليًا كتابة consultation محصورة بمرحلة Preparation فقط.
- reconnect identity الفعلي لم يُبنَ بعد؛ disconnect الحالي يبقى hard blocker حتى نظام الجلسات يعيد ربط الهوية.

**Next**
- أول deterministic Case DNA→Blueprint composer، ثم ربطه بالـPrivate Briefs والـvariable-role preparation.

---

## 2026-08-24 — Atomic full-stack deployment contract

**Changed**
- اعتمد Deployment واحد للـFrontend والـBackend بدل خدمتين منفصلتين: Vite assets تُبنى داخل نفس Docker image الذي يشغّل Express/Colyseus.
- `apps/server` أصبح يقدم `apps/web/dist` من نفس العملية/الدومين، ويعيد SPA fallback بدون إخفاء API/matchmaking routes.
- `/health` لا يعيد 200 إلا إذا كان Frontend bundle موجودًا، ويعرض Git SHA وRailway deployment metadata.
- أضيف `/api/build` غير مخزن مؤقتًا، والـGameShell يعرض أول 7 أحرف من SHA الذي يشغله السيرفر فعلًا.
- أضيف Dockerfile production متعدد المراحل مع pnpm lockfile frozen.
- GitHub CI أصبح يبني الـDocker image النهائي ويشغله ثم smoke-tests `/health`, `/api/build`, والصفحة الرئيسية من نفس الحاوية.
- CI continuity gate أصبح يعتبر Dockerfile جزءًا من معمارية المصدر.
- أضيف `docs/DEPLOYMENT.md` بعقد النشر وخطوات Railway GitHub Autodeploy + Wait for CI + `/health`.

**Reason**
- منع حالة Frontend أحدث من Backend أو العكس، وتوفير دليل قابل للتحقق على النسخة الحية بدل الاعتماد على ادعاء في المحادثة.

**Remaining**
- Railway نفسه لم يُربط بعد لأن هذه البيئة لا تملك Railway connector/token؛ لا يجوز الادعاء أن هناك URL حي قبل تنفيذ الربط الخارجي مرة واحدة.
- بعد ربط Railway، يجب تفعيل Wait for CI وHealthcheck `/health` وتوليد Domain؛ بعدها كل Push ناجح إلى `main` يصبح Auto Deploy ذريًا.

**Next**
- إجراء الربط الخارجي مع Railway مرة واحدة، ثم العودة مباشرة إلى deterministic Case Composer دون تغيير معمارية النشر.

---

## 2026-08-24 — Render Free live-preview blueprint

**Changed**
- أضيف `render.yaml` كتعريف declarative لبيئة Preview: خدمة Web واحدة، Docker، Free، Frankfurt، branch `main`, و`autoDeployTrigger: checksPass`.
- Healthcheck في Render أصبح `/health` من نفس العقد المستخدم في Docker/CI.
- `apps/server` أصبح يتعرف على متغيرات Render الافتراضية (`RENDER_GIT_COMMIT`, `RENDER_GIT_BRANCH`, `RENDER_GIT_REPO_SLUG`, `RENDER_EXTERNAL_URL`) ويعرض `platform: render` في build metadata.
- `docs/DEPLOYMENT.md` نُقل من خطوات Railway المحددة إلى عقد Preview حالي على Render مع بقاء Docker الواحد مستقلًا عن المزود.
- `docs/STATUS.md` يسجل أن الجزء الوحيد المتبقي للحصول على URL حي هو OAuth/إنشاء Blueprint داخل حساب Render مرة واحدة.

**Reason**
- الحصول على رابط تطوير حي مجاني يمكن التحقق منه من Git SHA، مع بقاء Frontend وBackend على نفس النسخة وعدم ربط المشروع بمزود استضافة واحد.

**Remaining**
- لا يوجد URL حي حتى يربط مالك الحساب GitHub بـRender وينشئ Blueprint؛ هذه البيئة لا تملك Render connector ولا يجوز ادعاء نجاح Deployment قبل ذلك.
- Render Free ينام عند الخمول وfilesystem مؤقت، لذلك هو Preview فقط وليس Production النهائي.

**Next**
- إنشاء Blueprint من `vnu1l/qadiya` في Render مرة واحدة، ثم التحقق من `/health` و`/api/build` وSHA؛ بعدها العودة فورًا إلى نموذج عناصر التهمة وCase Composer.

---

## 2026-08-25 — Render Free blueprint compatibility fix

**Changed**
- أزيل `maxShutdownDelaySeconds` من `render.yaml` بعدما أكد Render أن هذا الحقل غير مدعوم على Free tier.

**Reason**
- إبقاء الـBlueprint متوافقًا فعليًا مع الخطة المجانية بدل ترك خيار صالح للخطط المدفوعة فقط.

**Remaining**
- يجب إعادة تحميل/مراجعة Blueprint في Render والتأكد من عدم ظهور validation errors أخرى قبل الإنشاء.

**Next**
- Refresh/Resync للـBlueprint في Render ثم Apply؛ بعد نجاح أول Deploy يتم فحص `/health` و`/api/build` ومطابقة SHA مع `main`.

---

## 2026-08-25 — Dependency lock bootstrap for first Render build

**Changed**
- أكد أول Render Docker build أن `pnpm-lock.yaml` لم يكن موجودًا في المستودع رغم أن Dockerfile وCI كانا يستخدمان `--frozen-lockfile`.
- أضيف Bootstrap مؤقت يولد lockfile داخل build stage باستخدام pnpm 10.15.0، ثم يعيد استخدام نفس lockfile في runtime production install بوضع frozen.
- أضيف endpoint مؤقت `/api/build/dependency-lock` يعرض lockfile الناتج فقط؛ الملف يحتوي metadata للحزم ولا يحتوي أسرارًا.
- أعيد CI مؤقتًا إلى install غير frozen فقط لتجاوز غياب الملف في checkout، بينما Docker runtime يبقى مثبتًا من lockfile المولد نفسه.
- أصبح `pnpm-lock.yaml` نفسه ضمن الملفات التي يتطلب تغييرها تحديث WORKLOG.

**Reason**
- الهدف ليس إبقاء installs غير مقفلة، بل استخراج lockfile الصحيح من بيئة تملك Registry ثم تثبيته فورًا في GitHub، بدل حذف شرط reproducibility بشكل دائم.

**Remaining**
- هذا Bootstrap مؤقت ويجب ألا يبقى بعد نجاح Deploy واحد واستخراج `pnpm-lock.yaml`.

**Next**
- انتظار Render deploy، تنزيل `/api/build/dependency-lock`، تثبيت الملف في `main`، ثم حذف endpoint وإرجاع Docker وCI بالكامل إلى `--frozen-lockfile`.


---

## 2026-08-27 — Full repository audit: dependency reproducibility blocker

**Changed**
- راجعت بنية الـmonorepo والـshared contracts والـCase Engine والـserver domain/CourtRoom والواجهة وDocker وRender وGitHub Actions قبل طلب Deploy جديد.
- كشف سجل GitHub Actions أن جميع الفحوص تتوقف في install قبل build بسبب نشر `@colyseus/core@0.16.25` اعتمادًا داخليًا بصيغة `workspace:^`؛ السبب أن `apps/server/package.json` كان يستخدم نطاقات `^0.16.0` العائمة.
- ثُبتت سلسلة Colyseus الحالية على إصدارات 0.16 محددة ومتوافقة: core 0.16.16، schema 3.0.68، وws-transport 0.16.5 بدل السماح بتغيرها تلقائيًا.
- أضيف Bootstrap CI لمرة واحدة يولد `pnpm-lock.yaml` من الحزم المثبتة ويدفعه إلى فرع `automation/pnpm-lock`، ثم يكمل install بوضع frozen.
- صلاحية GitHub Actions المطلوبة لهذه الخطوة مؤقتًا هي `contents: write`; يجب إزالتها فور تثبيت lockfile في main.

**Reason**
- لا يجوز نشر Preview بينما CI أحمر، ولا الاعتماد على نطاق dependencies متحرك يمكن أن يكسر البناء دون تغيير كود QADIYA.
- الهدف هو الوصول إلى build قابل لإعادة الإنتاج ثم إعادة Docker وCI بالكامل إلى `--frozen-lockfile`.

**Review notes**
- لم أجد TODO/FIXME مخفية أو `@ts-ignore` في المصدر.
- منطق lobby/role allocation/preparation/knowledge validation الحالي متسق مع القرارات الموثقة، بينما النواقص المعروفة مثل reconnect/timers/client networking تبقى Features غير مكتملة وليست أخطاء بناء.
- نموذج عناصر التهمة ما زال مرحلة تنفيذ تالية موثقة، وليس شيئًا سيتم ترقيعه أثناء إصلاح النشر.

**Remaining**
- يجب أن تنجح GitHub Actions فعليًا بعد تثبيت dependencies.
- بعد توليد lockfile: تثبيته في main، حذف صلاحية write وخطوة bootstrap والـdependency-lock endpoint المؤقت، وإرجاع Docker build إلى frozen بالكامل.
- بعد ذلك فقط يتم تشغيل/قبول Render deploy وفحص `/`, `/health`, و`/api/build` من النسخة الحية.

**Next**
- انتظار CI لهذا commit، أخذ lockfile من `automation/pnpm-lock`، عمل cleanup commit نهائي، ثم إعادة جميع فحوص CI والنشر إلى Render.


---

## 2026-08-27 — Canonical lock committed + full ESM import correction

**Changed**
- نجح CI في توليد `pnpm-lock.yaml` بعد تثبيت Colyseus، وتم أخذ نفس lockfile الناتج من فرع `automation/pnpm-lock` وتثبيته في main.
- حُذفت صلاحية `contents: write` وخطوة bootstrap المؤقتة من CI، وعاد install إلى `--frozen-lockfile`.
- عاد Docker build/runtime كلاهما إلى استخدام lockfile المثبت و`--frozen-lockfile`.
- حُذف endpoint المؤقت `/api/build/dependency-lock` فور انتهاء الغرض منه.
- كشف أول TypeScript build أخطاء ESM حقيقية كانت مخفية: relative imports/exports داخل `packages/shared`, `packages/case-engine` وserver source بلا امتداد صالح لـNodeNext. تمت مراجعتها وتصحيحها كلها إلى `.js` حيث يلزم.
- أضيف allowlist صريح لـpnpm build scripts الضرورية `esbuild` و`msgpackr-extract`.

**Reason**
- الهدف أن يكون الناتج ESM قابلًا للتشغيل في Node مباشرة، لا أن ينجح bundler فقط.
- أي صلاحية أو endpoint Bootstrap مؤقت يجب أن يختفي بمجرد انتهاء دوره.
- تثبيت lockfile يجعل GitHub وDocker وRender يستخدمون dependency graph واحدة.

**Remaining**
- إعادة CI كاملًا والتعامل مع أي خطأ جديد يظهر في build/typecheck/tests/Docker/smoke قبل السماح لـRender بالنشر.

**Next**
- تشغيل كامل pipeline؛ لا يُقبل Deploy إلا إذا أصبح أخضر بالكامل.


---

## 2026-08-27 — Court-appointed defense compatibility matching

**Changed**
- بعد نجاح build وtypecheck، كشف test واحد خللًا في court-appointed fallback: كان النظام يأخذ أول N محامين من الترتيب ثم يوزعهم، فيمكن أن يختار مجموعة لا تستطيع تمثيل متهم بعينه بسبب رفض سابق رغم وجود محامين صالحين لاحقًا.
- استبدل الاختيار بـbounded compatibility search على مجموعة اللاعبين الصغيرة: يختار مجموعة المحامين الأعلى ترتيبًا التي يوجد لها matching صالح مع المتهمين غير المحسومين.
- يضمن البحث أن كل مقعد دفاع جديد يُستخدم فعليًا، ويحترم كل lawyer↔defendant rejection قبل تثبيت المجموعة.
- أضيف test متعدد المتهمين يمنع regression الذي يفشل فيه ranked-prefix بينما توجد مجموعة لاحقة صالحة.

**Reason**
- رفض المحامي لمتهم يجب أن يكون constraint داخل عملية الاختيار نفسها، لا فحصًا متأخرًا بعد حجز المقاعد.

**Remaining**
- إعادة كامل CI؛ Docker/smoke لم يصلا للتنفيذ في الجولة السابقة لأن test gate أوقفهما.

**Next**
- require all tests green ثم Docker build + live-container smoke.


---

## 2026-08-27 — Full audit pipeline green

**Verified**
- canonical dependency install with `pnpm-lock.yaml`: PASS.
- production build for shared, case-engine, web and server: PASS.
- TypeScript/Svelte typecheck: PASS; Svelte reported 0 errors and 0 warnings.
- Case Engine tests: 19/19 PASS.
- Server/domain tests: 35/35 PASS, including the new multi-defendant defense compatibility regression.
- Production Docker image build: PASS.
- Same-container smoke test for frontend + backend + `/health` + `/api/build`: PASS.
- CI run 33030376002 completed successfully for source commit `1c82cf2bdd6e391fc7d1d7a2b49f47e16f890563`.

**Review conclusion**
- لا يوجد build/typecheck/test/container error معروف في الكود الحالي.
- التحذيرات المتبقية في سجل GitHub تخص runtime لبعض GitHub Actions القديمة التي يجبرها GitHub نفسه على Node 24؛ ليست تحذيرات Svelte/TypeScript أو فشلًا في QADIYA، ويمكن ترقية action revisions لاحقًا كصيانة CI مستقلة.
- النواقص المسجلة في STATUS هي Features غير منفذة بعد وليست أخطاء مخفية يتم تجاهلها.

**Next**
- هذا التحديث التوثيقي يصبح checkpoint النهائي للمراجعة ويخضع لنفس CI؛ Render مرتبط بـmain وchecksPass، لذلك ينشر فقط بعد نجاح فحصه.
- بعد التحقق من النسخة الحية نعود مباشرة إلى charge-element truth model ثم deterministic Case Composer.


---

## 2026-08-27 — Explicit charge-element ground-truth model

**Changed**
- استبدلت ChargeDefinition.elementFactIds بنموذج Legal Elements صريح.
- كل عنصر يملك id/title وtruth: satisfied | not-satisfied server-only وbasisFactIds تربطه بوقائع Ground Truth.
- أضيف BurdenStandard للتهمة، دون استخدامه بعد للحكم الآلي؛ الهدف تثبيت العقد الصحيح قبل Composer/Court proof layer.
- أضيف chargeGroundTruthSatisfied() لحساب الحقيقة الموضوعية للتهمة من عناصرها فقط.
- Validator يرفض: تهمة بلا متهم، متهمًا مكررًا، تهمة بلا عناصر، element id مكررًا عبر القضية، عنصرًا بلا truth basis، أو عنصرًا يشير إلى Fact غير موجود.
- أضيفت اختبارات جديدة للفصل بين objective truth وcourtroom proof ولحدود النموذج.

**Reason**
- QADIYA تفصل الحقيقة عن الحكم. لذلك لا يجوز أن تكون التهمة صحيحة مساوية لوجود Evidence أو لانطباع القاضي؛ الحقيقة يجب أن تكون مشتقة من عناصر قانونية مرتبطة بـGround Truth، بينما الإثبات سيأتي كطبقة مستقلة لاحقًا.

**Remaining**
- لا يوجد بعد Composer يولد هذه العناصر من DNA/template.
- لا توجد بعد evidence→charge-element proof relations أو verdict proof evaluation؛ هذه مراحل لاحقة ولا يجب خلطها بخطوة الحقيقة الحالية.

**Next**
- انتظار CI الكامل لهذه الخطوة فقط. إذا كان أخضر، الانتقال إلى curated deterministic DNA/template input للـComposer، دون ربطه بالغرفة بعد.


---

## 2026-08-27 — Curated deterministic template input

**Changed**
- أضيف CaseTemplate contract مستقل عن CaseBlueprint مع symbolic references لكل الشخصيات والمواقع والـFacts والـTimeline والـKnowledge والـEvidence والأدوار والتهم.
- أضيف bounded choice-pool model للشخصيات بدل أي randomness داخل القالب نفسه.
- أضيف validateCaseTemplate وvalidateCaseTemplateCatalog لمنع duplicate ids, orphan DNA, unknown refs, empty pools, invalid age/time/travel/score ranges, والتهم بلا عناصر أو truth basis.
- أضيف أول curated DNA/template pair: warehouse-access-misdirection:v1 كنواة اختبار فعلية للـComposer القادم.
- أضيفت اختبارات للـcatalog نفسه، purity/structured input، choice pools، missing fact refs، duplicate symbolic ids، DNA defendant bounds، وorphan DNA.

**Reason**
- نحتاج input ثابتًا ومراجعًا قبل كتابة مولد. الـComposer القادم يجب أن يستهلك عقدًا صحيحًا بدل أن يخترع القضية والمنطق في نفس الدالة.

**Remaining**
- لا يوجد seed resolution أو CaseBlueprint composition بعد.
- لا يتم حتى الآن توصيل catalog بالـlobby أو room lifecycle.

**Next**
- تشغيل CI الكامل لهذه الخطوة فقط. إذا أصبح أخضر، بناء deterministic seeded composer الذي ينتج CaseBlueprint ثم يمرره مباشرة إلى validateCaseBlueprint.


---

## 2026-08-27 — Seeded deterministic CaseBlueprint composer

**Changed**
- أضيف composeCaseTemplate كحد domain واضح: CaseDNA + validated CaseTemplate + seed → CaseBlueprint.
- أضيف PRNG داخلي deterministic مبني على stable 32-bit hashing؛ لا Math.random في مسار composition.
- كل symbolic character/location/fact/event/evidence/role/charge id يتحول إلى runtime id namespaced تحت case id مشتق حتميًا من template revision والseed.
- character pools تُحل حتميًا للأسماء والعمر والجنس والمهنة وmemory profile.
- كل المراجع الداخلية remapped إلى runtime ids قبل validation.
- composer يرفض seed فارغ، template غير صالح، أو Blueprint نهائي يحتوي validation errors عبر CaseCompositionError typed.
- أضيف guard أن عدد defendant slots الفعلي يجب أن يكون ضمن supportedDefendantCounts.
- أضيفت اختبارات same-seed equality, different-seed case identity, final Blueprint validation, wrongful-accusation truth preservation, empty seed, وinvalid-template rejection.

**Reason**
- نحتاج توليدًا يمكن إعادة إنتاجه والتحقيق فيه. نفس seed يجب أن يعيد نفس القضية، ولا يجوز أن يظهر Runtime Blueprint إلا بعد مرور template validation وblueprint validation.

**Remaining**
- لا يوجد بعد اختيار Template تلقائي من catalog بعد mode/defendant count.
- لا توجد role-specific private briefs مشتقة من Knowledge Graph.
- لا يتم بعد ربط composed case بالـCourtRoom أو variable-role human assignment.

**Next**
- تشغيل CI الكامل لهذه الخطوة فقط. إذا كان أخضر، بناء deterministic catalog selection/composition facade: mode + defendant count + seed يختار template صالحًا ثم compose، دون ربطه بالغرفة بعد.


---

## 2026-08-27 — Deterministic catalog composition facade

**Changed**
- أضيف compatibleCaseTemplates لتصفية catalog حسب DNA، defendant count، عدد slots الفعلي، وtemplate validation.
- أضيف composeCaseFromCatalog كواجهة domain واحدة تختار template صالحًا حتميًا من seed ثم تشغّل composeCaseTemplate.
- candidate list تُرتب قبل hash selection، لذلك تغيير ترتيب input لا يغيّر النتيجة.
- أضيف CaseCatalogCompositionError للأعداد غير الصالحة، seed الفارغ، وعدم وجود template متوافق.
- أضيفت اختبارات compatibility, same-seed determinism, input-order independence, invalid-template filtering, unsupported defendant count, وinput validation.

**Reason**
- فصل اختيار skeleton عن بنائه يمنع room/server من معرفة تفاصيل التوليد ويضمن أن كل قضية تبدأ من Template validated صالح للعدد والـDNA المحددين.

**Remaining**
- الـpre-game pipeline في CourtRoom لا يستدعي facade بعد.
- لا توجد private briefs مشتقة من Knowledge Graph ولا variable-role player assignment من composed blueprint بعد.

**Next**
- تشغيل CI الكامل لهذه الخطوة فقط. إذا نجح، بناء role-specific private brief derivation من CaseBlueprint داخل Case Engine قبل أي room integration.


---

## 2026-08-27 — Perceived knowledge privacy boundary

**Changed**
- أضيف perceivedDescription إلى runtime KnowledgeItem وTemplateKnowledgeItem.
- Composer ينقل perceivedDescription كما هي ولا يستبدلها بـCaseFact.description.
- Validator يرفض أي Knowledge بدون holder-facing perception، سواء في Template أو Blueprint.
- حدث أول curated case بحيث الشاهدة تتذكر/تعتقد أنها رأت شخصًا يشبه المتهم، بينما الحقيقة الموضوعية تبقى منفصلة.
- أضيفت اختبارات تمنع رجوع تسريب objective fact text إلى شخصية ذات accuracy أقل من 1.

**Reason**
- accuracy رقم وحده لا يمنع تسريب الحقيقة. إذا أعطينا الشاهد النص الموضوعي للـFact فسنعطيه Ground Truth حتى لو قلنا إن دقته 72%. هذه الطبقة تفصل ما حدث فعلًا عما تعتقد الشخصية أنها رأته.

**Remaining**
- Private Brief derivation لم يُبنَ بعد؛ الخطوة التالية ستستخدم perceivedDescription فقط للذاكرة الخاصة.

**Next**
- تشغيل CI الكامل. إذا نجح، بناء role-specific private brief derivation مع اختبارات تمنع ظهور charge truth/basis facts أو معرفة شخص آخر.
