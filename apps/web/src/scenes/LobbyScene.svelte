<script lang="ts">
  import type { LobbySeatView } from '../lib/game/types';

  export let onPreviewCourt: () => void;

  const seats: readonly LobbySeatView[] = [
    { id: 'seat-1', displayName: 'نــايف', status: 'ready' },
    { id: 'seat-2', displayName: 'محامٍ محتمل', status: 'connected' },
    { id: 'seat-3', displayName: 'قاضٍ محتمل', status: 'connected' },
    { id: 'seat-4', displayName: 'شاهد', status: 'connected' },
    { id: 'seat-5', displayName: 'محقق', status: 'connected' },
    { id: 'seat-6', displayName: 'مقعد مفتوح', status: 'open' },
  ];

  const statusLabel: Record<LobbySeatView['status'], string> = {
    ready: 'جاهز',
    connected: 'متصل',
    open: 'بانتظار لاعب',
  };
</script>

<section class="lobby scene-enter" aria-label="لوبي تشكيل المحكمة">
  <div class="panel lobby-main">
    <div class="panel-title">
      <div>
        <span class="eyebrow">جلسة تجريبية</span>
        <h2>تشكيل المحكمة</h2>
      </div>
      <span class="status-dot">بانتظار اللاعبين</span>
    </div>

    <div class="seats">
      {#each seats as player, index}
        <article class:open={player.status === 'open'} class="seat">
          <div class="avatar">{index + 1}</div>
          <div>
            <strong>{player.displayName}</strong>
            <span>{statusLabel[player.status]}</span>
          </div>
        </article>
      {/each}
    </div>

    <div class="lobby-footer">
      <div>
        <span>الحد الأدنى العام</span>
        <strong>6 لاعبين</strong>
      </div>
      <button class="primary compact" on:click={onPreviewCourt}>تشغيل مشهد المحكمة</button>
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
