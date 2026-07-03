"use client";

import { FormEvent, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SearchSuggestion = {
  label: string;
  value: string;
  detail?: string;
  submitValue?: string;
};

type AutocompleteSearchFormProps = {
  actionPath: string;
  buttonLabel?: string;
  helperText?: string;
  initialValue: string;
  label: string;
  multiValue?: boolean;
  paramName: string;
  pendingLabel?: string;
  placeholder: string;
  suggestionsEndpoint: string;
  tone: "amber" | "sky";
};

const toneClasses = {
  amber: {
    button: "bg-amber-300 text-zinc-950 hover:bg-amber-200",
    focus:
      "focus:border-amber-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-amber-300/15",
    helper: "text-amber-100/75",
    optionHover: "hover:border-amber-300/35 hover:bg-amber-300/10",
    spinner: "border-amber-300/30 border-t-amber-200",
  },
  sky: {
    button: "bg-sky-300 text-zinc-950 hover:bg-sky-200",
    focus:
      "focus:border-sky-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-sky-300/15",
    helper: "text-sky-100/75",
    optionHover: "hover:border-sky-300/35 hover:bg-sky-300/10",
    spinner: "border-sky-300/30 border-t-sky-200",
  },
};

export function AutocompleteSearchForm({
  actionPath,
  buttonLabel = "Search",
  helperText,
  initialValue,
  label,
  multiValue = false,
  paramName,
  pendingLabel = "Searching",
  placeholder,
  suggestionsEndpoint,
  tone,
}: AutocompleteSearchFormProps) {
  const inputId = useId();
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedSubmitValue, setSelectedSubmitValue] = useState<string | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);
  const classes = toneClasses[tone];

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    const controller = new AbortController();
    const query = multiValue ? getActiveToken(inputValue) : inputValue.trim();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await fetch(
          `${suggestionsEndpoint}?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );
        const body = (await response.json().catch(() => null)) as {
          suggestions?: SearchSuggestion[];
        } | null;

        if (latestRequest.current !== requestId) {
          return;
        }

        setSuggestions(Array.isArray(body?.suggestions) ? body.suggestions : []);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (latestRequest.current === requestId) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputValue, isFocused, multiValue, suggestionsEndpoint]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValue =
      !multiValue && selectedSubmitValue
        ? selectedSubmitValue
        : inputValue.trim();

    if (!nextValue) {
      return;
    }

    const params = new URLSearchParams();
    params.set(paramName, nextValue);

    startTransition(() => {
      router.push(`${actionPath}?${params.toString()}`);
    });
  }

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    if (multiValue) {
      setInputValue(replaceActiveToken(inputValue, suggestion.value));
      setSelectedSubmitValue(null);
    } else {
      setInputValue(suggestion.value);
      setSelectedSubmitValue(suggestion.submitValue ?? suggestion.value);
    }

    setSuggestions([]);
    setIsFocused(false);
  }

  const showSuggestions =
    isFocused && (suggestions.length > 0 || isLoadingSuggestions);

  return (
    <form className="relative w-full lg:max-w-xl" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          aria-autocomplete="list"
          aria-label={label}
          autoComplete="off"
          className={`h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 ${classes.focus}`}
          id={inputId}
          name={paramName}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onChange={(event) => {
            setInputValue(event.target.value);
            setSelectedSubmitValue(null);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          spellCheck={false}
          type="text"
          value={inputValue}
        />
        <button
          aria-busy={isPending}
          className={`h-12 rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 ${classes.button}`}
          disabled={isPending}
          type="submit"
        >
          {isPending ? pendingLabel : buttonLabel}
        </button>
      </div>

      {helperText ? (
        <p className={`mt-2 text-xs leading-5 ${classes.helper}`}>
          {helperText}
        </p>
      ) : null}

      {showSuggestions ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
          {isLoadingSuggestions ? (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400">
              <span
                className={`h-4 w-4 animate-spin rounded-full border-2 ${classes.spinner}`}
              />
              Loading suggestions
            </div>
          ) : null}
          {suggestions.map((suggestion) => (
            <button
              className={`block w-full border-t border-white/10 px-4 py-3 text-left transition first:border-t-0 ${classes.optionHover}`}
              key={`${suggestion.label}-${suggestion.value}-${suggestion.submitValue ?? ""}`}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSuggestionSelect(suggestion);
              }}
              type="button"
            >
              <span className="block text-sm font-semibold text-white">
                {suggestion.label}
              </span>
              {suggestion.detail ? (
                <span className="mt-1 block text-xs text-zinc-500">
                  {suggestion.detail}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function getActiveToken(value: string) {
  const parts = value.split(",");

  return parts[parts.length - 1]?.trim() ?? "";
}

function replaceActiveToken(value: string, nextToken: string) {
  const parts = value.split(",");
  parts[parts.length - 1] = ` ${nextToken}`;

  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
