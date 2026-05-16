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

  return (
    <div
      data-testid="custom-keyboard"
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto bg-[#0b1224]/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur"
    >
      <div className="mx-auto max-w-lg space-y-1.5">
        <div className="grid grid-cols-10 gap-1">
          {keys[0].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-full rounded-md bg-white/15 text-sm font-semibold text-white shadow-sm shadow-black/40 transition active:scale-95 active:bg-white/25"
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-9 gap-1 px-2">
          {keys[1].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-full rounded-md bg-white/15 text-sm font-semibold text-white shadow-sm shadow-black/40 transition active:scale-95 active:bg-white/25"
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 px-6">
          {keys[2].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-full rounded-md bg-white/15 text-sm font-semibold text-white shadow-sm shadow-black/40 transition active:scale-95 active:bg-white/25"
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={onBackspace}
            className="h-12 w-full rounded-md bg-white/20 text-sm font-bold text-white shadow-sm shadow-black/40 transition active:scale-95 active:bg-white/30"
          >
            BKSP
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="h-12 w-full rounded-md bg-white/20 text-sm font-bold text-white shadow-sm shadow-black/40 transition active:scale-95 active:bg-white/30"
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;
