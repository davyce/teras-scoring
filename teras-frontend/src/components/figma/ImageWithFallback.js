import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export function ImageWithFallback(props) {
    const [errored, setErrored] = useState(false);
    const { alt, ...rest } = props;
    return errored ? (_jsx("div", { "aria-label": alt, className: "w-full aspect-[16/9] grid place-items-center text-sm", style: { background: '#0F172A', border: '1px solid #1B2740', color: '#9CB5DD' }, children: "Image indisponible" })) : (_jsx("img", { ...rest, alt: alt, onError: () => setErrored(true), loading: "lazy" }));
}
export default ImageWithFallback;
