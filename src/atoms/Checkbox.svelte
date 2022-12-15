<script lang="ts">
  import '../assets/global.css';
  export let checked: boolean = false;
  export let label: string;
  export let id: string;
  export let description: string | undefined;
</script>

<div class="relative flex cursor-pointer items-center gap-1 {$$props.class}">
  <input
    type="checkbox"
    bind:checked
    on:change
    {id}
    name={id}
    class="h-4 w-4 rounded border border-solid border-gray-300 text-gray-600 focus:ring-transparent"
  />
  <div class="font-sans text-base font-medium leading-tight text-gray-700">
    <label for={id} class="after:absolute after:inset-0">{label}</label>
    {#if description}
      <p class="m-0 text-sm font-normal text-gray-500">{description}</p>
    {/if}
  </div>
</div>
