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
