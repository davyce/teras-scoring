import { jsx as _jsx } from "react/jsx-runtime";
export default function JsonEditor({ value, onChange, rows = 16, className = '' }) {
    return (_jsx("textarea", { className: `w-full font-mono text-sm p-3 border rounded-lg bg-transparent ${className}`, style: { borderColor: '#1B2740', color: '#EAF2FF' }, rows: rows, value: JSON.stringify(value, null, 2), onChange: (e) => {
            try {
                onChange(JSON.parse(e.target.value));
            }
            catch { /* ignore parse errors */ }
        } }));
}
