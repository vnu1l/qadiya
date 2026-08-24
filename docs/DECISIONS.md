# QADIYA — DECISIONS

> سجل القرارات طويلة العمر. لا تسجل هنا كل تفصيلة صغيرة؛ سجل القرارات التي إذا نسيها المطور التالي قد يهدم جزءًا من المنتج أو يعيد النقاش من الصفر.

## D-001 — Web Game, not traditional website
**Status:** Accepted

QADIYA تعمل كـFullscreen browser game داخل Game Shell واحد. لا نبني تدفق اللعب كسلسلة صفحات تعيد التحميل.

## D-002 — 2.5D layered presentation
**Status:** Accepted

المشهد الأساسي DOM/CSS/SVG/assets بطبقات 2.5D، Camera Director، parallax، transform/opacity. لا Unity WebGL ولا 3D engine كقاعدة للمحكمة.

## D-003 — Server authoritative truth
**Status:** Accepted

Ground Truth، الأسرار، صلاحيات الإجراءات، والنتائج النهائية authoritative على السيرفر. لا نرسل Truth Graph للعميل ثم نخفيه بصريًا.

## D-004 — Structured Case Engine before AI
**Status:** Accepted

القضايا تبنى من Graph/Timeline/Knowledge/Evidence structured ومتحققة. الذكاء الاصطناعي طبقة صياغة/تقديم لاحقة وغير حرجة.

## D-005 — Event-sourced court state
**Status:** Accepted

تقدم الجلسة يُشتق من Court Events وإجراءات وحقوق/تنازلات، وليس من Step Number جامد.

## D-006 — Soft phases, rare hard blockers
**Status:** Accepted

المراحل تنظّم وتوجّه، ولا تقفل المحكمة عادة. معظم النواقص warnings/waivers/recovery routes. Hard blockers قليلة ومخصصة للعدالة الأساسية أو استحالة الحالة.

## D-007 — Judge does not know truth
**Status:** Accepted

القاضي يرى ما عُرض للمحكمة وما تسمح له صلاحياته به. لا يرى Ground Truth. دقة الحكم جزء من أداء القاضي.

## D-008 — Legal outcome and truth are separate
**Status:** Accepted

يمكن أن يفوز الادعاء/الدفاع بإقناع القاضي بحكم خاطئ، بينما يخسر القاضي Accuracy. النتيجة القانونية والحقيقة تحسبان بشكل منفصل.

## D-009 — Private minimum is three players
**Status:** Accepted

يجب دعم جلسة Private من 3 لاعبين كتجربة كاملة. التكوين الأساسي: قاضٍ + ادعاء + متهم يدافع عن نفسه، مع System Characters عند الحاجة.

## D-010 — Dynamic case duration
**Status:** Accepted

لا يوجد match timer ينهي القضية. يمكن أن تمتد القضية لساعات. ندعم recess/suspend/resume/reconnect.

## D-011 — Human memory is gameplay
**Status:** Accepted

المتهم/الشاهد يراجع معلومات أوسع قبل المحكمة، ثم لا يحتفظ بحل كامل ظاهر أثناءها. النسيان يأتي من محدودية الوصول/الملاحظات لا RNG يعيد كتابة الحقيقة.

## D-012 — Role resources never mutate truth
**Status:** Accepted

البطاقات/الموارد تمنح مراجعة، فحصًا، استشارة، تركيزًا، أو إجراءً إضافيًا، لكنها لا تخلق Fact أو Evidence جديدًا لصالح اللاعب بعد بدء القضية.

## D-013 — Multi-defendant cases are first-class
**Status:** Accepted

العقود والـCase Engine يجب أن تدعم أكثر من متهم من البداية، بما في ذلك تضارب الأقوال والدفاع المشترك/المنفصل.

## D-014 — Knowledge requires provenance
**Status:** Accepted

كل معرفة مهمة تحمل مصدرًا ودقة/ثقة/precision عند الحاجة. لا نعطي شخصية وقتًا أو Fact دقيقًا بلا تفسير كيف عرفته.

## D-015 — Unequal information, equal opportunity
**Status:** Accepted

من الطبيعي أن يعرف طرف أكثر من طرف، لكن لا نصمم وضعًا يحرم الطرف الآخر من مسار منطقي للطعن/التفسير/الدفاع.

## D-016 — Voice and game state are separate systems
**Status:** Accepted

الصوت عبر WebRTC/SFU (LiveKit planned) منفصل عن Colyseus/Game State حتى لا يفشل أحدهما بفشل الآخر.

## D-017 — Svelte + TypeScript + Vite / Node + Colyseus
**Status:** Accepted for current foundation

لا يغيّر Framework لمجرد تفضيل المطور التالي. أي تغيير يحتاج سببًا تقنيًا مثبتًا وموافقة موثقة.

## D-018 — Persistent project memory is enforced
**Status:** Accepted

`docs/PROJECT_MEMORY.md` ملف إلزامي. أي source/config change مؤثر يجب أن يصاحبه تحديث له، والـCI يفرض ذلك.

## D-019 — Character art is modular DNA
**Status:** Accepted

نبني Character Assembly من طبقات/manifest/seed وزوايا متسقة بدل شخصية ثابتة لكل دور.

## D-020 — Private progression cannot farm ranked economy
**Status:** Accepted

Private history يمكن أن يحفظ منفصلًا، لكن Ranked rating والمكافآت التنافسية لا يمكن farm عبر جلسات خاصة متفق عليها.

---

## Pending decisions

هذه ليست تغييرات هدف؛ نقاط سنحسمها أثناء التنفيذ أو الاختبار:

- الاسم النهائي للعبة إذا تغير من QADIYA.
- الحدود النهائية لأعداد Public بعد الاختبارات.
- القانون الخيالي التفصيلي وقائمة أنواع الاعتراضات/التهم.
- هل Casual يسمح بـSystem Characters بنفس اتساع Private.
- نموذج حفظ القضايا الطويلة وجدولة استئنافها.
- مزود Auth الأول في الإنتاج (Discord مرشح قوي).
- LiveKit Cloud مقابل self-host عند النشر.
- شكل الاقتصاد والأسعار بعد وجود gameplay قابل للقياس.
