# Fair Pass Component

This package implements the Fair Pass web component to create an ecosystem of compensated content.

You can add it to your site either by adding the script tag directly:

```html
<!-- in head -->
<script src="https://www.fairpass.co/dist/fair-pass.js" defer></script>

<!-- then somewhere in body -->
<fair-pass></fair-pass>
```

or via your favorite package manager:

```
% npm install @loremlabs/fairpass-component
```

This will make the web component available to your web application. It can be added to the layout component or any part of the body of your page:

```html
<fair-pass></fair-pass>
```

## Customization

The `<fair-pass>` web component can be customized, although the default component is likely good for most use cases.

```
<fair-pass 
 id="fairpass" 
 scope="global" 
 state="closed" 
 pass=""
 acceptable="pass/fairpass, webmon/*, free/fairpass" 
 threshold="0.1" 
 mode="lax"
 simulate="false" 
 disabled="false" 
 hurrah="true" // "true" "false" "watermark" "splash" 
 />
```

## Advanced Customization Events

Various events are available to further customize the page based on the user's state:

```html
<script>
  // advanced usage, optional
  window.addEventListener("fairpass:change", function (e) {
    // variant could be:
    // - closed-pass
    // - closed-nopass-lax
    // - closed-nopass-strict
    // - open-pass
    // - open-free
    const { state, isFree, mode, variant } = e.detail;
    console.group("fairpass:change");
    console.log({ state, isFree, mode, variant });
    console.groupEnd();

    if (variant.startsWith("closed-nopass")) {
      // do something because the page is closed
      // const paywalls = document.querySelectorAll('.paywall');
      // paywalls.forEach((el) => {
      //   el.style.display = 'none';
      //   console.log('hiding', el);
      // });
    }
  });
  window.addEventListener("fairpass:modal:close", function (e) {
    // do something when the modal is closed
    console.group("fairpass:modal:close");
    if (e.detail.type === "cancel") {
      console.log("---modal cancelled---", e.detail);
    } else {
      console.log("---modal closed---", e.detail);
    }
    console.groupEnd();
  });
</script>
```
