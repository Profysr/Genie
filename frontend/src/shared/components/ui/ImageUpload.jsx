import { useRef, useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/shared/lib/utils";

/**
 * Reusable image-upload control.
 *
 * Props
 * ─────
 * value           string | null   — URL of the currently-saved image (from server).
 * onChange        (File|null)=>void — called with the picked File, or null on remove.
 * aspectRatio     string          — CSS aspect-ratio, e.g. "1/1" (avatar), "2/1" (logo). Default "1/1".
 * displayWidth    number          — pixel width of the preview box. Height is derived from aspectRatio. Default 56.
 * shape           "rounded"|"circle"|"square"  — border-radius style. Default "rounded".
 * placeholder     string          — text shown in the box when there is no image (e.g. workspace initial). Default "".
 * placeholderCls  string          — Tailwind classes for the empty-state box (bg + text colour). Default primary colours.
 * uploadLabel     string          — label on the upload button. Default "Upload".
 * hint            string | null   — small helper line below the control.
 * disabled        bool            — hides controls; preview-only mode.
 * accept          string          — MIME filter for the file picker. Default "image/*".
 * allowedTypes    string[]|null   — MIME whitelist for client-side validation. Null = no check.
 * maxSizeMB       number|null     — Max file size in MB for client-side validation. Null = no check.
 * onError         (msg)=>void     — called when a file fails validation instead of being accepted.
 */
export default function ImageUpload({
  value = null,
  onChange,
  aspectRatio = "1/1",
  displayWidth = 56,
  shape = "rounded",
  placeholder = "",
  placeholderCls = "bg-primary text-primary-foreground",
  uploadLabel = "Upload",
  hint,
  disabled = false,
  accept = "image/*",
  allowedTypes = null,
  maxSizeMB = null,
  onError,
}) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  // Revoke the blob URL when it's no longer needed to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      onError?.(`File must be one of: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`File must be smaller than ${maxSizeMB} MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onChange?.(file);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null);
  };

  const displaySrc = preview || value;

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "square"
      ? "rounded-none"
      : "rounded-md";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {/* ── Preview box ── */}
        <div
          className={cn(
            "flex-shrink-0 overflow-hidden flex items-center justify-center font-bold",
            shapeClass,
            !displaySrc && placeholderCls,
          )}
          style={{
            width: displayWidth,
            aspectRatio,
            fontSize: Math.max(12, displayWidth * 0.3),
          }}
        >
          {displaySrc ? (
            <img
              src={displaySrc}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <span>{placeholder}</span>
          )}
        </div>

        {/* ── Controls ── */}
        {!disabled && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {preview ? "Change" : uploadLabel}
              </Button>

              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  onClick={handleRemove}
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </Button>
              )}
            </div>

            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      </div>

      {/* Hint in disabled/preview-only mode still shows */}
      {disabled && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
