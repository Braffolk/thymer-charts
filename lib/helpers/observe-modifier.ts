import { patchedIdleCallback } from "./patched-idlecallback";

export type ObserverModifier = (plugin: CollectionPlugin) => (() => void);

const modifiedClass = "charts-observer-modified";

export class ObserveAgainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ObserveAgainError";
        Object.setPrototypeOf(this, ObserveAgainError.prototype);
    }
}


export function withObserverModifier({targetClass, callback, ...rest}: {
    targetClass: string,
    callback: (plugin: CollectionPlugin, el: HTMLElement) => void,
    onLoad?: (plugin: CollectionPlugin) => void,
    onRowChange?: (plugin: CollectionPlugin, el: HTMLElement, id: string) => void
}): ObserverModifier {
    const observeAndModify: ObserverModifier = (plugin) => {
        const attach = (el: HTMLElement) => {
            if (el.classList.contains(modifiedClass)) {
                return;
            }
            
            try {
                callback(plugin, el);
                el.classList.add(modifiedClass);
            } catch (e) {
                if (e instanceof ObserveAgainError) {
                    // pass. Error can mean we need to call callback again.
                } else {
                    console.error(e);
                    el.classList.add(modifiedClass);
                }
                
            }
        };


        const rowSelector = ".page-props-row[data-field-id]";

        // coalesce bursts (Thymer edits cause many mutations)
        const pendingRowIds = new Map<HTMLElement, Set<string>>();
        let rowFlushScheduled = false;

        const queueRowChange = (node: Node) => {
            if (!rest?.onRowChange) return;

            const baseEl =
                node.nodeType === 1 ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
            if (!baseEl) return;

            // only care if the mutation is inside a target root we've attached to
            const root = baseEl.closest(targetClass) as HTMLElement | null;
            if (!root || !root.classList.contains(modifiedClass)) return;

            const row = baseEl.closest(rowSelector) as HTMLElement | null;
            const id = row?.dataset.fieldId;
            if (!id) return;

            let set = pendingRowIds.get(root);
            if (!set) {
                set = new Set<string>();
                pendingRowIds.set(root, set);
            }
            set.add(id);

            if (!rowFlushScheduled) {
                rowFlushScheduled = true;
                queueMicrotask(() => {
                    rowFlushScheduled = false;

                    pendingRowIds.forEach((ids, rootEl) => {
                        ids.forEach((rowId) => {
                            patchedIdleCallback(() => {
                                rest.onRowChange!(plugin, rootEl, rowId);
                            })
                        })
                    })

                    pendingRowIds.clear();
                });
            }
        };

        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                queueRowChange(mutation.target);

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

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: !!rest.onRowChange,
        });

        let longTimeout = setTimeout(() => {
            document.querySelectorAll(targetClass).forEach((el) => attach(el as HTMLElement));
        }, 6000);

        const onLoadListener = () => {
            longTimeout.close();
            setTimeout(() => {
                document.querySelectorAll(targetClass).forEach((el) => attach(el as HTMLElement));
            }, 1000);
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