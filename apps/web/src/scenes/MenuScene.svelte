<script lang="ts">
  export let onStart: () => void;
  export let onPreviewCourt: () => void;
</script>

<section class="menu scene-enter" aria-label="القائمة الرئيسية">
  <div class="menu-copy">
    <div class="eyebrow">محكمة اجتماعية عربية · أدوار · أدلة · إقناع</div>
    <h1>كل قضية لها<br /><em>حقيقة واحدة.</em></h1>
    <p>
      لكن الوصول إليها ليس مضمونًا. استمع، دافع، اتهم، اعترض، واصنع الحكم الذي تستطيع إقناع المحكمة به.
    </p>

    <div class="menu-actions">
      <button class="primary" on:click={onStart}>ابدأ قضية</button>
      <button class="secondary" on:click={onPreviewCourt}>استعراض المحكمة</button>
    </div>
  </div>

  <div class="court-emblem" aria-hidden="true">
    <div class="emblem-ring"><span>ق</span></div>
    <div class="emblem-line"></div>
    <small>الحقيقة ليست الحكم</small>
  </div>
</section>
