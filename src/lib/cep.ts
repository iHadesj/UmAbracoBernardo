import { onlyDigits } from './format'

export interface CepAddress {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

export type CepErrorKind = 'invalid' | 'not_found' | 'network'

export class CepError extends Error {
  kind: CepErrorKind
  constructor(kind: CepErrorKind) {
    super(
      kind === 'invalid'
        ? 'CEP precisa ter 8 dígitos.'
        : kind === 'not_found'
          ? 'Não encontramos esse CEP.'
          : 'Não foi possível consultar o CEP agora.',
    )
    this.kind = kind
  }
}

const cache = new Map<string, CepAddress>()

/** Consulta o ViaCEP (https://viacep.com.br) */
export async function lookupCep(raw: string, signal?: AbortSignal): Promise<CepAddress> {
  const cep = onlyDigits(raw)
  if (cep.length !== 8) throw new CepError('invalid')
  const hit = cache.get(cep)
  if (hit) return hit

  let res: Response
  try {
    res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new CepError('network')
  }
  if (res.status === 400) throw new CepError('invalid')
  if (!res.ok) throw new CepError('network')

  const data = (await res.json()) as Partial<CepAddress> & { erro?: boolean | string }
  if (data.erro) throw new CepError('not_found')

  const addr: CepAddress = {
    cep: data.cep ?? cep,
    logradouro: data.logradouro ?? '',
    complemento: data.complemento ?? '',
    bairro: data.bairro ?? '',
    localidade: data.localidade ?? '',
    uf: data.uf ?? '',
  }
  cache.set(cep, addr)
  return addr
}
