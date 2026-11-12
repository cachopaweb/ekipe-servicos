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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 outline-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-[8px] shadow-xl border border-ek-border overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ek-rule bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 bg-brand rounded-full" />
            <h2 className="text-base font-semibold text-ek-text tracking-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-ek-muted hover:text-ek-text hover:bg-ek-raised transition-colors"
            onClick={() => setShowModal(false)}
            title="Fechar (Esc)"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="relative p-5 flex-auto overflow-y-auto max-h-[calc(92vh-120px)]">
          {body}
        </div>

        {/* Footer */}
        {showButtonExit && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-ek-rule bg-ek-raised shrink-0">
            {edtSearch}
            <button
              className="ek-btn-secondary"
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
