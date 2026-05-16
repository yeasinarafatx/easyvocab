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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/50 p-1 backdrop-blur-sm sm:p-2">
      <div className="mx-auto flex max-w-lg flex-col items-center space-y-1.5">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full flex-wrap justify-center gap-1.5">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="flex h-11 flex-1 items-center justify-center rounded-md bg-white/20 text-lg font-bold text-white transition-all active:scale-95 active:bg-white/30 sm:h-12 sm:rounded-lg"
                style={{ minWidth: '2rem' }}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        ))}
        <div className="flex w-full gap-1.5">
          <button
            onClick={onBackspace}
            className="flex h-12 flex-[1.5] items-center justify-center rounded-md bg-white/20 text-sm font-bold text-white active:scale-95 active:bg-white/30 sm:rounded-lg"
          >
            BKSP
          </button>
          <button
            onClick={onEnter}
            className="flex h-12 flex-[1.5] items-center justify-center rounded-md bg-white/20 text-sm font-bold text-white active:scale-95 active:bg-white/30 sm:rounded-lg"
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;
