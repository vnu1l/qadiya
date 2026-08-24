# QADIYA — DEPLOYMENT CONTRACT

> هذا الملف يحدد طريقة النشر المعتمدة. الهدف الأساسي: لا توجد نسخة Frontend ونسخة Backend منفصلتان يمكن أن تختلفا عن بعضهما، ولا يُقال إن ميزة أصبحت Live قبل التحقق من النسخة الحية نفسها.

## المصدر الوحيد للحقيقة

- GitHub branch `main` هو مصدر الحقيقة للكود.
- QADIYA تُبنى وتُشغّل كـ **خدمة واحدة / Container واحد**.
- الـFrontend (`apps/web`) يُبنى إلى static assets داخل نفس Docker image الذي يشغّل الـBackend (`apps/server`).
- Express يقدم الواجهة من نفس العملية والدومين الذي يشغّل Colyseus/WebSocket/API.
- كل Deployment يمثل Git commit SHA واحدًا فقط.
- `/api/build` و`/health` يعرضان بصمة النسخة الحية، والواجهة تعرض SHA مختصرًا في الأعلى.

## بيئة التطوير الحية الحالية — Render Free

Render هو Preview/Staging المجاني أثناء التطوير، وليس Production النهائي.

المسار المعتمد:

`push main` → GitHub Actions → build/typecheck/test/Docker smoke → Render `checksPass` autodeploy → Docker build → `/health` → النسخة الحية.

يوجد `render.yaml` في جذر المستودع ويثبت الإعدادات التالية:

- Web Service واحدة باسم `qadiya`.
- Docker runtime من `./Dockerfile`.
- Free instance.
- Region: Frankfurt.
- Branch: `main`.
- Auto deploy فقط بعد نجاح CI (`autoDeployTrigger: checksPass`).
- Health check: `/health`.

### لماذا Frankfurt؟

هو أقرب Region متاح في Render لمنطقة الشرق الأوسط من الخيارات الحالية، ويقلل المسافة مقارنة بالولايات المتحدة أثناء التجربة. هذا قرار Preview فقط ويمكن تغييره عند اختيار Production النهائي.

## قيود Render Free المقبولة مؤقتًا

- قد تدخل الخدمة Sleep بعد فترة خمول، لذلك أول اتصال بعد الخمول قد يتأخر حتى تستيقظ.
- نظام الملفات Ephemeral؛ لا تحفظ عليه قاعدة بيانات أو ملفات مستخدم دائمة.
- لا يُستخدم كاستضافة Production نهائية للعبة.
- لا نبني منطق اللعبة على افتراض أن العملية ستبقى شغالة بلا Restart.

هذه القيود مقبولة لأن الهدف الحالي هو رابط حي دائم نسبيًا لمشاهدة التطوير والتحقق من أن ما في GitHub هو ما يعمل فعلًا.

## Production النهائي

لم يُحسم مزود Production بعد. الشرط الحالي أن يكون أقوى وأرخص ما يمكن ضمن ميزانية منخفضة، مع إمكانية Docker/WebSockets ونشر آلي من GitHub. الانتقال لاحقًا لا يغير معمارية QADIYA لأن عقد النشر هو Container واحد مستقل عن المزود.

## التحقق من أن الموقع ليس نسخة قديمة

بعد كل Deployment:

1. افتح `/health` على الدومين الحي؛ يجب أن يعيد HTTP 200 و`frontendReady: true`.
2. افتح `/api/build`؛ يجب أن يكون `platform: "render"` في Preview الحالي.
3. قارن `commitSha` مع آخر commit في GitHub `main`.
4. نفس SHA يظهر مختصرًا في شريط QADIYA العلوي.
5. لا يُعتبر التحديث Live إذا لم يتطابق SHA حتى لو كان GitHub commit موجودًا.

## إعداد Render مرة واحدة — الجزء الذي يحتاج مالك الحساب

هذه البيئة لا تملك اتصالًا مباشرًا بحساب Render، لذلك OAuth/إنشاء الـBlueprint يحتاج مالك الحساب مرة واحدة فقط:

1. تسجيل الدخول إلى Render بحساب GitHub.
2. اختيار **New → Blueprint**.
3. ربط repository `vnu1l/qadiya`.
4. Render يقرأ `render.yaml` تلقائيًا؛ لا تعيد إدخال build/start commands يدويًا.
5. مراجعة أن الخدمة `qadiya`، الخطة `Free`، والمنطقة `Frankfurt` ثم Apply/Create.
6. بعد اكتمال أول Deploy، إرسال الدومين `*.onrender.com` للتحقق من `/health` و`/api/build`.

بعد ذلك كل Push ناجح إلى `main` ينشر تلقائيًا ولا يحتاج رفع ملفات يدويًا.

## قواعد لا تُكسر لاحقًا

- لا نفصل Frontend وBackend إلى Deployments مستقلة بدون قرار معماري موثق.
- لا نستخدم GitHub Pages كبيئة اللعبة الحية؛ Pages لا يشغّل Game Server/WebSocket دائمًا.
- لا نخفي فشل Backend خلف Frontend static ناجح.
- لا نحفظ أسرارًا أو Tokens أو كلمات مرور داخل GitHub.
- لا نعتمد على filesystem المحلي للبيانات الدائمة.
- لا نعتبر GitHub commit وحده دليلًا على أن الموقع تحدث؛ التحقق يكون من الدومين الحي وSHA.
