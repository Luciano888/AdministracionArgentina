import { createContext, useContext } from "react";

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Texto del botón que confirma. Por defecto «Borrar». */
  confirmLabel?: string;
};

export type Feedback = {
  /** Abre el diálogo y resuelve true si confirman, false si cancelan. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Aviso breve que se va solo. */
  toast: (text: string) => void;
};

export const FeedbackContext = createContext<Feedback | null>(null);

function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("Falta <FeedbackProvider> arriba en el árbol");
  return ctx;
}

export function useConfirm() {
  return useFeedback().confirm;
}

export function useToast() {
  return useFeedback().toast;
}
