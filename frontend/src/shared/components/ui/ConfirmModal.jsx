import Modal from "./Modal";

export function ConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      variant={danger ? "delete" : undefined}
      isOpen={true}
      onClose={onCancel}
      title={title}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
    >
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </Modal>
  );
}
