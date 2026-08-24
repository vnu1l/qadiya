<script lang="ts">
  import { COURT_CAMERA_ORDER, COURT_CAMERA_PRESETS } from '../lib/game/camera';
  import type { CourtCameraId } from '../lib/game/types';

  let camera: CourtCameraId = 'wide';
</script>

<section class="court-shell scene-enter" aria-label="مشهد المحكمة">
  <div class="camera-stage {COURT_CAMERA_PRESETS[camera].cssClass}" data-camera={camera}>
    <div class="court-layer layer-back" aria-hidden="true">
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

    <div class="light-beam beam-a" aria-hidden="true"></div>
    <div class="light-beam beam-b" aria-hidden="true"></div>
  </div>

  <div class="court-hud">
    <div class="case-chip">
      <small>القضية #0001</small>
      <strong>جلسة استعراض</strong>
    </div>

    <div class="camera-tabs" aria-label="زوايا الكاميرا">
      {#each COURT_CAMERA_ORDER as cameraId}
        <button
          class:active={camera === cameraId}
          aria-pressed={camera === cameraId}
          aria-label={COURT_CAMERA_PRESETS[cameraId].ariaLabel}
          on:click={() => (camera = cameraId)}
        >
          {COURT_CAMERA_PRESETS[cameraId].label}
        </button>
      {/each}
    </div>
  </div>

  <div class="court-actions" aria-label="إجراءات المحكمة التجريبية">
    <button class="action danger">اعتراض</button>
    <button class="action">تقديم دليل</button>
    <button class="action">سجل المحكمة</button>
    <button class="action">طلب من المحكمة</button>
  </div>
</section>
