<script>
  export let heading1 = 'Heading line 1';
  export let heading2 = 'Heading line 2';

  export let color1 = '';
  export let color2 = '';
</script>

<h2
  class="m-0 mb-1 text-xl font-extrabold tracking-tight md:text-2xl xl:text-3xl"
>
  <span class="mb-0.5 block leading-tight {color1}">{heading1}</span>
  <span class="block leading-tight {color2}">{heading2}</span>
</h2>
