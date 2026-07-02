import React from 'react';

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const CustomKeyboard: React.FC<CustomKeyboardProps> = ({ onKeyPress, onBackspace, onEnter }) => {
  const keys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const keyClass =
    "flex h-11 flex-1 items-center justify-center rounded-md bg-white/15 text-sm font-semibold text-white transition active:scale-95 active:bg-white/25 sm:h-12 sm:text-base";

  return (
    <div
      data-testid="custom-keyboard"
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto border-t border-white/10 bg-[#0b1224]/95 px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-1.5 rounded-2xl bg-[#0b1224]/90 p-2.5 shadow-lg shadow-black/40 sm:gap-2 sm:p-3">
        <div className="flex gap-1.5 sm:gap-2">
          {keys[0].map((key) => (
            <button key={key} type="button" onClick={() => onKeyPress(key)} className={keyClass}>
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 px-4 sm:gap-2 sm:px-6">
          {keys[1].map((key) => (
            <button key={key} type="button" onClick={() => onKeyPress(key)} className={keyClass}>
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {keys[2].map((key) => (
            <button key={key} type="button" onClick={() => onKeyPress(key)} className={keyClass}>
              {key.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={onBackspace}
            className="flex h-11 flex-[1.6] items-center justify-center rounded-md bg-white/20 text-xs font-bold text-white transition active:scale-95 active:bg-white/30 sm:h-12 sm:text-sm"
          >
            BACK
          </button>
        </div>
        <button
          type="button"
          onClick={onEnter}
          className="h-11 w-full rounded-md bg-white/20 text-xs font-bold text-white transition active:scale-95 active:bg-white/30 sm:h-12 sm:text-sm"
        >
          ENTER
        </button>
      </div>
    </div>
  );
};

export default CustomKeyboard;
