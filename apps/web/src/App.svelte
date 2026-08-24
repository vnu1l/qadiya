<script lang="ts">
  import GameShell from './components/GameShell.svelte';
  import CourtScene from './scenes/CourtScene.svelte';
  import LobbyScene from './scenes/LobbyScene.svelte';
  import MenuScene from './scenes/MenuScene.svelte';
  import type { GameSceneId } from './lib/game/types';

  let scene: GameSceneId = 'menu';

  function navigate(nextScene: GameSceneId) {
    scene = nextScene;
  }
</script>

<svelte:head>
  <title>QADIYA — قضية</title>
  <meta name="description" content="QADIYA — لعبة محكمة عربية جماعية على الويب" />
</svelte:head>

<GameShell {scene} onHome={() => navigate('menu')}>
  {#if scene === 'menu'}
    <MenuScene onStart={() => navigate('lobby')} onPreviewCourt={() => navigate('court')} />
  {:else if scene === 'lobby'}
    <LobbyScene onPreviewCourt={() => navigate('court')} />
  {:else if scene === 'court'}
    <CourtScene />
  {:else}
    <section class="menu scene-enter">
      <div class="menu-copy">
        <div class="eyebrow">قيد البناء</div>
        <h1>هذا المشهد<br /><em>له عقد واضح.</em></h1>
        <p>تم حجز حالة المشهد في Game Shell، وسيتم تنفيذها في مرحلتها بدل ترقيعها داخل الشاشة الحالية.</p>
        <button class="secondary" on:click={() => navigate('menu')}>العودة</button>
      </div>
    </section>
  {/if}
</GameShell>
