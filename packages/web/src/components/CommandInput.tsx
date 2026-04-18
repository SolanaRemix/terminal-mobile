import React, { useState, useRef, useEffect } from "react";
import { KNOWN_COMMANDS, parseCommand } from "@terminal-mobile/shared";
import type { TerminalCommand } from "@terminal-mobile/shared";
import styles from "./CommandInput.module.css";

interface CommandInputProps {
  onSubmit: (cmd: TerminalCommand) => void;
  disabled?: boolean;
}

export function CommandInput({ onSubmit, disabled }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = KNOWN_COMMANDS.filter((c) => {
    const typed = value.trim().toLowerCase();
    return typed === "/terminal" ||
      (`/terminal ${c.name}`.startsWith(typed) && typed.length > 0);
  });

  useEffect(() => {
    const isCmd = value.trim().startsWith("/terminal");
    setShowSuggestions(isCmd && suggestions.length > 0);
  }, [value, suggestions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = parseCommand(value);
    if (cmd) {
      onSubmit(cmd);
      setValue("");
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (name: string) => {
    setValue(`/terminal ${name}`);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <span className={styles.prefix}>$</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/terminal help"
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={disabled || !parseCommand(value)}
        >
          Run
        </button>
      </form>
      {showSuggestions && (
        <ul className={styles.suggestions} role="listbox">
          {suggestions.map((c) => (
            <li
              key={c.name}
              className={styles.suggestion}
              role="option"
              aria-selected={false}
              onClick={() => applySuggestion(c.name)}
            >
              <span className={styles.suggestCmd}>/terminal {c.name}</span>
              <span className={styles.suggestDesc}>{c.description}</span>
              <span
                className={`${styles.risk} ${styles[`risk-${c.riskLevel}`]}`}
              >
                {c.riskLevel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
