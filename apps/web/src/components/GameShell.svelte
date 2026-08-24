<script lang="ts">
  import type { GameSceneId } from '../lib/game/types';

  export let scene: GameSceneId;
  export let onHome: () => void;

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        return;
      }

      await document.exitFullscreen?.();
    } catch {
      // Fullscreen can be denied by the browser. The game shell remains usable without it.
    }
  }
</script>

<main class:in-court={scene === 'court'} data-scene={scene}>
  <div class="grain" aria-hidden="true"></div>
  <div class="ambient ambient-a" aria-hidden="true"></div>
  <div class="ambient ambient-b" aria-hidden="true"></div>

  <header class="topbar">
    <button class="brand" on:click={onHome} aria-label="العودة للرئيسية">
      <strong>قضية</strong>
      <span>QADIYA</span>
    </button>

    <div class="top-actions">
      <span class="build-pill">PRE-ALPHA · 0.1</span>
      <button class="icon-button" on:click={toggleFullscreen} title="ملء الشاشة" aria-label="تبديل ملء الشاشة">⛶</button>
    </div>
  </header>

  <slot />
</main>
