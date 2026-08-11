# FindAnyHelper — coming soon

The single-page holding site served at findanyhelper.com.

`index.html` is self-contained: the octopus and the wordmark are inlined as
data URIs, so there is nothing else to serve.

## Colour

The palette lives in `:root` as custom properties. Nothing outside that list
may appear in the stylesheet — no ad-hoc tints, no opacity tricks to fake a
lighter shade, no `color-mix`. A tone that isn't there is a brand decision,
not a CSS one.

## The build check

`check-contrast.mjs` runs on every deploy and fails the build if:

- any colour in the stylesheet is not one of the tokens, or
- any text/background pair drops below WCAG AA (4.5:1 normal, 3:1 large).

An audit on 11 August 2026 found four off-palette colours and footer text at
2.66:1 that nobody had spotted by eye. This is what stops the next four.

The wordmark asset is deliberately exempt: recolouring a logo is a brand
decision, and its contrast is being handled separately.

## Signups

The form posts to the app's `/api/waitlist`. That endpoint accepts requests
from findanyhelper.com only. When the app moves onto the main domain at
launch, the URL in `index.html` needs updating.
