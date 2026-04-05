import React from 'react';
import { usePdfExport } from '../../hooks/usePdfExport';

interface Props {
  elementId: string;
  filename: string;
  label?: string;
}

export default function PdfDownloadButton({ elementId, filename, label = 'Download PDF' }: Props) {
  const { exportToPdf, exporting } = usePdfExport();

  return (
    <button
      onClick={() => exportToPdf(elementId, filename)}
      disabled={exporting}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download as PDF"
    >
      {exporting ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
