<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameSceneId } from '../lib/game/types';

  export let scene: GameSceneId;
  export let onHome: () => void;

  let buildLabel = 'LOCAL';
  let buildTitle = 'نسخة محلية أو غير متصلة بخادم الإنتاج';

  onMount(() => {
    void loadBuildInfo();
  });

  async function loadBuildInfo() {
    try {
      const response = await fetch('/api/build', { cache: 'no-store' });
      if (!response.ok) return;

      const data = (await response.json()) as {
        commitSha?: string;
        branch?: string;
        deploymentId?: string;
      };

      if (data.commitSha && data.commitSha !== 'local') {
        buildLabel = data.commitSha.slice(0, 7);
        buildTitle = `Git ${data.commitSha} · ${data.branch ?? 'unknown'} · deployment ${data.deploymentId ?? 'unknown'}`;
        return;
      }

      buildLabel = 'DEV';
      buildTitle = 'خادم تطوير محلي';
    } catch {
      // Vite development can run without the production server. Keep LOCAL visible.
    }
  }

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
      <span class="build-pill" title={buildTitle}>PRE-ALPHA · {buildLabel}</span>
      <button class="icon-button" on:click={toggleFullscreen} title="ملء الشاشة" aria-label="تبديل ملء الشاشة">⛶</button>
    </div>
  </header>

  <slot />
</main>
