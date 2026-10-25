/**
 * Runs from the server layout before paint. It must stay a plain script in
 * that layout: Next.js does not execute a script rendered by a client component,
 * and reports that as a console error. `next-themes` still owns updates after
 * hydration; its own script is marked `text/plain` so it is not a second copy.
 */
export const themeInitScript = `(function(){try{var theme=localStorage.getItem('theme')||'system';var resolved=theme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;if(resolved!=='light'&&resolved!=='dark')resolved='light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`
