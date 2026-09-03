import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
//src/components/FileDropzone.tsx
import { useCallback } from "react";
import { Upload } from "lucide-react";
export default function FileDropzone({ onFiles, accept, multiple }) {
    const onChange = useCallback((e) => {
        if (e.target.files)
            onFiles(Array.from(e.target.files));
    }, [onFiles]);
    const onDrop = useCallback((e) => {
        e.preventDefault();
        onFiles(Array.from(e.dataTransfer.files));
    }, [onFiles]);
    return (_jsxs("label", { onDragOver: (e) => e.preventDefault(), onDrop: onDrop, className: "block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition p-6 text-center", children: [_jsx("input", { type: "file", accept: accept, multiple: multiple, onChange: onChange, className: "hidden" }), _jsx(Upload, { className: "w-6 h-6 mx-auto text-[#9BD2FF]" }), _jsx("div", { className: "mt-2 text-slate-200 font-medium", children: "D\u00E9posez vos fichiers ici" }), _jsx("div", { className: "text-sm text-slate-400", children: "ou cliquez pour parcourir" }), _jsx("div", { className: "text-xs text-slate-500 mt-1", children: "PDF, JPG/PNG, max 10 Mo/fichier" })] }));
}
