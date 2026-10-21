"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import { analyzeKeywords } from "@/lib/app-store/keywords";
import { FIELD_INFO, isValidUrl, type Listing, type ListingField } from "@/lib/app-store/listing";
import { countCharacters, METADATA_LIMITS } from "@/lib/app-store/metadata";

type FieldProps = {
  field: ListingField;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent-soft";

/** A labelled field with the App Store limit drawn as a thin meter under it. */
export function ListingField({ field, value, placeholder, rows, onChange }: FieldProps) {
  const info = FIELD_INFO[field];
  const limit = field in METADATA_LIMITS ? METADATA_LIMITS[field as keyof typeof METADATA_LIMITS] : null;
  const length = countCharacters(value);
  const isUrl = field.endsWith("Url");

  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{info.label}</span>
        {limit && (
          <span className={`text-xs tabular-nums ${length > limit ? "font-medium text-danger" : "text-ink-3"}`}>
            {length} / {limit}
          </span>
        )}
      </span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-label={info.label}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type={isUrl ? "url" : "text"}
          value={value}
          placeholder={placeholder ?? (isUrl ? "https://" : undefined)}
          aria-label={info.label}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${isUrl ? "font-mono text-[13px]" : ""}`}
        />
      )}
      {limit && <Meter length={length} limit={limit} />}
      {isUrl && !isValidUrl(value) ? (
        <span className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="size-3.5" />
          Use a full address, like https://example.com/support
        </span>
      ) : (
        <span className="text-xs text-ink-3">{info.hint}</span>
      )}
    </label>
  );
}

function Meter({ length, limit }: { length: number; limit: number }) {
  const ratio = Math.min(length / limit, 1);
  const color = length > limit ? "bg-danger" : ratio > 0.9 ? "bg-[#e5a03c]" : "bg-accent";
  return (
    <span className="h-1 overflow-hidden rounded-full bg-raised" aria-hidden>
      <span className={`block h-full rounded-full transition-[width] ${color}`} style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}

/** Keywords as chips, with the two fixes that free the most room. */
export function KeywordsField({
  listing,
  placeholder,
  onChange,
}: {
  listing: Listing;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const report = analyzeKeywords(listing.keywords, listing.name, listing.subtitle);

  return (
    <div className="grid gap-3">
      <ListingField field="keywords" value={listing.keywords} placeholder={placeholder} rows={2} onChange={onChange} />

      {report.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Keyword list">
          {report.keywords.map((keyword) => {
            const repeated = report.repeated.includes(keyword);
            return (
              <span
                key={keyword}
                className={`rounded-md px-2 py-1 text-xs ${repeated ? "bg-[#fdf3e3] text-[#9a5b0b] line-through decoration-[#e5a03c]/60" : "bg-raised text-ink-2"}`}
                title={repeated ? "Already covered by the name or subtitle" : undefined}
              >
                {keyword}
              </span>
            );
          })}
        </div>
      )}

      {(report.saved > 0 || report.repeated.length > 0) && (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-raised/60 p-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <Sparkles className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            {report.saved > 0 && (
              <p>
                Removing spaces and duplicates frees <b>{report.saved}</b> characters.
              </p>
            )}
            {report.repeated.length > 0 && (
              <p className="mt-0.5 text-ink-2">
                {report.repeated.length === 1 ? "One keyword repeats" : `${report.repeated.length} keywords repeat`} words
                from your name or subtitle, which search already uses.
              </p>
            )}
          </div>
          <button
            onClick={() => {
              const keep = report.keywords.filter((keyword) => !report.repeated.includes(keyword));
              onChange(keep.join(","));
            }}
            className="shrink-0 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-medium shadow-soft transition hover:bg-hover"
          >
            Tidy up
          </button>
        </div>
      )}
    </div>
  );
}
