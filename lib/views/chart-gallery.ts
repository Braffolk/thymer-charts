import { EchartsChart } from "../elements/echarts-chart";

type Fun = (viewContext: PluginViewContext) => {
    onLoad: () => void;
    onRefresh: ({ records, invalidatedGuids }: {
        records: PluginRecord[];
        invalidatedGuids: Set<string> | null;
    }) => void | Promise<void>;
    onPanelResize: () => void;
    onDestroy: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onKeyboardNavigation: ({ e }: {
        e: KeyboardEvent;
    }) => void;
};

export const chartGalleryViewHooks: Fun = (vc: PluginViewContext) => {
    return {
        onLoad: () => {

        },
        onRefresh: ({ records, invalidatedGuids}) => {
            const root = vc.getElement();

            root.style.display = "flex";
            root.style.flexDirection = "row";
            root.style.flexWrap = "wrap";
            root.style.gap = "8px";
            
            vc.makeWideLayout();
            
            const parser = new DOMParser();

            const items = [];
            records.forEach((record) => {

                let options = record.prop('options').text();

                const template = document.createElement("template");
                template.innerHTML = `
                    <span class="lineitem-ref clickable noembed" data-guid="${record.guid}">
                        <span class="lineitem-ref-title clickable noembed" data-guid="${record.guid}">
                            ${record.prop('title').text()}
                        </span>
                    </span>
                `;
                const elHeader = template.content.firstElementChild;
                

                let wrapper = document.createElement("div");
                wrapper.addEventListener("click", () => {
                    vc.openRecordInThisPanel(record.guid);
                })


                let el = document.createElement("echarts-chart") as EchartsChart;
                el.options = options;
                el.style.flex = "1";
                el.style.width = "100%";

                wrapper.replaceChildren(elHeader, el);

                items.push(wrapper);
            })
            root.replaceChildren(...items);
        },
        onPanelResize: () => {

        },
        onDestroy: () => {
            
        },
        onFocus: () => {

        },
        onKeyboardNavigation: ({ e }) => {

        },
        onBlur: () => {
            
        }
    }
}