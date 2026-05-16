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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 p-2 dark:bg-gray-800">
      <div className="flex flex-col items-center space-y-1">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex space-x-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="flex h-12 w-8 items-center justify-center rounded bg-white text-xl font-bold text-gray-800 dark:bg-gray-600 dark:text-white sm:w-10"
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        ))}
        <div className="flex space-x-1">
          <button
            onClick={onBackspace}
            className="flex h-12 w-16 items-center justify-center rounded bg-white text-xl font-bold text-gray-800 dark:bg-gray-600 dark:text-white"
          >
            Bksp
          </button>
          <button
            onClick={onEnter}
            className="flex h-12 w-16 items-center justify-center rounded bg-white text-xl font-bold text-gray-800 dark:bg-gray-600 dark:text-white"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;
