// eslint-disable-next-line import/no-extraneous-dependencies
import virtuaaliviivakoodi from "virtuaaliviivakoodi";

export default function paymentBarcode(
  iban: string | null,
  message: string | null,
  amount: string | null,
  dueDate: Date | null,
): string | null {

  let reference: string;
  let cents: number;
  let due: string;

  if (iban === null ) {
    return null;
  }

  switch (message) {
    case null:
      reference = "00000";
      break;
    default:
      reference = message.replace(/\D/g, "");
      if (reference.length < 4) {
        reference = "00000";
      }
      break;
  }

  switch (amount) {
    case null:
      cents = 0;
      break;
    default:
      cents = parseFloat(amount.replace(/,/g, ".").replace(/\D\./g, "")) * 100;
      break;
  }

  switch (dueDate) {
    case null:
      due = "000000";
      break;
    default:
      due = dueDate.toISOString().slice(2, 10).replace(/-/g, "");
      break;
  }

  const options = {
    iban,
    reference,
    cents,
    due,
  };

  try {
    return virtuaaliviivakoodi(options);
  } catch (error) {
    return null;
  }
}
