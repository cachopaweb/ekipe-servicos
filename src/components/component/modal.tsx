import { Dispatch, MouseEventHandler, SetStateAction, useEffect } from "react";

type modalParams = {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  title: string;
  body: JSX.Element;
  edtSearch?: JSX.Element;
  showButtonExit?: boolean;
  corBotaoExit?: string;
  titutloBotaoExit?: string;
  onclickExit?: MouseEventHandler<HTMLButtonElement>;
}

export default function Modal({
  showModal,
  setShowModal,
  title,
  body,
  edtSearch,
  showButtonExit = true,
  corBotaoExit = 'red',
  titutloBotaoExit = 'Fechar',
  onclickExit
}: modalParams) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fade-in outline-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-amber-500 rounded-full"></span>
            <h2 className="text-lg font-bold text-stone-800 tracking-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            onClick={() => setShowModal(false)}
            title="Fechar (Esc)"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="relative p-5 sm:p-6 flex-auto overflow-y-auto max-h-[calc(92vh-125px)]">
          {body}
        </div>

        {/* Footer */}
        {showButtonExit && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/90 shrink-0">
            {edtSearch}
            <button
              className="px-5 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 hover:text-stone-900 border border-stone-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 active:scale-[0.98]"
              type="button"
              onClick={onclickExit === undefined ? () => setShowModal(false) : onclickExit}
            >
              {titutloBotaoExit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
