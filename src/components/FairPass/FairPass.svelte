<script lang="ts" context="module">
  import * as defaults from './defaults';
  export { defaults };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from '../../utils/transfix';
  import FairPassIcon from '../../utils/FairPassIcon.svelte';

  import FairPassModal from '../../components/FairPassModal/FairPassModal.svelte';

  import Indicator from '../../utils/Indicator.svelte';
  import { shaWorker } from '../../utils/shaWorker';
  import { monetization } from '../../lib/capabilities';
  import {
    fairpass,
    freepass,
    webmon,
  } from '../../lib/capabilities/plugins/fairpass';

  export let scope = defaults.scope; // global, or some defined scope
  export let state = defaults.state; // state of scope: "open" | "closed"
  export let scopePercent = defaults.scopePercent; // 0-100, 100% = all traffic supporting the scope
  export let acceptable = defaults.acceptable; // pass/*, webmon/*
  export let pass = defaults.pass;
  export let apiKey = defaults.apiKey;
  export let hurrah = 'true'; // show indicators
  export let threshold = defaults.threshold; // 0-100, 100% = require all traffic supporting the scope, 0 = no threshold for supporting traffic
  export let mode = defaults.mode;
  export let simulate = 'false';
  export let debug = 'false';
  export let slots = {};
  export let disabled = 'false';

  let variant = 'unset';

  let ready = false;
  onMount(async () => {
    if (disabled === 'true') {
      return;
    }
    const FAIRPASS_ENDPOINT =
      window.location.hostname === 'dev.loremlabs.com'
        ? 'https://dev.loremlabs.com:5173/api/v1'
        : 'https://www.fairpass.co/api/v1';

    const passes = [];
    // STEP 1: Get current scope state, percent, if current user or not
    try {
      const scopeState = await fetch(
        `${FAIRPASS_ENDPOINT}/scope/${scope}?threshold=${encodeURIComponent(
          threshold
        )}&simulate=${encodeURIComponent(simulate)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      const data = await scopeState.json();
      if (!scopeState.ok) {
        console.group('fairpass-state');
        console.error({ data, scopeState });
        console.groupEnd();
      }
      //   console.log(JSON.stringify({ data }, null, 2));
      if (simulate !== 'true') {
        state = data.state || 'open'; // fail open
      }
      scopePercent = data.scopePercent || 100;
      if (data.passes && data.passes.length && simulate !== 'true') {
        // pass = data.passes[0];
        // push the array onto passes
        for (const p of data.passes) {
          passes.push(p);
        }
      }
    } catch (err) {
      console.error(err);
    }

    setTimeout(async () => {
      // STEP 2: Determine viable options
      //  TODO: this can be simplified but remain "open" the capabilities needs a refactor
      const capabilities = monetization.capabilities.acquire();
      capabilities.unlock(); // allow others to use the capabilities
      if (acceptable.includes('pass/fairpass')) {
        capabilities.use(fairpass({ state, pass, passes }));
      }
      if (acceptable.includes('webmon/*')) {
        capabilities.use(webmon({ timeout: 1500 }));
      }
      if (acceptable.includes('free/fairpass')) {
        capabilities.use(freepass({ state, pass, passes }));
      }
      // TODO: it would be nice to have "acceptable" = "pass/*, webmon/*" and easily translate that into site capabilites

      const matches = await monetization.match();
      // if we have queryparam = fp.debug, then we should show the matches
      const qp = new URLSearchParams(window.location.search);
      if (qp.get('fp.debug') === 'true') {
        console.group('monet.match()');
        console.table(matches);
        console.groupEnd();

        console.group('monet.capabilities.list()');
        console.log(monetization.capabilities.list());
        console.groupEnd();

        console.group('monet.userPreferences.get()');
        console.dir(window.monet.userPreferences.get());
        console.groupEnd();
      }
      if (matches.length > 0) {
        if (simulate !== 'true') {
          // this is the "chosen" pass, whereas "passes" are all the passes that are available for the user
          pass = matches[0].capability; // the "chosen" capability
        }
      }
      // monetization.match().then((matches) => {
      //   console.group('monet.match()');
      //   console.table(matches);
      //   console.groupEnd();

      //   console.group('monet.capabilities.list()');
      //   console.log(monetization.capabilities.list());
      //   console.groupEnd();

      //   console.group('monet.userPreferences.get()');
      //   console.dir(window.monet.userPreferences.get());
      //   console.groupEnd();
      // });

      const worker = shaWorker();
      const nonce = Math.random().toString(36).substr(2, 10);

      const input = {
        scope,
        pow: {},
        pass,
      };

      worker.postMessage({ type: 'sha256', nonce, scope });
      worker.addEventListener(
        'message',
        async (msg) => {
          if (msg.data?.type === 'sha256') {
            input.pow = msg.data;
            delete input.pow.scope;
            delete input.pow.type;
            delete input.pow.hash;
            input.pow.t = parseInt(input.pow.duration, 10);
            delete input.pow.duration;

            try {
              const result = await fetch(
                `${FAIRPASS_ENDPOINT}/scope/${scope}`,
                {
                  method: 'POST',
                  referrerPolicy: 'origin-when-cross-origin',
                  headers: {
                    'content-type': 'application/json',
                    'api-key': apiKey,
                  },
                  body: JSON.stringify(input),
                }
              );
              const data = await result.json();
              if (result.status !== 200) {
                console.group('fairpass-blip-error');
                console.error({
                  status: result.status,
                  statusText: result.statusText,
                  data,
                });
                console.groupEnd();
              }
              // console.log(JSON.stringify({ data, input }, null, 2));
            } catch (error) {
              console.error(error);
            }

            worker.terminate();
            ready = true;
          } else {
            console.error('unknown message type', msg.data.type);
          }
        },
        false
      );
    }, 100);
  });

  // set variant to "open-pass", "open-free", "closed-pass", "closed-nopass-lax", "closed-nopass-strict"
  // TODO: refactor below to use variant more
  $: {
    const isFree = pass === '' || pass.startsWith('free/');
    const current = variant;
    if (ready) {
      if (state === 'open') {
        if (!isFree) {
          variant = 'open-pass';
        } else {
          variant = 'open-free';
        }
      } else if (state === 'closed') {
        if (!isFree) {
          variant = 'closed-pass';
        } else if (mode === 'lax') {
          variant = 'closed-nopass-lax';
        } else {
          variant = 'closed-nopass-strict';
        }
      }
      if (current !== variant) {
        // notify calling page of change
        this.dispatchEvent(
          new CustomEvent('fairpass:change', {
            composed: true,
            detail: { scope, pass, state, scopePercent, mode, variant, isFree },
          })
        );
      }
    }
  }
</script>

{#if ready}
  {#if debug === 'true'}
    <div class="absolute bottom-0 z-50 w-full bg-cyan-100 p-2 text-xs" in:fade>
      scope: {scope}
      scopePercent: {scopePercent}
      state: {state}
      acceptable: {acceptable}
      pass: {pass}
      ready: {ready}
    </div>
  {/if}
  {pass} : {state}

  {pass} | {state} | {scopePercent} | {scope}

  {#if state === 'open'}
    {#if $$slots['open-head']?.length > 0}
      <slot name="open-head" />
    {:else}
      <!-- default open-head -->
    {/if}
    {#if !pass.startsWith('free/') && pass !== ''}
      {#if $$slots['open-pass']?.length > 0}
        <slot name="open-pass" />
        <Indicator show={hurrah} type="open-pass" />
      {:else}
        <!-- default open-pass -->
        <Indicator show={hurrah} type="open-pass" />
      {/if}
    {:else if $$slots['open-free']?.length > 0}
      <slot name="open-free" />
      <Indicator show={hurrah} type="open-free" />
    {:else}
      <!-- default open-free -->
      <Indicator show={hurrah} type="open-free" />
    {/if}
    {#if $$slots['open-foot']?.length > 0}
      <slot name="open-foot" />
    {:else}
      <!-- default open-foot -->
    {/if}
  {:else if state === 'closed'}
    {#if $$slots['closed-head']?.length > 0}
      <slot name="closed-head" />
    {:else}
      <!-- default closed-head -->
    {/if}
    {#if pass !== '' && !pass.startsWith('free/')}
      {#if $$slots['closed-pass']?.length > 0}
        <slot name="closed-pass" />
        <Indicator show={hurrah} type="closed-pass" />
      {:else}
        <!-- default closed-pass -->
        <Indicator show={hurrah} type="closed-pass" />
      {/if}
    {:else if mode === 'lax'}
      {#if $$slots['closed-nopass-lax']?.length > 0}
        <slot name="closed-nopass-lax" />
        <Indicator show={hurrah} type="closed-nopass" />
      {:else}
        <!-- default closed-nopass-lax -->
        <FairPassModal closeable="true" />

        <Indicator show={hurrah} type="closed-nopass" />
      {/if}
    {:else}
      <!-- strict mode -->
      {#if $$slots['closed-nopass-strict']?.length > 0}
        <slot name="closed-nopass-strict" />
        <Indicator show={hurrah} type="closed-nopass" />
      {:else}
        <!-- default closed-nopass-strict -->
        <Indicator show={hurrah} type="closed-nopass" />
        <FairPassModal closeable="false" />
      {/if}
    {/if}
    {#if $$slots['closed-foot']?.length > 0?.length > 0}
      <slot name="closed-foot" />
    {:else}
      <!-- default closed-foot -->
    {/if}
  {/if}
{/if}
