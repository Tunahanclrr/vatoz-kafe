export async function withTimeout<T>(promise: PromiseLike<T>, ms = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// supabase-js bazen (özellikle arka planda token yenileme sırasında) tek bir isteği
// anormal derecede yavaşlatabiliyor. Kritik ilk yüklemelerde (oturum/profil kontrolü)
// tek seferlik zaman aşımına güvenmek yerine birkaç kez kısa aralıklarla yeniden dene.
export async function withRetry<T>(
  factory: () => PromiseLike<T>,
  { attempts = 2, timeoutMs = 9000, delayMs = 300 }: { attempts?: number; timeoutMs?: number; delayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await withTimeout(factory(), timeoutMs);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
