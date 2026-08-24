# QADIYA — DEPLOYMENT CONTRACT

> هذا الملف يحدد طريقة النشر الإنتاجية. الهدف: لا توجد نسخة Frontend ونسخة Backend منفصلتان يمكن أن تختلفا عن بعضهما.

## الحالة

- GitHub `main` هو مصدر الحقيقة للكود.
- QADIYA تُبنى وتُشغّل كـ **خدمة واحدة / Container واحد**.
- الـFrontend (`apps/web`) يُبنى إلى static assets، والـBackend (`apps/server`) يقدمه من نفس العملية التي تشغّل Colyseus/WebSocket/API.
- كل Deployment يمثل Git commit SHA واحد فقط.
- التطبيق يعرض SHA الحي من `/api/build`، و`/health` يعرض نفس معلومات البناء.

## خط النشر المعتمد

`push main` → GitHub Actions → build/typecheck/test/container smoke → Railway GitHub Autodeploy → Docker build → `/health` → تحويل الترافيك للنسخة الجديدة.

إذا فشل CI، يجب تفعيل **Wait for CI** في Railway حتى يتم تخطي Deployment. إذا فشل Docker build أو Healthcheck فلا تُعتبر النسخة الجديدة صالحة ولا يجب تحويل الترافيك إليها.

## لماذا خدمة واحدة؟

لو نُشر Frontend وBackend كخدمتين مستقلتين، يمكن أن تنجح واحدة وتفشل الأخرى أو تتأخر، فتظهر بروتوكولات غير متوافقة. الخدمة الواحدة تجعل الإصدار Atomic: نفس SHA، نفس Build، نفس Domain.

## Railway — إعداد مرة واحدة

1. أنشئ Project/Service جديدًا في Railway واختر **Deploy from GitHub repo**.
2. اربط `vnu1l/qadiya` واختر branch `main`.
3. اترك Root Directory على جذر المستودع. Railway سيكتشف `Dockerfile` في الجذر تلقائيًا.
4. فعّل **GitHub Autodeploy**.
5. فعّل **Wait for CI** حتى لا يبدأ Deployment إلا بعد نجاح GitHub Actions.
6. في Deploy/Healthcheck عيّن المسار: `/health`.
7. لا تضع Start Command يدويًا؛ الـDockerfile يملك `CMD` النهائي.
8. من Networking اختر **Generate Domain**. لاحقًا اربط الدومين الخاص من نفس القسم.
9. لا تربط Volume بخدمة التطبيق نفسها إلا لضرورة قصوى؛ البيانات الدائمة ستذهب إلى PostgreSQL/خدمات تخزين مستقلة حتى لا نربط دورة نشر التطبيق بقرص محلي.

بعد هذا الإعداد لا يحتاج كل تحديث إلى تدخل يدوي: أي Push ناجح إلى `main` ينشر Frontend + Backend معًا.

## التحقق من أن الموقع ليس نسخة قديمة

- افتح `/api/build` على الدومين الحي.
- قارن `commitSha` مع آخر commit في GitHub `main`.
- نفس SHA يظهر مختصرًا في شريط QADIYA العلوي داخل الواجهة.
- `/health` يجب أن يعيد HTTP 200 ويعلن `frontendReady: true`.

## قواعد لا تُكسر لاحقًا

- لا نفصل Frontend وBackend إلى Deployments مستقلة بدون قرار معماري موثق.
- لا نستخدم GitHub Pages للتجربة الإنتاجية؛ Pages لا يشغّل Game Server/WebSocket الدائم.
- لا نخفي فشل Backend خلف Frontend static ناجح.
- Deployment لا يُعد ناجحًا فقط لأن GitHub commit موجود؛ يجب وجود Railway deployment حي يمر بالـhealthcheck.
- الأسرار وقواعد البيانات لا تدخل GitHub؛ تستخدم Environment Variables/خدمات Railway.
