<script>
  import { onMount } from 'svelte';

  import FairPassIcon from './FairPassIcon.svelte';

  export let type = 'open-pass';
  export let show = 'true'; // true false watermark splash
  export let msg = '';

  let ready = false;
  onMount(() => {
    ready = true;
  });

  // primary: '#67B781',
  //         secondary: '#AFD290',
  //         tertiary: '#4B712B',
  //         neutral: '#88837A',
  //         dark: '#68615E',
  //         darker: '#6F482E',
  //         light: '#FCECAD',
  //         bright: '#F7CF66',
</script>

{#if ready && (show === 'watermark' || show === 'true')}
  <div class="pointer-events-none fixed bottom-20 right-20 z-50 flex h-24 w-24">
    <div class="m-auto ">
      {#if type === 'open-pass'}
        <FairPassIcon
          class="animate-watermark block h-24 w-24 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
          x="0"
          y="0"
          width="100%"
        />
        <h1
          class="animate-watermark bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Fair Pass 😀'}
        </h1>
      {:else if type === 'open-free'}
        <FairPassIcon
          class="animate-watermark h-24 w-24 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
        />
        <h1
          class="animate-watermark bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Community Pass'}
        </h1>
      {:else if type === 'closed-pass'}
        <FairPassIcon
          class="animate-watermark h-24 w-24 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
        />
        <h1
          class="animate-watermark bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Fair Pass'}
        </h1>
      {:else if type === 'closed-nopass'}
        <FairPassIcon
          class="animate-watermark h-24 w-24 rounded-full bg-[#88837A] p-2 ring-4 ring-white"
          name="fairpass/troll"
        />
        <h1
          class="animate-watermark bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Membership Required'}
        </h1>
      {/if}
    </div>
  </div>
{/if}

{#if ready && show === 'splash'}
  <div class="pointer-events-none fixed top-0 z-50 flex h-screen w-full">
    <div class="m-auto ">
      {#if type === 'open-pass'}
        <FairPassIcon
          class="animate-openpass block h-36 w-36 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
          x="0"
          y="0"
          width="100%"
        />
        <h1
          class="animate-openpass bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Fair Pass 😀'}
        </h1>
      {:else if type === 'open-free'}
        <FairPassIcon
          class="animate-openfree h-36 w-36 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
        />
        <h1
          class="animate-openfree bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Community Pass'}
        </h1>
      {:else if type === 'closed-pass'}
        <FairPassIcon
          class="animate-closedpass h-36 w-36 rounded-full bg-[#AFD290] p-2 ring-4 ring-white"
          name="fairpass/unicorn"
        />
        <h1
          class="animate-closedpass bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Fair Pass'}
        </h1>
      {:else if type === 'closed-nopass'}
        <FairPassIcon
          class="animate-closednopass h-36 w-36 rounded-full bg-[#88837A] p-2 ring-4 ring-white"
          name="fairpass/troll"
        />
        <h1
          class="animate-closednopass bg-cyan-900 px-2 text-center text-sm font-semibold text-cyan-400"
          style="-webkit-text-stroke: .5px rgb(6, 182, 212)"
        >
          {msg || 'Membership Required'}
        </h1>
      {/if}
    </div>
  </div>
{/if}
