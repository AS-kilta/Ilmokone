export default interface EventAttributes {
  id: string;
  title: string;
  slug: string;
  date: Date | null;
  endDate: Date | null;
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
  openQuotaSize: number;
  description: string | null;
  price: string | null;
  paymentBarcode: string | null;
  receiver: string | null;
  message: string | null;
  dueDate: Date | null;
  showBarcode: boolean;
  bankId: string | null;
  location: string | null;
  facebookUrl: string | null;
  webpageUrl: string | null;
  category: string;
  draft: boolean;
  listed: boolean;
  signupsPublic: boolean;
  nameQuestion: boolean;
  emailQuestion: boolean;
  verificationEmail: string | null;
  updatedAt: Date;
}
