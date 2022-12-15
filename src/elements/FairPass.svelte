<script lang="ts">
  import FairPass from '../components/FairPass/FairPass.svelte';
</script>

<FairPass {...$$props}>
  <div slot="open-head">
    {@html $$props.slots['open-head']?.innerHTML || ''}
  </div>
  <div slot="open-pass">
    {@html $$props.slots['open-pass']?.innerHTML || ''}
  </div>
  <div slot="open-foot">
    {@html $$props.slots['open-foot']?.innerHTML || ''}
  </div>
  <div slot="closed-head">
    {@html $$props.slots['closed-head']?.innerHTML || ''}
  </div>
  <div slot="closed-pass">
    {@html $$props.slots['closed-pass']?.innerHTML || ''}
  </div>
  <div slot="closed-nopass-lax">
    {@html $$props.slots['closed-nopass-lax']?.innerHTML || ''}
  </div>
  <div slot="closed-nopass-strict">
    {@html $$props.slots['closed-nopass-strict']?.innerHTML || ''}
  </div>
  <div slot="closed-foot">
    {@html $$props.slots['closed-foot']?.innerHTML || ''}
  </div>
</FairPass>
