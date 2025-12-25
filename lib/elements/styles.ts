import { css } from "lit";

export const buttonStyles = css`
button {
    background: var(--button-minimal-bg-color);
    color: var(--button-minimal-fg-color);
    border: 1px solid var(--button-minimal-border-color);
    transition: background-color .3s ease, border-color .3s ease, width .3s ease;
    font-weight: var(--font-weight-normal);
    cursor: pointer;
    border-radius: var(--button-radius);
    padding: 5px 10px;
    line-height: 1;
    font-size: var(--text-size-normal);
    display: inline-flex;
    justify-content: center;
    align-items: center;
}
button:hover {
    border-radius: var(--button-radius);
    background: var(--button-minimal-bg-active-color);
    color: var(--button-minimal-fg-color);
    border-color: var(--button-minimal-hover-color);
}

.ti {
    font-family: tabler-icons !important;
    font-style: normal;
    font-weight: 400 !important;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    speak: none;
}

.ti-pencil:before {
    content: "\\f167";
}
`