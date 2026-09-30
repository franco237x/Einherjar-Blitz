import type { BannerDef, RewardItem } from '@/constants/gachaData';
import { createOperationId } from '@/services/economy';
import { callGameApi } from '@/services/gameApi';

interface GachaPullResponse {
  results: { itemId: string; name: string }[];
  balance: number;
}

/**
 * Asks the server to perform the pull. The server rolls the rewards, charges
 * the banner cost and writes the inventory in one transaction; the browser
 * only receives the result to animate it.
 */
export async function performGachaPull(
  banner: BannerDef,
  amount: 1 | 10,
  operationId = createOperationId('gacha')
): Promise<RewardItem[]> {
  const { results } = await callGameApi<GachaPullResponse>('/api/juego/gacha', {
    bannerId: banner.id,
    amount,
    operationId,
  });
  return results.map((result) => {
    const reward = banner.rewards.find((item) => item.name === result.name);
    if (!reward) throw new Error('El servidor devolvió una recompensa desconocida.');
    return reward;
  });
}
