"use client";

import {
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";

type TagInputProps = {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  description?: string;
};

export type TagInputHandle = {
  commitPending: () => void;
};

export const TagInput = forwardRef<TagInputHandle, TagInputProps>(
  ({ label, items, onChange, placeholder, description }, ref) => {
    const [value, setValue] = useState("");

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (items.includes(trimmed)) {
        setValue("");
        return;
      }
      onChange([...items, trimmed]);
      setValue("");
    };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const removeItem = (text: string) => {
    onChange(items.filter((item) => item !== text));
  };

    useImperativeHandle(ref, () => ({ commitPending: handleSubmit }), [value, items]);

    return (
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
          {description ? (
            <p className="text-xs text-muted-foreground/80">{description}</p>
          ) : null}
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border border-border bg-card/60 p-3 text-base text-foreground focus:border-primary focus:outline-none"
        />
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="group inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm text-primary"
              >
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => removeItem(item)}
                  className="text-xs text-primary/70 transition hover:text-primary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Press Enter to turn what you typed into a bubble.
        </p>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";
