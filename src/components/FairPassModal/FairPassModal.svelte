<script lang="ts" context="module">
  import * as defaults from './defaults';
  export { defaults };
</script>

<script lang="ts">
  import FairPassSimpleEmail001 from './FairPassSimpleEmail001.svelte';
  import '../../assets/global.css';

  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let closeable = 'true'; // string
  export let open = true;

  const dispatch = createEventDispatcher();

  export function hide() {
    if (!open) return;
    if (closeable === 'true') {
      open = false;
      dispatch('hide');
    }
  }

  export let handleCancel = () => {
    hide();
    this.dispatchEvent(
      new CustomEvent('fairpass:modal:close', {
        composed: true,
        detail: { type: 'cancel' },
      })
    );
  };

  let loaded = false;
  onMount(() => {
    loaded = true;
  });

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      hide();
    }
  }

  $: {
    if (loaded && open) {
      // add overflow:hidden to body
      this.document.body.style.overflow = 'hidden';
    } else {
      // remove overflow:hidden from body
      this.document.body.style.overflow = 'auto';
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if loaded && open}
  <div
    class="fixed inset-0 z-10 overflow-y-auto"
    in:fade
    out:fade
    role="dialog"
    aria-modal={true}
    aria-labelledby="modal-headline"
  >
    <div class="flex min-h-screen cursor-pointer items-center justify-center">
      <div
        role="button"
        aria-hidden
        class="backdrop fixed inset-0 z-30 cursor-pointer bg-gray-500/75 outline-none"
        on:click={() => {
          handleCancel();
        }}
      />
      <span
        class="hidden sm:inline-block sm:h-screen sm:align-middle"
        aria-hidden="true">&#8203;</span
      >

      {#if closeable === 'true'}
        <div class="absolute right-4 top-4 z-50 bg-transparent">
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent outline-none"
            on:click={() => {
              handleCancel();
            }}
            aria-label="Close"
            title="Close"
          >
            <svg
              class="z-60 h-8 w-8 rounded-full bg-gray-800 text-white hover:text-gray-500"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}
      <div class="z-50 cursor-default">
        <FairPassSimpleEmail001 bind:open />
      </div>
    </div>
  </div>
{/if}
