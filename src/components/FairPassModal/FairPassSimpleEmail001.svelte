<script lang="ts" context="module">
  import * as defaults from './defaults';
  export { defaults };
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  import FairPassIcon from '../../utils/FairPassIcon.svelte';
  import { shaWorker } from '../../utils/shaWorker';

  import { fade } from 'svelte/transition';

  export let href = '#';
  export let fpScope = 'global';
  export let step = 'stop';
  export let open = false;

  let email = '';
  let working = false;
  let submissionError;
  let buttonDisabled = false;

  onMount(() => {});

  const handleSignup = async () => {
    if (buttonDisabled) {
      return;
    }
    working = true;

    // check if email looks valid for simple input

    if (!email || (!email.includes('@') && email.length > 4)) {
      submissionError = 'Please enter a valid email address';
      setTimeout(() => {
        submissionError = null;
      }, 6000);
      working = false;
      return;
    }

    const FAIRPASS_ENDPOINT =
      window.location.hostname === 'dev.loremlabs.com'
        ? 'https://dev.loremlabs.com:5173/api/v1'
        : 'https://www.fairpass.co/api/v1';

    const flow = 'simple-email-001';
    const input = {
      email,
      src: window.location.href,
      pow: {},
      flow,
    };

    const qp = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign'];
    utmKeys.forEach((key) => {
      const value = qp.get(key);
      if (value) {
        input[key] = value;
      }
    });

    const worker = shaWorker();
    const nonce = Math.random().toString(36).substr(2, 10);

    worker.postMessage({ type: 'sha256', nonce, scope: fpScope });
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

          buttonDisabled = true;
          setTimeout(() => {
            buttonDisabled = false;
          }, 15000);

          try {
            const result = await fetch(
              `${FAIRPASS_ENDPOINT}/signup/${fpScope}`,
              {
                method: 'POST',
                referrerPolicy: 'origin-when-cross-origin',
                headers: {
                  'content-type': 'application/json',
                  'api-key': defaults.apiKey,
                },
                body: JSON.stringify(input),
                credentials: 'include',
              }
            );
            const data = await result.json();
            if (!result.ok) {
              throw new Error(data?.message || 'An error occurred. Try again.');
            }

            // TODO
            // get actions, see what we need to do
            const actions = data.actions || [];
            console.group('actions');
            console.log(actions);
            console.groupEnd();

            if (actions.includes('current-user')) {
              open = false;
              working = false;
              return;
            }
            if (actions.includes('verify-email-soft')) {
              step = 'verify-email';
            }
            if (actions.includes('verify-email-required')) {
              step = 'verify-email';
            }
            if (actions.includes('new-user')) {
              step = 'new-user';
            }

            // setup long-poll to see if user logs in
            let activeCheck = true;
            let pollAttempts = 0;
            const poll = async () => {
              pollAttempts++;
              if (!data?.linkId || !activeCheck || pollAttempts > 20) {
                return;
              }

              try {
                const checkResult = await fetch(
                  `${FAIRPASS_ENDPOINT}/magic/check`,
                  {
                    method: 'POST',
                    referrerPolicy: 'origin-when-cross-origin',
                    headers: {
                      'content-type': 'application/json',
                      'api-key': defaults.apiKey,
                    },
                    body: JSON.stringify({ linkId: data.linkId }),
                    credentials: 'include',
                  }
                );
                const pollData = await checkResult.json();
                if (!checkResult.ok) {
                  throw new Error(
                    pollData?.error || 'An error occurred. Try again.'
                  );
                }
                if (pollData?.verified) {
                  open = false;
                  working = false;
                  // reload page
                  window.location.reload();
                  return;
                }
              } catch (error) {
                console.error(error);
              }

              setTimeout(() => {
                poll();
              }, 500);
            };
            poll();
          } catch (error) {
            console.error('err', error);

            // set error state
            submissionError = error.message;
            setTimeout(() => {
              submissionError = null;
            }, 5000);
          }

          worker.terminate();
          working = false;
        } else {
          console.error('unknown message type', msg.data.type);
        }
      },
      false
    );
    return false;
  };
</script>

{#if step === 'verify-email'}
  <div class="box-border w-screen max-w-2xl p-4 xl:p-0">
    <div class="h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6" />
    <div
      class="shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none rounded-br-none rounded-bl-none bg-white font-sans text-gray-800"
    >
      <div class="box-border w-full pt-6 sm:pt-6 md:pt-8">
        <div class="px-3 sm:px-5 md:px-10">
          <FairPassIcon
            class="h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white"
            name="fairpass/troll"
          />
          <p
            class="m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500"
          >
            <span class="hidden md:block">Verify Your Email to Continue</span>
            <span class="block md:hidden">Verify Email</span>
          </p>
          <h2
            class="m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none"
            id="modal-headline"
          >
            Check your Email
          </h2>
        </div>
        <div>
          <div class="flex justify-between">
            <p
              class="max-w-prose-78 my-2 ml-2 px-3 py-4 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug"
            >
              You're logging in once for all Fair Pass sites. We sent you an
              email with a link to verify your email address. Click the link to
              continue.
            </p>
            <div
              class="hidden flex-shrink-0 -translate-y-1/2 self-center text-center md:block"
            >
              <a
                href="https://www.fairpass.co/?utm_src=barrier-help"
                class="flex flex-col items-center rounded-l-3xl bg-cyan-800 py-3 px-5 text-white xl:p-6"
              >
                <span class="h-6 text-white">Help</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button
      class="inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3"
      disabled={working || buttonDisabled}
      target="_blank"
      rel="noreferrer"
      on:click={handleSignup}
    >
      <span class="flex items-center justify-center gap-2">
        {#if working}
          <span class="h-6 w-6 animate-spin">
            <svg viewBox="0 0 24 24">
              <circle
                style="opacity: 0.25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                style="opacity: 0.75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
          Processing...
        {:else}
          Resend Email →
        {/if}
      </span></button
    >
  </div>
{:else if step === 'new-user'}
  <div class="box-border w-screen max-w-2xl p-4 xl:p-0">
    <div class="h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6" />
    <div
      class="shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none bg-white font-sans text-gray-800"
    >
      <div class="box-border w-full pt-6 sm:pt-6 md:pt-8">
        <div class="px-3 sm:px-5 md:px-10">
          <FairPassIcon
            class="h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white"
            name="fairpass/troll"
          />
          <p
            class="m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500"
          >
            <span class="hidden md:block">Welcome</span>
            <span class="block md:hidden">Welcome</span>
          </p>
          <h2
            class="m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none"
            id="modal-headline"
          >
            Check your email for a verification link
          </h2>
        </div>
        <div>
          <div class="flex justify-between">
            <p
              class="max-w-prose-78 my-2 ml-2 px-3 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug"
            />
          </div>
          <div class="block px-3 sm:px-5 md:hidden">
            <a
              href="https://www.fairpass.co/?utm_src=barrier-learn-more"
              class="inline-block text-cyan-500 underline"
              >Learn more
            </a>
          </div>
        </div>
      </div>
      <button
        class="inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3"
        disabled={working}
        target="_blank"
        rel="noreferrer"
        on:click={handleSignup}
      >
        <span class="flex items-center justify-center gap-2">
          {#if working}
            <span class="h-6 w-6 animate-spin">
              <svg viewBox="0 0 24 24">
                <circle
                  style="opacity: 0.25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  style="opacity: 0.75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            Processing...
          {:else}
            Resend Email →
          {/if}
        </span></button
      >
    </div>
  </div>
{:else if step === 'stop'}
  <div class="box-border w-screen max-w-2xl p-4 xl:p-0">
    <div class="h-4 w-11/12 rounded-t-3xl bg-cyan-100 md:h-6" />
    <div
      class="shadow-xl-all focus-within:shadow-xl-all-darker w-full rounded-3xl rounded-tl-none bg-white font-sans text-gray-800"
    >
      <div class="box-border w-full pt-6 sm:pt-6 md:pt-8">
        <div class="px-3 sm:px-5 md:px-10">
          <FairPassIcon
            class="h-12 w-12 rounded-full bg-[#88837A] p-1 ring-2 ring-white"
            name="fairpass/troll"
          />
          <p
            class="m-0 mb-1 text-sm font-semibold uppercase tracking-tighter text-cyan-500"
          >
            <span class="hidden md:block"
              >Membership Is Required for this Content</span
            >
            <span class="block md:hidden">Member Required</span>
          </p>
          <h2
            class="m-0 mb-1 text-2xl font-extrabold leading-none text-gray-800 md:my-2 xl:text-3xl xl:leading-none"
            id="modal-headline"
          >
            <span class="hidden md:inline-block">Let's</span>
            Get More from the Web
          </h2>
        </div>
        <div>
          <div class="flex justify-between">
            <p
              class="max-w-prose-78 my-2 ml-2 px-3 text-base leading-tight sm:px-5 md:px-10 lg:text-lg lg:leading-snug"
            >
              It's free to join the <a
                target="_blank"
                rel="noreferrer"
                class="text-gray-500 underline-offset-1"
                href="https://www.fairpass.co/?utm_src=barrier">Fair Pass</a
              > content collective and get access to this content and other member
              sites. Fair Pass helps grow the web by helping to monetize your favorite
              sites. As long as members represent a minimum threshold of traffic,
              a site is free. Your contribution unlocks this site for you and others.
            </p>
            <div
              class="hidden flex-shrink-0 -translate-y-1/2 self-center text-center md:block"
            >
              <a
                href="https://www.fairpass.co/?utm_src=barrier-learn-more"
                class="flex flex-col items-center rounded-l-3xl bg-cyan-800 py-3 px-5 text-white xl:p-6"
              >
                <span class="h-6 text-white">Learn more</span>
              </a>
            </div>
          </div>
          <div class="block px-3 sm:px-5 md:hidden">
            <a
              href="https://www.fairpass.co/?utm_src=barrier-learn-more"
              class="inline-block text-cyan-500 underline"
              >Learn more
            </a>
          </div>
          <div class="px-3 py-3 sm:px-5 md:px-10 md:py-5">
            <label for="email" class="block text-sm font-bold text-gray-700"
              >Your Email</label
            >
            <div class="mt-1 flex">
              <input
                type="email"
                name="email"
                bind:value={email}
                id="fp-email"
                class="w-full rounded border-gray-300 bg-cyan-50 text-black shadow-sm focus:border-gray-300 focus:ring-gray-500 sm:text-sm"
                placeholder="you@example.com"
                on:keydown={(ev) => {
                  if (ev.key === 'Enter') {
                    handleSignup();
                  }
                }}
              />
            </div>
            <p class="text-sm text-gray-500">
              Joining gives you immediate access. We'll also send an email with
              ways you can support good content. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
      <button
        class="inline-block w-full cursor-pointer rounded-3xl rounded-tl-none rounded-tr-none border-none bg-cyan-500 py-2 text-center text-sm leading-tight text-white no-underline hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50 sm:text-base md:py-3"
        disabled={working}
        target="_blank"
        rel="noreferrer"
        on:click={handleSignup}
      >
        <span class="flex items-center justify-center gap-2">
          {#if working}
            <span class="h-6 w-6 animate-spin">
              <svg viewBox="0 0 24 24">
                <circle
                  style="opacity: 0.25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  style="opacity: 0.75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            Processing...
          {:else}
            Join →
          {/if}
        </span></button
      >
    </div>
  </div>
{:else}
  &nbsp;
  <!-- step not found -->
{/if}

{#if submissionError}
  <div class="absolute top-2 z-[100] m-auto w-full" in:fade out:fade>
    <div class="w-full max-w-md rounded-sm bg-yellow-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <!-- Heroicon name: mini/exclamation-triangle -->
          <svg
            class="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <div class="mt-2 text-sm text-yellow-700">
            <p>{submissionError}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
