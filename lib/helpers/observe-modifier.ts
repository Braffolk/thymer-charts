import { patchedIdleCallback } from "./patched-idlecallback";

export type ObserverModifier = (plugin: CollectionPlugin) => (() => void);

const modifiedClass = "charts-observer-modified";

export function withObserverModifier({targetClass, callback, ...rest}: {
    targetClass: string,
    callback: (plugin: CollectionPlugin, el: HTMLElement) => void,
    onLoad?: (plugin: CollectionPlugin) => void
}): ObserverModifier {
    const observeAndModify: ObserverModifier = (plugin) => {
        const attach = (el: HTMLElement) => {
            if (el.classList.contains(modifiedClass)) {
                return;
            }
            el.classList.add(modifiedClass);
            // we use requestIdleCallback (or a fallback) to make sure we dont do patches
            // before the thymer modifications are done. otherwise this starts
            // running in the middle of updates sometimes
            patchedIdleCallback(() => {
                callback(plugin, el);
            })
        };

        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        let el = node as HTMLElement;
                        if (el.matches(targetClass)) {
                            attach(el);
                        }
                        else if (el.querySelectorAll) {
                            el.querySelectorAll(targetClass).forEach((el) => attach(el as HTMLElement));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const onLoadListener = () => {
            document.querySelectorAll(targetClass).forEach((el) => attach(el as HTMLElement));
        };
        window.addEventListener('load', onLoadListener);

        console.log(`loaded observer modifier for ${targetClass}`);

        if (rest?.onLoad) {
            rest?.onLoad(plugin);
        }

        return () => {
            observer.disconnect();
            window.removeEventListener('load', onLoadListener);
        };
    }
    return observeAndModify;
}