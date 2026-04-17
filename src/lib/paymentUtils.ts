/**
 * Peach Safe-Pay 결제 관련 유틸리티
 */

export const SAFE_PAY_FEE_RATE = 0.035; // 3.5% 수수료
export const MIN_SAFE_PAY_AMOUNT = 100; // 최소 안심결제 금액 ($100 미만은 현장 거래 권장)

/**
 * 수수료 계산 함수
 * @param amount 거래 금액
 * @returns 플랫폼 수수료
 */
export function calculatePeachFee(amount: number): number {
  return Math.round(amount * SAFE_PAY_FEE_RATE * 100) / 100;
}

/**
 * 정산 금액 계산 함수 (금액 - 수수료)
 * @param amount 거래 금액
 * @returns 판매자 정산액
 */
export function calculateSellerPayout(amount: number): number {
  const fee = calculatePeachFee(amount);
  return amount - fee;
}

/**
 * 거래 상태별 뱃지 스타일 및 텍스트 반환
 */
export function getTransactionStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { label: '결제 대기', color: 'bg-amber-100 text-amber-700', icon: '⏳' };
    case 'paid':
      return { label: '결제 완료', color: 'bg-blue-100 text-blue-700', icon: '💳' };
    case 'completed':
      return { label: '거래 완료', color: 'bg-green-100 text-green-700', icon: '✅' };
    case 'cancelled':
      return { label: '거래 취소', color: 'bg-gray-100 text-gray-700', icon: '❌' };
    default:
      return { label: '알 수 없음', color: 'bg-gray-50 text-gray-400', icon: '❔' };
  }
}
