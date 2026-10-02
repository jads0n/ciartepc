'use client';

import { useState, useEffect } from 'react';

const CIPHER_CHARS = '01#@$%&*<>[]{}ABCDEF';

interface DecryptionTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function DecryptionText({ text, speed = 25, className = '' }: DecryptionTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        setIsDone(true);
        clearInterval(interval);
      }

      iteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`font-mono transition-opacity duration-300 ${className} ${isDone ? 'opacity-100' : 'opacity-90'}`}>
      {displayText || text}
    </span>
  );
}
