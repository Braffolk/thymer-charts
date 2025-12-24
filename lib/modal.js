/**
 * Opens a modal form based on a simple schema and returns a Promise with the results.
 * 
 * @param {Record<string, any>} schema - Key-value pairs where key is the field name and value is the type (e.g., "text", "textarea", "number", "json")
 * @param {string} [title="Configuration"] - The title of the modal
 * @param {Record<string, any>} [initialValues={}] - Optional initial values for the fields
 * @returns {Promise<Record<string, any>|null>} Resolves with the form data object, or null if cancelled.
 */
export function openFormModal(schema, title = "Configuration", initialValues = {}) {
    return new Promise((resolve) => {
        // 1. Create the Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-background';
        // Add a slight delay to allow CSS transitions if needed, though 'animate-open' handles the dialog
        
        // 2. Create the Dialog Container
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog modal-size-medium modal-dialog-has-border animate-open';
        
        // 3. Construct the Inner HTML Structure
        // We use the grid layout defined in 'modal-main' (header/body/footer structure)
        const main = document.createElement('div');
        main.className = 'modal-main';
        
        // --- Sidebar (Empty/Hidden) ---
        // We include it to maintain grid structure, but it will be 0px wide unless 'modal-main-with-sidebar' is used
        const sidebar = document.createElement('div');
        sidebar.className = 'modal-sidebar';
        
        // --- Body ---
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        const contentPadding = document.createElement('div');
        contentPadding.className = 'modal-p';
        
        // Title
        const header = document.createElement('h1');
        header.className = 'modal-h1';
        header.innerText = title;
        header.style.marginBottom = "20px";
        contentPadding.appendChild(header);

        // Form Inputs storage
        const inputRefs = {};

        // Generate Fields based on Schema
        Object.entries(schema).forEach(([key, type]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-field';

            // Label: Prettify camelCase to Title Case
            const labelText = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
            const label = document.createElement('label');
            label.innerText = labelText;
            wrapper.appendChild(label);

            let input;
            const value = initialValues[key] || "";

            if (type === 'textarea' || type === 'json') {
                input = document.createElement('textarea');
                input.className = 'form-input w-full';
                if(type === 'json') input.classList.add('code');
                input.style.minHeight = "200px";
                input.style.resize = "vertical";
                input.value = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
            } else if (type === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'form-input w-full';
                input.value = value;
            } else {
                // Default text
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-input w-full';
                input.value = value;
            }

            inputRefs[key] = input;
            wrapper.appendChild(input);
            contentPadding.appendChild(wrapper);
        });

        body.appendChild(contentPadding);

        // --- Bottom Bar ---
        const bottomBar = document.createElement('div');
        bottomBar.className = 'modal-bottom-bar';
        
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.gap = '10px';

        // Cancel Button
        const btnCancel = document.createElement('button');
        btnCancel.className = 'button';
        btnCancel.innerText = 'Cancel';
        
        // Save Button
        const btnSave = document.createElement('button');
        btnSave.className = 'button-primary';
        btnSave.innerHTML = `<span class="ti ti-check" style="margin-right: 5px; font-weight: bold;"></span> Save`;

        btnContainer.appendChild(btnCancel);
        btnContainer.appendChild(btnSave);
        bottomBar.appendChild(btnContainer);

        // --- Close Icon (Top Right) ---
        const closeIconDiv = document.createElement('div');
        closeIconDiv.style.position = 'absolute';
        closeIconDiv.style.top = '15px';
        closeIconDiv.style.right = '15px';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'button-minimal button-small';
        closeBtn.innerHTML = '<span class="ti ti-x"></span>';
        closeIconDiv.appendChild(closeBtn);

        // Assemble DOM
        main.appendChild(sidebar);
        main.appendChild(body);
        main.appendChild(bottomBar);
        dialog.appendChild(main);
        dialog.appendChild(closeIconDiv);
        overlay.appendChild(dialog);

        // --- Logic ---

        const close = (data) => {
            // Animation out could go here if supported, for now we remove
            dialog.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                resolve(data);
            }, 150); // Match CSS transition time
        };

        const handleSave = () => {
            const result = {};
            let hasError = false;

            Object.entries(schema).forEach(([key, type]) => {
                const input = inputRefs[key];
                let val = input.value;

                if (type === 'number') {
                    val = parseFloat(val);
                } else if (type === 'json') {
                    try {
                        val = JSON.parse(val);
                        input.style.borderColor = "";
                    } catch (e) {
                        input.style.borderColor = "red";
                        hasError = true;
                    }
                }
                result[key] = val;
            });

            if (!hasError) {
                close(result);
            }
        };

        // Event Listeners
        btnCancel.onclick = () => close(null);
        closeBtn.onclick = () => close(null);
        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };
        btnSave.onclick = handleSave;

        // Keydown (Escape to close, Enter to save if not textarea)
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close(null);
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
        });

        // Inject and Animate
        document.body.appendChild(overlay);
        
        // Force reflow to trigger transition
        requestAnimationFrame(() => {
            dialog.classList.add('active');
            // Focus first input
            const firstInput = Object.values(inputRefs)[0];
            if (firstInput) firstInput.focus();
        });
    });
}