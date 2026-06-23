export interface Emitter {
  name: string;
  nif: string;
  address: string;
  phone?: string;
  iban: string;
  defaultPaymentMethod: string;
  defaultDueTerms: string;
  ivaRate: number;
  irpfRate: number;
  internationalLegalNote: string;
}

export const DEFAULT_INTERNATIONAL_LEGAL_NOTE =
  'Operación no sujeta al IVA español en virtud del art. 69 de la Ley 37/1992 del IVA. (Exportación de servicios no sujeta a IVA).';

export function isEmitterComplete(emitter: Emitter): boolean {
  return Boolean(
    emitter.name.trim() && emitter.nif.trim() && emitter.address.trim() && emitter.iban.trim(),
  );
}

export function createDefaultEmitter(): Emitter {
  return {
    name: '',
    nif: '',
    address: '',
    phone: '',
    iban: '',
    defaultPaymentMethod: 'Transferencia',
    defaultDueTerms: 'Al contado',
    ivaRate: 0.21,
    irpfRate: 0.07,
    internationalLegalNote: DEFAULT_INTERNATIONAL_LEGAL_NOTE,
  };
}

/** Perfil guardado (varios emisores precargables). */
export interface EmitterProfile extends Emitter {
  id: string;
  /** Nombre corto en el selector (ej. "Autónomo", "SL 2024"). */
  label: string;
  updatedAt: string;
}

export function emitterFromProfile(profile: EmitterProfile): Emitter {
  return {
    name: profile.name,
    nif: profile.nif,
    address: profile.address,
    phone: profile.phone,
    iban: profile.iban,
    defaultPaymentMethod: profile.defaultPaymentMethod,
    defaultDueTerms: profile.defaultDueTerms,
    ivaRate: profile.ivaRate,
    irpfRate: profile.irpfRate,
    internationalLegalNote: profile.internationalLegalNote,
  };
}

export function createEmitterProfile(label: string, data?: Partial<Emitter>): EmitterProfile {
  const base = createDefaultEmitter();
  const merged = { ...base, ...data };
  return {
    id: crypto.randomUUID(),
    label: label.trim() || 'Nuevo perfil',
    updatedAt: new Date().toISOString(),
    ...merged,
  };
}

export function profileFromEmitterData(
  id: string,
  label: string,
  data: Emitter,
): EmitterProfile {
  return {
    id,
    label,
    updatedAt: new Date().toISOString(),
    ...data,
  };
}
