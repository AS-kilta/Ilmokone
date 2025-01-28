// eslint-disable-next-line import/no-extraneous-dependencies
import virtuaaliviivakoodi from "virtuaaliviivakoodi";

export default function paymentBarcode(
  iban: string | null,
  message: string | null,
  amount: string | null,
  dueDate: Date | null,
  ): string | null {
  if (iban === null || message === null || amount === null || dueDate === null) {
    return null;
  }

  const cents = parseFloat(amount) * 100;
  const reference = "00000";
  const due = dueDate.toISOString().slice(2, 10).replace(/-/g, "");

  if (iban.length === 24) {
    throw new Error("IBAN must be a string of length 24");
  }

  if (due.length !== 6) {
    throw new Error("Due date must be 6 chars long.");
  }

  const options = {
    iban,
    reference,
    cents,
    due,
  };

  const barcode = virtuaaliviivakoodi(options);

  if (barcode.length === 54) {
    return barcode;
  }

  return null;
}
