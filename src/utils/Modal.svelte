<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let open = false;
  export let ariaLabelledBy;
  let klass = `max-w-lg rounded-sm pl-4 pt-5 pb-4 pr-8 sm:p-6`;
  export { klass as class };

  const dispatch = createEventDispatcher();

  let panel;
  let itemToFocus = null;

  let browser = false;
  onMount(() => {
    browser = true;
  });

  export function show() {
    if (!browser || open) return;
    const activeElem = document.activeElement;
    if (activeElem instanceof HTMLElement) {
      itemToFocus = activeElem;
    }
    open = true;
    dispatch('show');
  }

  export function hide() {
    if (!open) return;
    if (itemToFocus) {
      itemToFocus.focus();
      itemToFocus = null;
    }
    open = false;
    dispatch('hide');
  }

  $: if (open) {
    show();
  } else if (!open) {
    hide();
  }

  function handleOutsideClick(ev) {
    if (!open || !ev.target) return;
    if (panel.contains(ev.target)) return;
    if (
      ev.target instanceof HTMLElement &&
      ev.target.classList.contains('backdrop')
    ) {
      hide();
      ev.preventDefault();
    }
  }
  function handleKeypress(ev) {
    if (open && ev.key === 'Escape') {
      hide();
      ev.preventDefault;
    }
  }
</script>

<svelte:body on:click={handleOutsideClick} on:keydown={handleKeypress} />

{#if open}
  <div
    transition:fade={{ duration: 150 }}
    role="dialog"
    aria-modal={true}
    aria-labelledby={ariaLabelledBy}
    class="fixed inset-0 z-50 h-full overflow-y-auto"
  >
    <div
      class="backdrop -z-1 fixed inset-0 h-full w-full cursor-pointer bg-gray-500/75"
    />
    <div class="flex h-full w-full overflow-hidden p-2" bind:this={panel}>
      <div
        class="relative mx-auto mt-12 mb-auto flex max-h-[95vh] flex-auto flex-col overflow-y-auto overscroll-y-contain sm:my-auto {klass}"
      >
        <slot />
        <slot name="close">
          <button
            type="button"
            class="fixed right-0 top-0 rounded-full bg-black hover:text-gray-500 focus:outline-none focus:ring-0 focus:ring-gray-300 focus:ring-offset-2"
            on:click={hide}
            aria-label="Close"
            title="Close"
          >
            <svg class="h-6 w-6 text-white" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </slot>
      </div>
    </div>
  </div>
{/if}
