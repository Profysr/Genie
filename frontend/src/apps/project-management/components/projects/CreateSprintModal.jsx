import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/components/ui/toast";
import { cn } from "@/shared/lib/utils";
import { Zap } from "lucide-react";

const EMPTY_FORM = { name: "", goal: "", start_date: "", end_date: "" };
const EMPTY_ERRORS = { name: "", start_date: "", end_date: "", date_range: "" };

export function CreateSprintModal({
  open,
  onClose,
  createSprint,
  onSelectSprint,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  const validate = () => {
    const next = { ...EMPTY_ERRORS };
    if (!form.name.trim()) next.name = "Sprint name is required.";
    if (!form.start_date) next.start_date = "Start date is required.";
    if (!form.end_date) next.end_date = "End date is required.";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      next.date_range = "End date must be after start date.";
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleConfirm = () => {
    if (!validate()) return;
    createSprint.mutate(form, {
      onSuccess: (sprint) => {
        onClose();
        setForm(EMPTY_FORM);
        setErrors(EMPTY_ERRORS);
        onSelectSprint(sprint);
      },
      onError: () => toast({ title: "Failed to create sprint", type: "error" }),
    });
  };

  const handleClose = () => {
    onClose();
    setForm(EMPTY_FORM);
    setErrors(EMPTY_ERRORS);
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: "", date_range: "" }));
    },
  });

  const isValid =
    form.name.trim() &&
    form.start_date &&
    form.end_date &&
    form.end_date >= form.start_date;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="New Sprint"
      confirmLabel="Create Sprint"
      confirmVariant="primary"
      isLoading={createSprint.isPending}
      isConfirmDisabled={!isValid || createSprint.isPending}
      onConfirm={handleConfirm}
      icon={Zap}
      maxWidth="480px"
    >
      <div className="space-y-4 py-1">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Sprint name <span className="text-destructive">*</span>
          </label>
          <input
            autoFocus
            className={cn(
              "w-full text-sm border rounded-sm px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring",
              errors.name && "border-destructive focus:ring-destructive/30",
            )}
            placeholder="e.g. Sprint 3"
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            {...field("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name}</p>
          )}
        </div>

        {/* Goal */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Goal{" "}
            <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            className="w-full text-sm border rounded-sm px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring"
            placeholder="What will this sprint accomplish?"
            {...field("goal")}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Start date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              className={cn(
                "w-full text-sm border rounded-sm px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring",
                errors.start_date && "border-destructive focus:ring-destructive/30",
              )}
              {...field("start_date")}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive mt-1">{errors.start_date}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              End date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              className={cn(
                "w-full text-sm border rounded-sm px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring",
                errors.end_date && "border-destructive focus:ring-destructive/30",
              )}
              min={form.start_date || undefined}
              {...field("end_date")}
            />
            {errors.end_date && (
              <p className="text-xs text-destructive mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        {errors.date_range && (
          <p className="text-xs text-destructive -mt-2">{errors.date_range}</p>
        )}
      </div>
    </Modal>
  );
}
