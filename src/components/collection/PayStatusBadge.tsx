import { Badge } from '../common';
import { PAY_STATUS_LABEL, type PayStatus } from '../../types/collection.types';

const VARIANT: Record<PayStatus, 'success' | 'warning' | 'error' | 'default'> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'error',
  vacant: 'default',
};

export function PayStatusBadge({ status }: { status: PayStatus }) {
  return (
    <Badge variant={VARIANT[status]} dot>
      {PAY_STATUS_LABEL[status]}
    </Badge>
  );
}

export function money(n: number | null | undefined): string {
  return `TZS ${Number(n ?? 0).toLocaleString('en-US')}`;
}
