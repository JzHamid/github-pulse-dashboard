"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

type SearchFormProps = {
  initialUsername: string;
  actionPath?: string;
};

export function SearchForm({
  initialUsername,
  actionPath = "/github",
}: SearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formUsername = formData.get("username");
    const nextUsername =
      typeof formUsername === "string"
        ? formUsername.trim().replace(/^@+/, "")
        : "";

    if (!nextUsername) {
      return;
    }

    startTransition(() => {
      router.push(`${actionPath}?username=${encodeURIComponent(nextUsername)}`);
    });
  }

  return (
    <form
      className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="github-username">
        GitHub username
      </label>
      <input
        aria-label="GitHub username"
        autoComplete="off"
        className="h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-emerald-300/15"
        id="github-username"
        key={initialUsername}
        name="username"
        placeholder="JzHamid"
        required
        spellCheck={false}
        type="text"
        defaultValue={initialUsername}
      />
      <button
        aria-busy={isPending}
        className="h-12 rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Analyzing" : "Search"}
      </button>
    </form>
  );
}
