import { Dispatch, KeyboardEventHandler, MouseEventHandler, SetStateAction, useEffect, useState } from "react";
import { keyBoardDivEvent } from "../functions/utils";

type modalParams = {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  title: string;
  body: JSX.Element;
  edtSearch?: JSX.Element;
  showButtonExit?: boolean;
  corBotaoExit?: string;
  titutloBotaoExit?: string;
  onclickExit?: MouseEventHandler<HTMLButtonElement>
}

export default function Modal({ showModal, setShowModal, title, body, edtSearch, showButtonExit = true, corBotaoExit = 'red', titutloBotaoExit='Fechar', onclickExit }: modalParams) {


  useEffect(() => {
    const close = (e:any) => {
      if(e.keyCode === 27){
        setShowModal(false)
      }
    }
    window.addEventListener('keydown', close)
  return () => window.removeEventListener('keydown', close)


  },[])



  return (
    <>
      {showModal ? (
        <>
          <div 
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"            
          >
            <div className="relative my-6 mx-2">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h2 className="text-md rounded-t-md font-bold text-black bg-amber-400 p-2">
                    {title}
                  </h2>
                  <button
                    className="p-1 ml-auto border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="text-black opacity-40 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  {body}
                </div>
                {/*footer*/}
                {showButtonExit && <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  {edtSearch}
                  <button
                    className={`bg-${corBotaoExit}-500 text-white active:bg-${corBotaoExit}-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150`}
                    type="button"
                    onClick={onclickExit === undefined ? () => setShowModal(false): onclickExit}
                  >
                    {titutloBotaoExit}
                  </button>
                </div>}
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}