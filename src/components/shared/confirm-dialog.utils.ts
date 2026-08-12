import type React from 'react';

/**
 * Resolves the text shown on the confirm button based on loading state.
 */
export function getConfirmButtonLabel(isLoading: boolean, confirmText: string): string {
  return isLoading ? 'Processing...' : confirmText;
}

/**
 * Builds the click handler for the confirm button. Prevents the default
 * AlertDialogAction behavior (which would auto-close the dialog) so that
 * onConfirm can control closing (e.g. after an async action completes).
 */
export function createConfirmClickHandler(
  onConfirm: () => void
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
  };
}
