<script lang="ts">
  type View = 'menu' | 'lobby' | 'court';
  type Camera = 'wide' | 'judge' | 'witness' | 'defense' | 'prosecution';

  let view: View = 'menu';
  let camera: Camera = 'wide';

  const cameraLabels: Record<Camera, string> = {
    wide: 'المحكمة',
    judge: 'القاضي',
    witness: 'الشاهد',
    defense: 'الدفاع',
    prosecution: 'الادعاء',
  };

  async function enterFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  }
</script>

<svelte:head>
  <meta name="description" content="QADIYA — لعبة محكمة عربية جماعية على الويب" />
</svelte:head>

<main class:in-court={view === 'court'}>
  <div class="grain" aria-hidden="true"></div>
  <div class="ambient ambient-a" aria-hidden="true"></div>
  <div class="ambient ambient-b" aria-hidden="true"></div>

  <header class="topbar">
    <button class="brand" on:click={() => (view = 'menu')} aria-label="العودة للرئيسية">
      <strong>قضية</strong>
      <span>QADIYA</span>
    </button>
    <div class="top-actions">
      <span class="build-pill">PRE-ALPHA · 0.1</span>
      <button class="icon-button" on:click={enterFullscreen} title="ملء الشاشة">⛶</button>
    </div>
  </header>

  {#if view === 'menu'}
    <section class="menu scene-enter">
      <div class="menu-copy">
        <div class="eyebrow">محكمة اجتماعية عربية · أدوار · أدلة · إقناع</div>
        <h1>كل قضية لها<br /><em>حقيقة واحدة.</em></h1>
        <p>
          لكن الوصول إليها ليس مضمونًا. استمع، دافع، اتهم، اعترض، واصنع الحكم الذي تستطيع إقناع المحكمة به.
        </p>
        <div class="menu-actions">
          <button class="primary" on:click={() => (view = 'lobby')}>ابدأ قضية</button>
          <button class="secondary" on:click={() => (view = 'court')}>استعراض المحكمة</button>
        </div>
      </div>

      <div class="court-emblem" aria-hidden="true">
        <div class="emblem-ring"><span>ق</span></div>
        <div class="emblem-line"></div>
        <small>الحقيقة ليست الحكم</small>
      </div>
    </section>
  {:else if view === 'lobby'}
    <section class="lobby scene-enter">
      <div class="panel lobby-main">
        <div class="panel-title">
          <div>
            <span class="eyebrow">جلسة تجريبية</span>
            <h2>تشكيل المحكمة</h2>
          </div>
          <span class="status-dot">بانتظار اللاعبين</span>
        </div>

        <div class="seats">
          {#each ['نــايف', 'محامٍ محتمل', 'قاضٍ محتمل', 'شاهد', 'محقق', 'مقعد مفتوح'] as player, index}
            <article class:open={index === 5} class="seat">
              <div class="avatar">{index + 1}</div>
              <div>
                <strong>{player}</strong>
                <span>{index === 0 ? 'جاهز' : index === 5 ? 'بانتظار لاعب' : 'متصل'}</span>
              </div>
            </article>
          {/each}
        </div>

        <div class="lobby-footer">
          <div>
            <span>الحد الأدنى العام</span>
            <strong>6 لاعبين</strong>
          </div>
          <button class="primary compact" on:click={() => (view = 'court')}>تشغيل مشهد المحكمة</button>
        </div>
      </div>

      <aside class="panel briefing-card">
        <span class="eyebrow">ما قبل الجلسة</span>
        <h3>كل لاعب يستلم شخصية، لا مجرد دور.</h3>
        <p>الاسم، العمر، المهنة، المعرفة، الذاكرة والأسرار ستُبنى من القضية نفسها.</p>
        <div class="brief-row"><span>الطور</span><strong>عشوائي</strong></div>
        <div class="brief-row"><span>عدد المتهمين</span><strong>ديناميكي</strong></div>
        <div class="brief-row"><span>المدة</span><strong>حتى تنتهي القضية</strong></div>
      </aside>
    </section>
  {:else}
    <section class="court-shell scene-enter">
      <div class="camera-stage camera-{camera}">
        <div class="court-layer layer-back">
          <div class="window left"></div>
          <div class="window center"></div>
          <div class="window right"></div>
        </div>
        <div class="court-layer layer-mid">
          <div class="judge-bench"><span class="figure judge">القاضي</span></div>
          <div class="witness-box"><span class="figure witness">الشاهد</span></div>
        </div>
        <div class="court-layer layer-floor">
          <div class="desk prosecution"><span class="figure">الادعاء</span></div>
          <div class="desk defense"><span class="figure">الدفاع</span></div>
          <div class="accused"><span class="figure">المتهم</span></div>
        </div>
        <div class="light-beam beam-a"></div>
        <div class="light-beam beam-b"></div>
      </div>

      <div class="court-hud">
        <div class="case-chip">
          <small>القضية #0001</small>
          <strong>جلسة استعراض</strong>
        </div>
        <div class="camera-tabs">
          {#each Object.entries(cameraLabels) as [key, label]}
            <button class:active={camera === key} on:click={() => (camera = key as Camera)}>{label}</button>
          {/each}
        </div>
      </div>

      <div class="court-actions">
        <button class="action danger">اعتراض</button>
        <button class="action">تقديم دليل</button>
        <button class="action">سجل المحكمة</button>
        <button class="action">طلب من المحكمة</button>
      </div>
    </section>
  {/if}
</main>
