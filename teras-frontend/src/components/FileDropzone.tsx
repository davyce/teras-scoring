//src/components/FileDropzone.tsx

import { useCallback } from "react";
import { Upload } from "lucide-react";

type Props = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
};

export default function FileDropzone({ onFiles, accept, multiple }: Props) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) onFiles(Array.from(e.target.files));
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      onFiles(Array.from(e.dataTransfer.files));
    },
    [onFiles]
  );

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition p-6 text-center"
    >
      <input type="file" accept={accept} multiple={multiple} onChange={onChange} className="hidden" />
      <Upload className="w-6 h-6 mx-auto text-[#9BD2FF]" />
      <div className="mt-2 text-slate-200 font-medium">Déposez vos fichiers ici</div>
      <div className="text-sm text-slate-400">ou cliquez pour parcourir</div>
      <div className="text-xs text-slate-500 mt-1">PDF, JPG/PNG, max 10 Mo/fichier</div>
    </label>
  );
}


