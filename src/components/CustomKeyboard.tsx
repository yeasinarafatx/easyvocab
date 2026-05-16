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
      <div className="mx-auto max-w-lg rounded-2xl bg-[#0b1224]/90 p-2 shadow-lg shadow-black/40">
        <div className="flex justify-center gap-1">
          {keys[0].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-8 rounded-md bg-white/15 text-sm font-semibold text-white transition active:scale-95 active:bg-white/25 sm:w-9"
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-center gap-1 pl-3 pr-1">
          {keys[1].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-8 rounded-md bg-white/15 text-sm font-semibold text-white transition active:scale-95 active:bg-white/25 sm:w-9"
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-center gap-1 pl-6 pr-1">
          {keys[2].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="h-11 w-8 rounded-md bg-white/15 text-sm font-semibold text-white transition active:scale-95 active:bg-white/25 sm:w-9"
            >
              {key.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={onBackspace}
            className="h-11 w-14 rounded-md bg-white/20 text-xs font-bold text-white transition active:scale-95 active:bg-white/30 sm:w-16"
          >
            BACK
          </button>
        </div>
        <div className="mt-1 flex justify-center">
          <button
            type="button"
            onClick={onEnter}
            className="h-11 w-24 rounded-md bg-white/20 text-xs font-bold text-white transition active:scale-95 active:bg-white/30"
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;
