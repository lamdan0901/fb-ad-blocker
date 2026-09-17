const POST_SELECTOR = "div[aria-posinset]";
const HIDDEN_CLASS = "fb-ad-blocker-hidden";
const SPONSORED_MENU_SELECTOR = '[aria-label$=" sponsored content"]';
const observedLabels = new WeakSet();

function hideFeedPosts(root, pathname = location.pathname) {
  const posts = new Set(root.querySelectorAll(POST_SELECTOR));

  if (root instanceof Element) {
    const containingPost = root.closest(POST_SELECTOR);
    if (containingPost) posts.add(containingPost);
  }

  for (const post of posts) {
    if (post.classList.contains(HIDDEN_CLASS)) continue;

    const isSponsored = [...post.querySelectorAll('a[role="link"][target="_blank"] [aria-labelledby] > span')].some(
      (host) => {
        if (host.closest("[data-ad-rendering-role]")) return false;
        // Closed ad labels are readable through Chrome's extension-only DOM API.
        const shadow = globalThis.chrome?.dom?.openOrClosedShadowRoot(host);
        if (!shadow) return false;
        if (!observedLabels.has(shadow)) {
          new MutationObserver(() => hideFeedPosts(host)).observe(shadow, {
            childList: true, characterData: true, subtree: true,
          });
          observedLabels.add(shadow);
        }
        return ["Ad", "Sponsored"].includes(shadow.textContent.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim());
      },
    );
    const isSuggested = [...post.querySelectorAll("span")].some(
      (span) =>
        span.textContent.trim() === "Suggested for you" &&
        !span.closest("[data-ad-rendering-role]"),
    );
    const isFromUnfollowedSource =
      pathname === "/" &&
      [...post.querySelectorAll('h4 [role="button"]')].some((button) =>
        ["Join", "Follow"].includes(button.textContent.trim()),
      );

    if (isSponsored || isSuggested || isFromUnfollowedSource) post.classList.add(HIDDEN_CLASS);
  }
}

function hideSponsoredRail(root) {
  const menus = new Set(root.querySelectorAll(SPONSORED_MENU_SELECTOR));

  if (root instanceof Element) {
    const containingMenu = root.closest(SPONSORED_MENU_SELECTOR);
    if (containingMenu) menus.add(containingMenu);
  }

  for (const menu of menus) {
    let section = menu.parentElement;

    while (section) {
      const hasSponsoredHeading = [...section.querySelectorAll("h3")].some(
        (heading) => heading.textContent.replace(/\u200B/g, "").trim() === "Sponsored",
      );

      if (hasSponsoredHeading) {
        section.classList.add(HIDDEN_CLASS);
        break;
      }

      section = section.parentElement;
    }
  }
}

hideFeedPosts(document);
hideSponsoredRail(document);

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const root =
      mutation.type === "characterData" ? mutation.target.parentElement : mutation.target;

    if (!root) continue;
    hideFeedPosts(root);
    hideSponsoredRail(root);
  }
}).observe(document, { childList: true, characterData: true, subtree: true });
